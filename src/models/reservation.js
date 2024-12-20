const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room', // Liên kết với mô hình Room
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Liên kết với mô hình User
        required: true,
    },
    checkInDate: {
        type: Date,
        required: [true, 'Please add a check-in date'],
    },
    checkOutDate: {
        type: Date,
        required: [true, 'Please add a check-out date'],
    },
    isReviewed: { type: Boolean, default: false }, // Đánh dấu nếu đã review
    status: {
        type: String,
        enum: ['booked', 'cancelled', 'completed'],
        default: 'booked',
    },
    guests: [
        {
            name: {
                type: String,
            },
            CCCD: {
                type: String,
            },
            gender: {
                type: String,
                enum: ['male', 'female', 'other'],
            },
        },
    ],
}, { timestamps: true });

const Reservation = mongoose.model('Reservation', reservationSchema, 'Reservation');

module.exports = Reservation;
