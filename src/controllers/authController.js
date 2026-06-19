const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Controller untuk mengelola Autentikasi Pengguna (Login & Verifikasi Kredensial) PT BMS.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Validasi Input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password wajib diisi.',
    });
  }

  try {
    // 2. Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial login salah (email tidak ditemukan).',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan oleh Administrator.',
      });
    }

    // 3. Verifikasi password menggunakan bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial login salah (password tidak sesuai).',
      });
    }

    // 4. Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-123';
    const token = jwt.sign(
      {
        id: user.id,
        name: user.full_name, // Menggunakan full_name dari skema baru PT BMS
        email: user.email,
        role: user.role,
        nip: user.nip,
        department: user.department ? user.department.name : null,
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // 5. Kembalikan data sukses beserta token
    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        name: user.full_name, // Menggunakan full_name
        email: user.email,
        role: user.role,
        nip: user.nip,
        department: user.department ? user.department.name : null,
      },
    });

  } catch (error) {
    console.error('Error saat login:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat login.',
      error: error.message,
    });
  }
};

module.exports = {
  login,
};
