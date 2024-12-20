const mongoose = require('mongoose');
const adminBalanceSchema = new mongoose.Schema({
    totalBalance: {
        type: Number, // Số dư tổng hiện tại của admin
        required: true,
        default: 0,
    },
    lastUpdated: {
        type: Date, // Ngày cập nhật cuối cùng
        default: Date.now,
    },
}, { timestamps: true });

const AdminBalance = mongoose.model('AdminBalance', adminBalanceSchema, 'AdminBalance');
module.exports = AdminBalance;
