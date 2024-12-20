const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    }, // Phòng được đánh giá
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, // Người đánh giá
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }, // Điểm đánh giá (1 - 5 sao)
    comment: {
        type: String,
        required: true
    }, // Nội dung bình luận
    createdAt: {
        type: Date,
        default: Date.now
    }, // Thời gian đánh giá
    media: { type: [String], default: [] }, // Lưu đường dẫn file (URL)
});

module.exports = mongoose.model('Review', reviewSchema, 'Review');
