const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    reservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation', // Liên kết với Reservation
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Liên kết với User
        required: true,
    },
    transId: {
        type: String,
        required: true, // Mã giao dịch với Zalopay
        unique: true,
    },
    amount: {
        type: Number,
        required: true, // Số tiền
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed'], // Trạng thái giao dịch
        default: 'pending',
    },
    paymentUrl: {
        type: String, // URL thanh toán từ Zalopay
        required: true,
    },
    details: String, // Thông tin chi tiết về order
    paymentMethod: {
        type: Number,
        enum: [50,100],
        required: true,
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema, 'Order');

module.exports = Order;
