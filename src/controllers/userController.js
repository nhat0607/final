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

exports.createUser = async (req, res) => {
    try {
        if (!req.user || !['admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create a user',
            });
        }

        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required',
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists',
            });
        }

        const user = new User({
            name,
            email,
            password,
            role, 
        });

        // console.log(user);
        await user.save();

        res.status(201).json({
            success: true,
            data: user,
            message: 'User created successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

exports.updateUser = async (req, res) => {
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
