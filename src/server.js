const app = require('./app');

// Port diambil dari .env atau default ke 3000 jika tidak diset
const PORT = process.env.PORT || 3000;

// Menjalankan server Express
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server IT Helpdesk & Aset berjalan pada port: ${PORT}`);
  console.log(`📂 URL Root API: http://localhost:${PORT}/api`);
  console.log(`📂 Endpoint Tiket: http://localhost:${PORT}/api/tickets`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
