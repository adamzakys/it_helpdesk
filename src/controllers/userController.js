const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

/**
 * Controller untuk mengelola CRUD User Management PT BMS.
 * Mengimplementasikan hashing password, soft delete, dan validasi hard delete.
 */

// 1. GET All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Sanitasi password dari output JSON demi keamanan
    const sanitizedUsers = users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });

    return res.status(200).json({
      success: true,
      count: sanitizedUsers.length,
      data: sanitizedUsers,
    });
  } catch (error) {
    console.error('Error saat mengambil daftar user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil daftar user.',
      error: error.message,
    });
  }
};

// 2. GET User by ID
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    const { password, ...sanitizedUser } = user;

    return res.status(200).json({
      success: true,
      data: sanitizedUser,
    });
  } catch (error) {
    console.error('Error saat mengambil detail user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil detail user.',
      error: error.message,
    });
  }
};

// 3. CREATE User (Password Hashing via bcrypt)
const createUser = async (req, res) => {
  const { nip, full_name, email, password, department_id, role, is_active } = req.body;

  // Validasi Input Wajib
  if (!nip || !full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Kolom NIP, Nama Lengkap, Email, dan Password wajib diisi.',
    });
  }

  try {
    // Periksa keunikan NIP
    const existingNip = await prisma.user.findUnique({
      where: { nip },
    });
    if (existingNip) {
      return res.status(400).json({
        success: false,
        message: `Pengguna dengan NIP ${nip} sudah terdaftar.`,
      });
    }

    // Periksa keunikan Email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `Pengguna dengan Email ${email} sudah terdaftar.`,
      });
    }

    // Hash Password menggunakan bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        nip,
        full_name,
        email,
        password: hashedPassword,
        department_id: department_id ? parseInt(department_id, 10) : null,
        role: role || 'User',
        is_active: is_active !== undefined ? is_active : true,
      },
      include: {
        department: true,
      }
    });

    const { password: _, ...sanitizedUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Pengguna baru berhasil dibuat.',
      data: sanitizedUser,
    });
  } catch (error) {
    console.error('Error saat membuat user baru:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat membuat pengguna baru.',
      error: error.message,
    });
  }
};

// 4. UPDATE User (Mendukung ubah nama, NIP, role, department, password baru, dan soft delete)
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nip, full_name, email, password, department_id, role, is_active } = req.body;

  try {
    // Periksa keberadaan user
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // Cek unik untuk NIP baru jika dirubah
    if (nip && nip !== existingUser.nip) {
      const nipDuplicate = await prisma.user.findUnique({
        where: { nip },
      });
      if (nipDuplicate) {
        return res.status(400).json({
          success: false,
          message: `NIP ${nip} sudah digunakan oleh pengguna lain.`,
        });
      }
    }

    // Cek unik untuk Email baru jika dirubah
    if (email && email !== existingUser.email) {
      const emailDuplicate = await prisma.user.findUnique({
        where: { email },
      });
      if (emailDuplicate) {
        return res.status(400).json({
          success: false,
          message: `Email ${email} sudah digunakan oleh pengguna lain.`,
        });
      }
    }

    // Buat data update
    const updateData = {
      full_name: full_name || undefined,
      nip: nip || undefined,
      email: email || undefined,
      role: role || undefined,
      department_id: department_id !== undefined ? (department_id ? parseInt(department_id, 10) : null) : undefined,
      is_active: is_active !== undefined ? is_active : undefined,
    };

    // Hash password baru jika dikirimkan oleh klien
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
      }
    });

    const { password: _, ...sanitizedUser } = updatedUser;

    return res.status(200).json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
      data: sanitizedUser,
    });
  } catch (error) {
    console.error('Error saat mengupdate user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat memperbarui data pengguna.',
      error: error.message,
    });
  }
};

// 5. DELETE User (Hard Delete Validation)
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // VALIDASI HARD DELETE 1: Cek apakah user terikat dengan asset yang statusnya 'Active'
    const activeAssetsCount = await prisma.asset.count({
      where: {
        user_id: id,
        status: 'Active',
      },
    });

    if (activeAssetsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Gagal menghapus pengguna secara permanen. Pengguna ini masih terdaftar sebagai custodian aktif untuk ${activeAssetsCount} aset berstatus 'Active'. Ubah custodian aset terlebih dahulu.`,
      });
    }

    // VALIDASI HARD DELETE 2: Cek apakah user memiliki tiket helpdesk (sebagai reporter atau assignee) yang statusnya bukan 'Closed'
    const openTicketsCount = await prisma.ticket.count({
      where: {
        OR: [
          { reporter_id: id },
          { assignee_id: id },
        ],
        status: {
          not: 'Closed',
        },
      },
    });

    if (openTicketsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Gagal menghapus pengguna secara permanen. Pengguna ini memiliki ${openTicketsCount} tiket helpdesk aktif yang belum diselesaikan (status bukan 'Closed'). Selesaikan tiket terlebih dahulu.`,
      });
    }

    // Jika seluruh validasi terpenuhi, lakukan hard delete permanen
    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: `Akun pengguna ${user.full_name} (NIP: ${user.nip}) berhasil dihapus secara permanen dari sistem.`,
    });
  } catch (error) {
    console.error('Error saat menghapus user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat menghapus akun pengguna.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
