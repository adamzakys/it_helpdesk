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

// 2. FORGOT PASSWORD (Kirim kata sandi sementara ke email)
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email wajib diisi.',
    });
  }

  try {
    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Alamat email tidak terdaftar di database sistem.',
      });
    }

    // Generate password sementara acak (BMS + 6 karakter acak)
    const tempPassword = 'BMS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Hash password sementara menggunakan bcryptjs
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Simpan ke database
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Kirim notifikasi email via Nodemailer
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.MAIL_PORT || '2525', 10),
      auth: {
        user: process.env.MAIL_USER || 'dummy_user',
        pass: process.env.MAIL_PASS || 'dummy_pass'
      }
    });

    const mailOptions = {
      from: '"BMS IT Helpdesk" <noreply@bms.co.id>',
      to: email,
      subject: '[BMS IT Helpdesk] Permintaan Atur Ulang Kata Sandi',
      text: `Halo ${user.full_name},

Kami menerima permintaan untuk mengatur ulang kata sandi akun IT Helpdesk Anda.
Kata sandi sementara Anda yang baru adalah:

${tempPassword}

Silakan masuk ke portal menggunakan kata sandi sementara di atas dan segera ubah kata sandi Anda di halaman Profil.

Terima kasih,
IT Support Team PT Berlian Manyar Sejahtera.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2 style="color: #1d7fa2; border-bottom: 2px solid #2596be; padding-bottom: 10px; margin-top: 0;">Atur Ulang Kata Sandi</h2>
          <p>Halo <strong>${user.full_name}</strong>,</p>
          <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun IT Helpdesk Anda.</p>
          <p>Kata sandi sementara Anda yang baru adalah:</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center; margin: 15px 0;">
            <span style="font-size: 20px; font-weight: bold; color: #1d7fa2; letter-spacing: 2px;">${tempPassword}</span>
          </div>
          <p style="color: #ef4444; font-weight: bold;">PENTING:</p>
          <p>Silakan gunakan kata sandi sementara di atas untuk login ke portal, kemudian segera lakukan perubahan kata sandi Anda pada menu <strong>Profil Saya</strong> demi keamanan akun Anda.</p>
          <br/>
          <p>Terima kasih,<br/>
          IT Support Team PT Berlian Manyar Sejahtera.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({
        success: true,
        message: 'Kata sandi sementara berhasil dikirim ke email Anda. Silakan cek kotak masuk/spam Anda.',
      });
    } catch (mailError) {
      console.warn('Gagal mengirim email, mengembalikan mode debug simulasi:', mailError.message);
      return res.status(200).json({
        success: true,
        message: 'Kata sandi sementara berhasil dibuat (Simulasi email berhasil).',
        debugTempPassword: tempPassword, // Tampilkan di UI jika email offline demi kelancaran demo skripsi
      });
    }

    } catch (error) {
    console.error('Error saat lupa password:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat memproses lupa password.',
      error: error.message,
    });
  }
};

// 3. CHANGE PASSWORD (Ubah kata sandi mandiri setelah login)
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Kata sandi saat ini dan kata sandi baru wajib diisi.',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Kata sandi baru minimal harus terdiri dari 6 karakter.',
    });
  }

  try {
    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan di database.',
      });
    }

    // Verifikasi kata sandi saat ini
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Kata sandi saat ini tidak sesuai/salah.',
      });
    }

    // Hash kata sandi baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Simpan ke database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: 'Kata sandi Anda berhasil diperbarui.',
    });

  } catch (error) {
    console.error('Error saat mengubah password:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengubah kata sandi.',
      error: error.message,
    });
  }
};

module.exports = {
  login,
  forgotPassword,
  changePassword,
};
