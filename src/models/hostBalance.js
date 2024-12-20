const mongoose = require('mongoose');
const hostBalanceSchema = new mongoose.Schema({
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host', // Chủ khách sạn
        required: true,
    },
    totalBalance: {
        type: Number, // Số dư hiện tại của host
        required: true,
        default: 0,
    },
    lastUpdated: {
        type: Date, // Ngày cập nhật cuối
        default: Date.now,
    },
}, { timestamps: true });

const HostBalance = mongoose.model('HostBalance', hostBalanceSchema, 'HostBalance');
module.exports = HostBalance;
