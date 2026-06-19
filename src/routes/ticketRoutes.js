const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route untuk membuat ticket baru (C) - Publik (Mendukung Guest Reporter tanpa Token)
router.post('/', ticketController.createTicket);

// Route untuk mendapatkan semua ticket (R - List) - Dilindungi Auth
router.get('/', verifyToken, ticketController.getAllTickets);

// Route untuk mendapatkan detail ticket berdasarkan ID (R - Detail) - Dilindungi Auth
router.get('/:id', verifyToken, ticketController.getTicketById);

// Route untuk memperbarui ticket & lifecycle status log (U) - Dilindungi Auth
router.put('/:id', verifyToken, ticketController.updateTicket);

// Route untuk menghapus ticket (D) - Dilindungi Auth
router.delete('/:id', verifyToken, ticketController.deleteTicket);

module.exports = router;
