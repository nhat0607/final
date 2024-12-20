const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware'); // Middleware bảo vệ route
const {
    bookRoom,
    checkAvailability,
    cancelBooking,
    getBookingsByHotel,
    getBookingsByUser,
    getBookingsById,
    updateGuestsById
} = require('../controllers/reservationController'); // Import controller

const router = express.Router();

// Đặt phòng
router.post('/book/:roomId', protect, bookRoom);

// Kiểm tra phòng trống
router.get('/check-availability/:roomId', checkAvailability);

// Hủy đặt phòng
router.delete('/cancel/:reservationId', protect, cancelBooking);

router.get("/booking/:hotelId", getBookingsByHotel);

router.get("/bookinguser/:userId", getBookingsByUser);

router.get("/bookingid/:Id", getBookingsById);

router.put("/bookings/:Id/guests", updateGuestsById);

module.exports = router;
