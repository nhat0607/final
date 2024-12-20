// routes/roomRoutes.js
const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { addRoom, deleteRoom, updateRoom, searchRooms, detailRoom } = require('../controllers/roomController');

const router = express.Router();

// Chỉ chủ khách sạn mới có quyền thêm phòng
router.post('/hotels/:hotelId/rooms', protect, authorize('hotelOwner'), addRoom);

router.delete('/delete/:id', protect, authorize('admin', 'hotelOwner'), deleteRoom);

// Route cập nhật phòng
router.put('/update/:id', protect, authorize('hotelOwner'), updateRoom);

// tìm phòng
router.post('/search', searchRooms);

//chi tiết phòng
router.get('/detailroom/:id', detailRoom);

module.exports = router;
