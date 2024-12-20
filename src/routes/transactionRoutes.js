const express = require('express');
const { getAdminTransactions, getHostTransactions, getCustomerTransactions } = require('../controllers/transactionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Lấy lịch sử giao dịch cho Customer
router.get("/customer", protect, authorize("customer"), getCustomerTransactions);

// Lấy lịch sử giao dịch cho Host
router.get("/host", protect, authorize("hotelOwner"), getHostTransactions);

// Lấy lịch sử giao dịch cho Admin
router.get("/admin", protect, authorize("admin"), getAdminTransactions);

module.exports = router;
