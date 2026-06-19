const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint untuk mendapatkan daftar semua aset - Dilindungi Auth
router.get('/', verifyToken, assetController.getAllAssets);

// Endpoint untuk mendapatkan metrik ringkasan/Spare Pool
router.get('/dashboard/metrics', verifyToken, assetController.getAssetMetrics);

// Endpoint pengadaan aset baru
router.post('/procure', verifyToken, assetController.procureAsset);

// Endpoint mutasi/rotasi aset
router.post('/:id/mutate', verifyToken, assetController.mutateAsset);

// Endpoint kanibalisasi / transfer komponen child
router.post('/components/transfer', verifyToken, assetController.transferComponent);

// Endpoint pemusnahan/scrap aset
router.post('/:id/retire', verifyToken, assetController.retireAsset);

// Endpoint mengambil riwayat log histori aset
router.get('/:id/history', verifyToken, assetController.getAssetHistory);

module.exports = router;
