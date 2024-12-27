const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const User = require('../models/user');
const credentials = require('../../credentials.json');
const VerificationCode = require('../models/verifacationcode');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


// OAuth2 client setup
const oauth2Client = new OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

// Hàm thiết lập refresh token và lấy access token mới
const setAccessTokenWithRefreshToken = async (refreshToken) => {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await oauth2Client.getAccessToken();
    console.log('Access Token:', token); // Xác nhận access token mới

    return token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
};

exports.sendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    if (!email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chữ số ngẫu nhiên

        // Xóa mã cũ của email (nếu có)
        await VerificationCode.deleteMany({ email });

        // Lưu mã xác minh mới vào cơ sở dữ liệu
        await VerificationCode.create({ email, code: verificationCode });

        // Gửi email chứa mã xác minh (logic gửi email giữ nguyên)
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const accessToken = await setAccessTokenWithRefreshToken(refreshToken);
        oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const subject = 'Email Verification Code';
        const body = `Your verification code is: ${verificationCode}\n\nPlease enter this code to verify your email address.`;

        const message = `
From: "Stay Finder" <stayfindera@gmail.com>
To: ${email}
Subject: ${subject}

${body}
        `.trim();

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage },
        });

        res.status(200).json({ success: true, message: 'Verification email sent' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send verification email',
            error: error.message,
        });
    }
};



exports.verifyEmail = async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    try {
        // Tìm mã xác minh
        const verification = await VerificationCode.findOne({ email, code });
        const user = await User.findOne({email});
        if (!verification) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        // Xóa mã sau khi xác minh thành công
        await VerificationCode.deleteOne({ email, code });
        user.statusemail = 'verify';
        await user.save();

        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to verify email',
            error: error.message,
        });
    }
};

exports.sendResetPasswordEmail = async (req, res) => {
    const { email } = req.body;
    console.log(email);
    if (!email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    try {
        console.log('test1');
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log(user);
        console.log('test2');
        // Generate a random password
        const randomPassword = crypto.randomBytes(8).toString('hex'); 
        const hashedPassword = await bcrypt.hash(randomPassword, 10); 
        console.log('test3');
        // Update user password
        user.password = randomPassword;
        console.log(randomPassword);
        console.log(hashedPassword);
        await user.save();
        console.log('Password saved in DB:', user.password);

        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const accessToken = await setAccessTokenWithRefreshToken(refreshToken);
        oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const subject = 'Your New Password';
        const body = `Your password has been reset. Here is your new password: ${randomPassword}\n\nPlease log in and change your password immediately.`;

        const message = `
From: "Stay Finder" <stayfindera@gmail.com>
To: ${email}
Subject: ${subject}

${body}
        `.trim();

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage },
        });

        res.status(200).json({ success: true, message: 'New password sent to your email' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message,
        });
    }
};

const sendPaymentConfirmationEmail = async (user, order, reservation, amount) => {
    try {
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const accessToken = await setAccessTokenWithRefreshToken(refreshToken);
        oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const subject = 'Payment Confirmation';
        const body = `
Dear ${user.name},

We have successfully received your payment for the reservation with the following details:

- Reservation ID: ${reservation._id}
- Order ID: ${order._id}
- Amount Paid: ${amount} VND

Thank you for choosing Stay Finder. Your reservation is now confirmed. Please contact our support team if you have any questions.

Best regards,
The Stay Finder Team
        `.trim();

        const message = `
From: "Stay Finder" <stayfindera@gmail.com>
To: ${user.email}
Subject: ${subject}

${body}
        `.trim();

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage },
        });

        console.log(`Payment confirmation email sent to ${user.email}`);
    } catch (error) {
        console.error('Failed to send payment confirmation email:', error);
        throw new Error('Error in sending payment confirmation email');
    }
};

// Payment callback handling
