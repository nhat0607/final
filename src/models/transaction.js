const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reservationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order' // Tên của model Order
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,

        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    hostAmount: {
        type: Number,
        required: true
    }, // Số tiền Host nhận được
    adminFee: {
        type: Number,
        required: true
    }, // Phí Admin
    paymentMethod: {
        type: String,
        default: 'Zalopay',
    },
    transactionDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['paid', 'failed', 'refunded'],
        default: 'paid',
    },
    hostName: { type: String, default: "N/A" },  // Đảm bảo trường này tồn tại
    hostEmail: { type: String, default: "N/A" },  // Đảm bảo trường này tồn tại

}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema, 'Transaction');
module.exports = Transaction;
