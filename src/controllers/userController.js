const User = require('../models/user');
const express = require('express');
const Room = require('../models/room');
const router = express.Router();
const bcrypt = require('bcryptjs');


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(600).json({ message: 'Error retrieving users', error });
    }
};

exports.detailUser = async (req, res) => {
    try {
        const userId = req.params.id; // Lấy ID từ URL
        const user = await User.findById(userId).select('-password'); // Ẩn trường password

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id; // Lấy ID từ URL
        const updateData = req.body; // Lấy dữ liệu từ body request

        // Tìm và cập nhật user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData, // Dữ liệu cập nhật
            { new: true, runValidators: true, select: '-password' } // Lựa chọn trả về bản ghi mới nhất, kiểm tra hợp lệ, ẩn mật khẩu
        );

        // Nếu không tìm thấy user
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    // console.log(id);
    const { email } = req.body;
    
    try {
        // Kiểm tra quyền hạn (phải là admin)
        if (!req.user || !['admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update user',
            });
        }

        // Tìm người dùng theo ID
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Nếu email có thay đổi, kiểm tra tính duy nhất của email
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });

            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken',
                });
            }
        }

        // Nếu có thay đổi mật khẩu, mã hóa lại mật khẩu
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        }); 
    }
};