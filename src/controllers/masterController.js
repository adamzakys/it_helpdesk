const prisma = require('../config/database');

/**
 * Controller untuk mengelola Master Data (Departemen & Kategori Aset) PT BMS.
 */

// ====================================================
// A. MANAJEMEN DEPARTEMEN / DIVISI
// ====================================================

// 1. Ambil Semua Departemen
const getAllDepartments = async (req, res) => {
  try {
    const depts = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, assets: true }
        }
      }
    });
    return res.status(200).json({
      success: true,
      data: depts,
    });
  } catch (error) {
    console.error('Error getAllDepartments:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data departemen.',
      error: error.message,
    });
  }
};

// 2. Buat Departemen Baru
const createDepartment = async (req, res) => {
  const { name, location_name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Nama departemen wajib diisi.',
    });
  }

  try {
    const newDept = await prisma.department.create({
      data: { name, location_name }
    });
    return res.status(201).json({
      success: true,
      message: 'Departemen berhasil ditambahkan.',
      data: newDept,
    });
  } catch (error) {
    console.error('Error createDepartment:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan departemen.',
      error: error.message,
    });
  }
};

// 3. Update Departemen
const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, location_name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Nama departemen wajib diisi.',
    });
  }

  try {
    const updatedDept = await prisma.department.update({
      where: { id: parseInt(id, 10) },
      data: { name, location_name }
    });
    return res.status(200).json({
      success: true,
      message: 'Data departemen berhasil diperbarui.',
      data: updatedDept,
    });
  } catch (error) {
    console.error('Error updateDepartment:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui departemen.',
      error: error.message,
    });
  }
};

// 4. Hapus Departemen (Dengan Validasi Relasi)
const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  const deptId = parseInt(id, 10);

  try {
    // Cek Relasi User
    const userCount = await prisma.user.count({
      where: { department_id: deptId }
    });

    // Cek Relasi Aset
    const assetCount = await prisma.asset.count({
      where: { department_id: deptId }
    });

    if (userCount > 0 || assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Gagal menghapus. Departemen ini tidak dapat dihapus karena masih terhubung dengan ${userCount} karyawan dan ${assetCount} aset aktif.`,
      });
    }

    await prisma.department.delete({
      where: { id: deptId }
    });

    return res.status(200).json({
      success: true,
      message: 'Departemen berhasil dihapus secara permanen.',
    });
  } catch (error) {
    console.error('Error deleteDepartment:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus departemen dari sistem.',
      error: error.message,
    });
  }
};


// ====================================================
// B. MANAJEMEN KATEGORI ASET
// ====================================================

// 1. Ambil Semua Kategori
const getAllCategories = async (req, res) => {
  try {
    const cats = await prisma.assetCategory.findMany({
      orderBy: { category_name: 'asc' },
      include: {
        _count: {
          select: { assets: true }
        }
      }
    });
    return res.status(200).json({
      success: true,
      data: cats,
    });
  } catch (error) {
    console.error('Error getAllCategories:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil kategori aset.',
      error: error.message,
    });
  }
};

// 2. Buat Kategori Baru
const createCategory = async (req, res) => {
  const { category_name, description } = req.body;

  if (!category_name) {
    return res.status(400).json({
      success: false,
      message: 'Nama kategori wajib diisi.',
    });
  }

  try {
    const newCat = await prisma.assetCategory.create({
      data: { category_name, description }
    });
    return res.status(201).json({
      success: true,
      message: 'Kategori aset berhasil ditambahkan.',
      data: newCat,
    });
  } catch (error) {
    console.error('Error createCategory:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan kategori aset.',
      error: error.message,
    });
  }
};

// 3. Update Kategori
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { category_name, description } = req.body;

  if (!category_name) {
    return res.status(400).json({
      success: false,
      message: 'Nama kategori wajib diisi.',
    });
  }

  try {
    const updatedCat = await prisma.assetCategory.update({
      where: { id: parseInt(id, 10) },
      data: { category_name, description }
    });
    return res.status(200).json({
      success: true,
      message: 'Kategori aset berhasil diperbarui.',
      data: updatedCat,
    });
  } catch (error) {
    console.error('Error updateCategory:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui kategori aset.',
      error: error.message,
    });
  }
};

// 4. Hapus Kategori (Dengan Validasi Relasi)
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const catId = parseInt(id, 10);

  try {
    // Cek Relasi Aset
    const assetCount = await prisma.asset.count({
      where: { category_id: catId }
    });

    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Gagal menghapus. Kategori ini tidak dapat dihapus karena masih digunakan oleh ${assetCount} aset terdaftar.`,
      });
    }

    await prisma.assetCategory.delete({
      where: { id: catId }
    });

    return res.status(200).json({
      success: true,
      message: 'Kategori aset berhasil dihapus secara permanen.',
    });
  } catch (error) {
    console.error('Error deleteCategory:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus kategori aset dari sistem.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
