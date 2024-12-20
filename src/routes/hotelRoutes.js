const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Route chỉ admin và chủ khách sạn mới được truy cập
router.post('/add-hotel', protect, authorize('admin', 'hotelOwner'), hotelController.createHotel);

//update hotel chỉ chủ hotel mới dc update
router.put('/update/:id', protect, authorize('hotelOwner'), hotelController.updateHotel);

// Route cho tất cả người dùng
router.get('/all', hotelController.getAllHotels);

// Route chỉ admin mới được truy cập
router.delete('/hotel/:id', protect, authorize('admin'), hotelController.deleteHotel);

router.get('/owner/:ownerId', hotelController.getHotelsByOwner);

// Route cập nhật khách sạn
router.put('/hotel/:id', protect, authorize('admin', 'hotelOwner'), hotelController.updateHotel);

// Chi tiết khách sạn và danh sách phòng
router.get('/detailhotel/:id', hotelController.getHotelDetails);

module.exports = router;
