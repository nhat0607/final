// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('Token received:', token);
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token failed',
        });
    }
};

// Middleware kiểm tra vai trò của người dùng
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.user.role} không được phép truy cập`,
            });
        }
        next();
    };
};
