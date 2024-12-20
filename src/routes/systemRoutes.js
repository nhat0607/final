const express = require('express');
const router = express.Router();
const { backupMongoDB, restoreMongoDB } = require('../controllers/systemController');

// Route backup: Không thay đổi, vẫn dùng như cũ
router.post('/backup', backupMongoDB);

// Route restore: Không cần upload nữa, chỉ sử dụng file backup mới nhất
router.post('/restore', restoreMongoDB);

module.exports = router;
