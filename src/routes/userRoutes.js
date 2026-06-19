const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Middleware lokal untuk memastikan bahwa user memiliki peran 'Admin'
 */
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya Administrator yang memiliki wewenang untuk mengelola data pengguna.',
    });
  }
};

// Pasang pengaman autentikasi token dan otorisasi admin ke seluruh endpoint
router.use(verifyToken);
router.use(verifyAdmin);

// Rute CRUD User
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
