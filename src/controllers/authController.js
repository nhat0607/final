const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Hotel = require('../models/hotel');

// Đăng ký người dùng
exports.register = async (req, res) => {
    const { name, email, password, country, phonenumber, role } = req.body;

    try {
        // Kiểm tra xem email đã tồn tại chưa
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại',
            });
        }

        // Tạo người dùng mới với vai trò mặc định là 'customer'
        const user = await User.create({
            name,
            email,
            password,
            country,
            phonenumber,
            role: role || 'customer', // Nếu không có vai trò, mặc định là 'customer'
            statusemail: 'unverify', // Chưa xác minh email
        });

        // Tạo JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });

        // Trả về thông tin người dùng và token
        res.status(201).json({
            success: true,
            token,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng ký',
            error: error.message,
        });
    }
};

exports.registerhotel = async (req, res) => {
    const { name, email, password, country, phonenumber, role, hotel } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        if (role === 'hotelOwner' && (!hotel || !hotel.name || !hotel.location)) {
            return res.status(400).json({
                success: false,
                message: 'Hotel information is required for hotelOwner role',
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            country,
            phonenumber,
            role: role || 'customer',
            statusemail: 'unverify', // Chưa xác minh email
        });

        if (role === 'hotelOwner') {
            await Hotel.create({
                name: hotel.name,
                location: hotel.location,
                rating: hotel.rating || 0,
                owner: user._id,
                amenities: hotel.amenities || [],
            });
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email to continue.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during registration',
            error: error.message,
        });
    }
}

// Đăng nhập người dùng
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Kiểm tra xem người dùng có tồn tại hay không
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        // Kiểm tra mật khẩu
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        // Tạo JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });

        // Trả về token và thông tin người dùng
        res.status(200).json({
            success: true,
            token,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng nhập',
            error: error.message,
        });
    }
};
exports.getUserList = async (req, res) => {
    try {
        // Kiểm tra quyền admin (nếu sử dụng middleware)
        const users = await User.find().select('name email role createdAt');  // Chỉ lấy những trường cần thiết

        // Trả về danh sách người dùng
        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};