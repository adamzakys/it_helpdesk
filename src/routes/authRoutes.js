const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint untuk login user (POST /api/auth/login)
router.post('/login', authController.login);

// Endpoint untuk lupa password (POST /api/auth/forgot-password)
router.post('/forgot-password', authController.forgotPassword);

// Endpoint untuk ubah password mandiri (POST /api/auth/change-password)
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
