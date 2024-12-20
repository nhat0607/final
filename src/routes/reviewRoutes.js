const express = require('express');
const { addReview } = require('../controllers/reviewController');
const upload = require('../utils/multerConfig');
const { protect } = require('../middlewares/authMiddleware'); // Middleware kiểm tra đăng nhập

const router = express.Router();

// Route thêm review với media
router.post('/', protect, upload.array('media', 5), addReview); // Cho phép upload tối đa 5 file

module.exports = router;
