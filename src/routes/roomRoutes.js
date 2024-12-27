// routes/roomRoutes.js
const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { addRoom, deleteRoom, updateRoom, searchRooms, detailRoom, getRoomsByHotel, deleteMedia, addMedia } = require('../controllers/roomController');
const upload = require('../utils/multerConfig');

const router = express.Router();

// Chỉ chủ khách sạn mới có quyền thêm phòng
router.post('/hotels/:hotelId/rooms', protect, authorize('hotelOwner'), upload.array('files', 10), addRoom);

router.delete('/delete/:id', protect, authorize('admin', 'hotelOwner'), deleteRoom);

// Route cập nhật phòng
router.put('/update/:id', protect, authorize('hotelOwner'), updateRoom);

// tìm phòng
router.post('/search', searchRooms);

//chi tiết phòng
router.get('/detailroom/:id', detailRoom);

router.get('/room/:hotelId', getRoomsByHotel);

router.delete('/rooms/:roomId/media/:fileName', 
    protect, 
    authorize('hotelOwner'), 
    deleteMedia);

router.post('/rooms/:roomId/media', 
    protect, authorize('hotelOwner'), 
    upload.array('files', 10), addMedia);


module.exports = router;
