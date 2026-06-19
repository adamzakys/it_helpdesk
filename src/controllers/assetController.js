const prisma = require('../config/database');

/**
 * Helper to map DB model Asset to frontend-expected Asset structure.
 */
const mapAsset = (asset) => {
  if (!asset) return null;
  return {
    ...asset,
    asset_name: `${asset.category?.category_name || 'Aset'} (${asset.asset_code})`,
    category: asset.category?.category_name || 'Umum',
    location: asset.department 
      ? `${asset.department.name} (${asset.department.location_name || ''})` 
      : 'Tidak Ada Lokasi',
  };
};

/**
 * 1. GET All Assets (with category & department information mapped)
 */
const getAllAssets = async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        category: true,
        department: true,
        user: {
          select: { id: true, full_name: true, nip: true }
        },
        parentRelationships: {
          include: {
            parentAsset: {
              include: { category: true }
            }
          }
        },
        childRelationships: {
          include: {
            childAsset: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: {
        asset_code: 'asc',
      },
    });

    const mappedAssets = assets.map(mapAsset);

    return res.status(200).json({
      success: true,
      count: mappedAssets.length,
      data: mappedAssets,
    });
  } catch (error) {
    console.error('Error saat mengambil daftar aset:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil daftar aset.',
      error: error.message,
    });
  }
};

/**
 * 2. POST Procure Asset (Pengadaan Stok Baru)
 */
const procureAsset = async (req, res) => {
  const {
    asset_code,
    category_id,
    status, // 'Spare', 'In Stock', 'Active', dll
    purchase_date,
    warranty_months,
    vendor,
    purchase_price,
    attributes, // JSON spesifikasi teknis
    performed_by_id,
  } = req.body;

  if (!asset_code || !category_id || !performed_by_id) {
    return res.status(400).json({
      success: false,
      message: 'Kolom asset_code, category_id, dan performed_by_id wajib diisi.',
    });
  }

  try {
    // Cek duplikasi kode aset
    const existingAsset = await prisma.asset.findUnique({
      where: { asset_code },
    });

    if (existingAsset) {
      return res.status(400).json({
        success: false,
        message: `Aset dengan Kode ${asset_code} sudah terdaftar di database.`,
      });
    }

    // Hitung tanggal garansi otomatis
    let pDate = purchase_date ? new Date(purchase_date) : new Date();
    let wExpiry = null;
    if (warranty_months) {
      wExpiry = new Date(pDate);
      wExpiry.setMonth(wExpiry.getMonth() + parseInt(warranty_months, 10));
    }

    const mergedAttributes = {
      ...(attributes || {}),
      vendor: vendor || 'Unknown Vendor',
      purchase_price: purchase_price ? parseFloat(purchase_price) : 0,
    };

    // Buat aset baru dalam satu transaksi database beserta logs procurement
    const newAsset = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          asset_code,
          category_id: parseInt(category_id, 10),
          status: status || 'Spare', // Status default pengadaan adalah In Stock/Spare
          purchase_date: pDate,
          warranty_expiry: wExpiry,
          attributes: mergedAttributes,
        },
        include: {
          category: true,
          department: true,
        }
      });

      // Catat log histori
      await tx.assetHistory.create({
        data: {
          asset_id: asset.id,
          action: 'PROCUREMENT',
          notes: `Pengadaan unit baru dari vendor: ${vendor || 'Unknown'}. Masa garansi ${warranty_months || 0} bulan.`,
          performed_by_id,
        },
      });

      return asset;
    });

    return res.status(201).json({
      success: true,
      message: `Aset ${asset_code} berhasil didaftarkan di log pengadaan.`,
      data: mapAsset(newAsset),
    });
  } catch (error) {
    console.error('Error saat mencatat pengadaan aset:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mencatat pengadaan aset.',
      error: error.message,
    });
  }
};

/**
 * 3. POST Mutate Asset (Rotasi/Mutasi Lokasi & Custodian)
 */
const mutateAsset = async (req, res) => {
  const { id } = req.params;
  const {
    department_id,
    user_id,
    status, // opsional jika status berubah (misal 'Active' atau 'Spare')
    notes,
    performed_by_id,
  } = req.body;

  if (!performed_by_id) {
    return res.status(400).json({
      success: false,
      message: 'Kolom performed_by_id (IT Support) wajib disertakan untuk keperluan log audit.',
    });
  }

  try {
    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      return res.status(404).json({
        success: false,
        message: 'Aset tidak ditemukan.',
      });
    }

    const updatedAsset = await prisma.$transaction(async (tx) => {
      // 1. Catat log histori
      await tx.assetHistory.create({
        data: {
          asset_id: id,
          action: 'MUTATION',
          from_dept_id: existingAsset.department_id,
          to_dept_id: department_id ? parseInt(department_id, 10) : null,
          from_user_id: existingAsset.user_id,
          to_user_id: user_id || null,
          notes: notes || 'Mutasi / Rotasi perangkat operasional lapangan.',
          performed_by_id,
        },
      });

      // 2. Update data Aset
      const asset = await tx.asset.update({
        where: { id },
        data: {
          department_id: department_id ? parseInt(department_id, 10) : null,
          user_id: user_id || null,
          status: status || undefined,
        },
        include: {
          category: true,
          department: true,
        }
      });

      return asset;
    });

    return res.status(200).json({
      success: true,
      message: `Aset ${updatedAsset.asset_code} berhasil dimutasi.`,
      data: mapAsset(updatedAsset),
    });
  } catch (error) {
    console.error('Error saat melakukan mutasi aset:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat melakukan mutasi aset.',
      error: error.message,
    });
  }
};

/**
 * 4. POST Transfer Component (Kanibalisasi Komponen Child)
 */
const transferComponent = async (req, res) => {
  const {
    component_asset_id, // Aset RAM/Mainboard yang dikanibal
    new_parent_asset_id, // PC target pemasangan baru
    notes,
    performed_by_id,
  } = req.body;

  if (!component_asset_id || !performed_by_id) {
    return res.status(400).json({
      success: false,
      message: 'Kolom component_asset_id dan performed_by_id wajib diisi.',
    });
  }

  try {
    // Cek keberadaan aset komponen child
    const component = await prisma.asset.findUnique({
      where: { id: component_asset_id },
      include: {
        childRelationships: true, // relationship as child
      }
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Komponen child tidak ditemukan.',
      });
    }

    // Cari tahu parent lama (jika ada)
    const oldRelationship = await prisma.assetRelationship.findFirst({
      where: { child_asset_id: component_asset_id },
      include: { parentAsset: true }
    });
    const oldParent = oldRelationship ? oldRelationship.parentAsset : null;

    let newParent = null;
    if (new_parent_asset_id) {
      newParent = await prisma.asset.findUnique({
        where: { id: new_parent_asset_id }
      });
      if (!newParent) {
        return res.status(404).json({
          success: false,
          message: 'Perangkat induk target pemasangan baru tidak ditemukan.',
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Hapus relasi komponen lama dari perangkat sebelumnya
      await tx.assetRelationship.deleteMany({
        where: { child_asset_id: component_asset_id },
      });

      // 2. Buat relasi baru jika ada target PC induk baru
      if (new_parent_asset_id) {
        await tx.assetRelationship.create({
          data: {
            parent_asset_id: new_parent_asset_id,
            child_asset_id: component_asset_id,
            relationship_type: 'Contains', // Menampung komponen anak
          }
        });
      }

      // Update component child asset status based on parent connection
      const componentStatus = new_parent_asset_id ? 'Active' : 'Spare';
      await tx.asset.update({
        where: { id: component_asset_id },
        data: { status: componentStatus }
      });

      // 3. Catat audit log di komponen
      await tx.assetHistory.create({
        data: {
          asset_id: component_asset_id,
          action: 'PART_TRANSFER',
          notes: new_parent_asset_id 
            ? `Kanibalisasi: Komponen dipindahkan ${oldParent ? `dari PC ${oldParent.asset_code} ` : ''}ke PC ${newParent.asset_code}. Catatan: ${notes || '-'}`
            : `Pencopotan komponen ${oldParent ? `dari PC ${oldParent.asset_code}` : ''} ke gudang penyimpanan spare.`,
          performed_by_id,
        }
      });

      // 4. Catat audit log di PC Induk Baru (jika ada)
      if (new_parent_asset_id) {
        await tx.assetHistory.create({
          data: {
            asset_id: new_parent_asset_id,
            action: 'PART_TRANSFER',
            notes: `Penambahan komponen child: Memasang unit ${component.asset_code} (${component.attributes?.brand || 'Generic'}).`,
            performed_by_id,
          }
        });
      }

      // 5. Catat audit log di PC Induk Lama (jika ada)
      if (oldParent) {
        await tx.assetHistory.create({
          data: {
            asset_id: oldParent.id,
            action: 'PART_TRANSFER',
            notes: `Kehilangan komponen child (Kanibalisasi): Mencopot komponen ${component.asset_code} untuk dipasang ke perangkat lain.`,
            performed_by_id,
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Pemindahan komponen (kanibalisasi) berhasil diproses dan dicatat di seluruh aset terkait.',
    });
  } catch (error) {
    console.error('Error saat transfer komponen:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat memproses kanibalisasi komponen.',
      error: error.message,
    });
  }
};

/**
 * 5. POST Retire Asset (Pemusnahan/Scrap Aset)
 */
const retireAsset = async (req, res) => {
  const { id } = req.params;
  const { notes, performed_by_id } = req.body;

  if (!performed_by_id) {
    return res.status(400).json({
      success: false,
      message: 'Kolom performed_by_id (IT Support) wajib disertakan untuk log audit pemusnahan.',
    });
  }

  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Aset tidak ditemukan.',
      });
    }

    const retiredAsset = await prisma.$transaction(async (tx) => {
      // 0. Periksa AssetRelationship jika memiliki perangkat anak
      const childRelations = await tx.assetRelationship.findMany({
        where: { parent_asset_id: id }
      });

      if (childRelations.length > 0) {
        const childAssetIds = childRelations.map(rel => rel.child_asset_id);

        // Putus hubungan topologi (hapus relasi)
        await tx.assetRelationship.deleteMany({
          where: { parent_asset_id: id }
        });

        // Kembalikan status seluruh perangkat anak tersebut menjadi 'Spare'
        await tx.asset.updateMany({
          where: { id: { in: childAssetIds } },
          data: { status: 'Spare' }
        });

        // Catat histori perubahan status untuk masing-masing anak
        for (const childId of childAssetIds) {
          await tx.assetHistory.create({
            data: {
              asset_id: childId,
              action: 'STATUS_CHANGE',
              notes: `Dilepas dari perangkat induk (${asset.asset_code}) yang dimusnahkan (Scrapped). Komponen dikembalikan ke gudang (status: Spare).`,
              performed_by_id,
            }
          });
        }
      }

      // 1. Catat log pemusnahan
      await tx.assetHistory.create({
        data: {
          asset_id: id,
          action: 'RETIREMENT',
          notes: notes || 'Aset telah dimusnahkan secara resmi karena mati total (Scrapped).',
          performed_by_id,
        },
      });

      // 2. Ubah status aset menjadi Scrapped
      const updated = await tx.asset.update({
        where: { id },
        data: {
          status: 'Scrapped',
          user_id: null, // lepas dari custodian
          department_id: null, // hapus lokasi aktif
        },
        include: {
          category: true,
          department: true,
        }
      });

      // 3. Hapus relasi maintenance schedule aktif yang belum dikerjakan
      await tx.maintenanceSchedule.deleteMany({
        where: {
          asset_id: id,
          scheduled_date: {
            gt: new Date()
          }
        }
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: `Aset ${retiredAsset.asset_code} telah dimusnahkan (Scrapped) dan dikeluarkan dari agenda pemeliharaan rutin.`,
      data: mapAsset(retiredAsset),
    });
  } catch (error) {
    console.error('Error saat memusnahkan aset:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat memusnahkan aset insiden.',
      error: error.message,
    });
  }
};

/**
 * 6. GET Asset History Logs
 */
const getAssetHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const histories = await prisma.assetHistory.findMany({
      where: { asset_id: id },
      include: {
        from_dept: true,
        to_dept: true,
        from_user: {
          select: { id: true, full_name: true, nip: true }
        },
        to_user: {
          select: { id: true, full_name: true, nip: true }
        },
        performed_by: {
          select: { id: true, full_name: true, role: true }
        }
      },
      orderBy: {
        timestamp: 'desc',
      }
    });

    return res.status(200).json({
      success: true,
      count: histories.length,
      data: histories,
    });
  } catch (error) {
    console.error('Error saat mengambil history log aset:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil history log aset.',
      error: error.message,
    });
  }
};

/**
 * 7. GET Asset Metrics (Spare Pool & Lifecycle Stats)
 */
const getAssetMetrics = async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: { category: true }
    });

    // 1. Hitung total per lifecycle status
    const stats = {
      total: assets.length,
      active: assets.filter(a => a.status === 'Active').length,
      spare: assets.filter(a => ['Spare', 'In Stock'].includes(a.status)).length,
      maintenance: assets.filter(a => a.status === 'Maintenance').length,
      broken: assets.filter(a => a.status === 'Broken').length,
      scrapped: assets.filter(a => a.status === 'Scrapped').length,
    };

    // 2. Kumpulkan sisa perangkat cadangan (Spare Pool) per kategori
    const categories = await prisma.assetCategory.findMany();
    const sparePool = categories.map(cat => {
      const spareCount = assets.filter(
        a => a.category_id === cat.id && ['Spare', 'In Stock'].includes(a.status)
      ).length;

      return {
        id: cat.id,
        category_name: cat.category_name,
        spare_count: spareCount,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        stats,
        sparePool,
      }
    });
  } catch (error) {
    console.error('Error saat menghitung metrik aset:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat menghitung metrik aset.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllAssets,
  procureAsset,
  mutateAsset,
  transferComponent,
  retireAsset,
  getAssetHistory,
  getAssetMetrics,
};
