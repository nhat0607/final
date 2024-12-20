const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false, // Không trả về mật khẩu khi truy vấn
    },

    country: { type: String, required: true },

    phonenumber: { type: String, required: true },

    role: {
        type: String,
        enum: ['customer', 'hotelOwner', 'admin'],
        default: 'customer', // Mặc định là khách hàng
    },
}, { timestamps: true });

// Mã hóa mật khẩu trước khi lưu vào DB
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Tạo phương thức để kiểm tra mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model('User', userSchema, 'User');
module.exports = User;
