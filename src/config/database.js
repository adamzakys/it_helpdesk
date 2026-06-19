const { PrismaClient } = require('@prisma/client');

// Inisialisasi Prisma Client singleton instance
const prisma = new PrismaClient({
  // Tampilkan query log pada mode development untuk memudahkan debugging skripsi/tugas akhir
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
