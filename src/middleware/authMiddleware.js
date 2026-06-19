const jwt = require('jsonwebtoken');

/**
 * Middleware untuk memproteksi endpoint dan memverifikasi token JWT.
 */
const verifyToken = (req, res, next) => {
  // Ambil token dari header Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan (Silakan login terlebih dahulu).',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-123';
    // Verifikasi validitas token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Lampirkan data user terverifikasi ke object request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid atau telah kedaluwarsa.',
      error: error.message,
    });
  }
};

module.exports = {
  verifyToken,
};
