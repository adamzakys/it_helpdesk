const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Pasang pengaman untuk seluruh endpoint master data (Harus Login dan bertindak sebagai Admin)
router.use(verifyToken);
router.use(verifyAdmin);

// ==========================================
// 1. Departemen / Divisi Routes
// ==========================================
router.get('/departments', masterController.getAllDepartments);
router.post('/departments', masterController.createDepartment);
router.put('/departments/:id', masterController.updateDepartment);
router.delete('/departments/:id', masterController.deleteDepartment);

// ==========================================
// 2. Kategori Aset Routes
// ==========================================
router.get('/categories', masterController.getAllCategories);
router.post('/categories', masterController.createCategory);
router.put('/categories/:id', masterController.updateCategory);
router.delete('/categories/:id', masterController.deleteCategory);

module.exports = router;
