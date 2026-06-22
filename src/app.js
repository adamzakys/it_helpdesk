const express = require('express');
const dotenv = require('dotenv');
const ticketRoutes = require('./routes/ticketRoutes');
const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const userRoutes = require('./routes/userRoutes');
const masterRoutes = require('./routes/masterRoutes');

// Load environment variables dari file .env
dotenv.config();

const app = express();

// Middleware parsing request body sebagai JSON
app.use(express.json());

// Middleware logger sederhana untuk memudahkan debugging saat skripsi/tugas akhir
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Endpoint Utama / Health Check
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Selamat datang di API IT Helpdesk & Manajemen Aset',
    version: '1.0.0',
  });
});

// Registrasi Route untuk Autentikasi
app.use('/api/auth', authRoutes);

// Registrasi Route untuk Entitas Ticket
app.use('/api/tickets', ticketRoutes);

// Registrasi Route untuk Entitas Asset
app.use('/api/assets', assetRoutes);

// Registrasi Route untuk User Management CRUD
app.use('/api/users-management', userRoutes);

// Registrasi Route untuk Manajemen Data Master
app.use('/api/master', masterRoutes);

const prisma = require('./config/database');
const { verifyToken } = require('./middleware/authMiddleware');

// Endpoint publik pendukung dropdown divisi tamu (tidak memerlukan autentikasi)
app.get('/api/public/departments', async (req, res) => {
  try {
    const depts = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: depts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data departemen.', error: error.message });
  }
});

// Endpoint pendukung dropdown departemen
app.get('/api/departments', verifyToken, async (req, res) => {
  try {
    const depts = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: depts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data departemen.', error: error.message });
  }
});

// Endpoint pendukung dropdown user penanggung jawab (custodian)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        full_name: true,
        nip: true,
        role: true,
      },
      orderBy: { full_name: 'asc' }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna.', error: error.message });
  }
});

// Endpoint pendukung dropdown kategori aset
app.get('/api/categories', verifyToken, async (req, res) => {
  try {
    const cats = await prisma.assetCategory.findMany({
      orderBy: { category_name: 'asc' }
    });
    res.status(200).json({ success: true, data: cats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori aset.', error: error.message });
  }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Terjadi internal server error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan sistem internal.',
    error: err.message,
  });
});

module.exports = app;
