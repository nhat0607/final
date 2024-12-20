const mongoose = require('mongoose');

const VerificationCodeSchema = new mongoose.Schema({
    email: { type: String, required: true },
    code: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // Hết hạn sau 5 phút
});

module.exports = mongoose.model('VerificationCode', VerificationCodeSchema);
