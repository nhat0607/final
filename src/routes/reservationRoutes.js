const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware'); // Middleware bảo vệ route
const {
    bookRoom,
    checkAvailability,
    cancelBooking
} = require('../controllers/reservationController'); // Import controller

const router = express.Router();

// Đặt phòng
router.post('/book/:roomId', protect, bookRoom);

// Kiểm tra phòng trống
router.get('/check-availability/:roomId', checkAvailability);

// Hủy đặt phòng
router.delete('/cancel/:reservationId', protect, cancelBooking);

module.exports = router;
