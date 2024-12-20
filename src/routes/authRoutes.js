const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {sendVerificationEmail, verifyEmail, sendResetPasswordEmail} = require('../middlewares/gmailMiddleware');

// Route đăng ký người dùng
router.post('/register', authController.register);

router.post(
    '/register-hotel',
    authController.registerhotel
);

router.post('/send-verification-code', sendVerificationEmail);

router.post('/verify-email', verifyEmail);

router.post('/reset-password', sendResetPasswordEmail);

// Route đăng nhập người dùng
router.post('/login', authController.login);

router.get('/users', protect, authorize('admin'), authController.getUserList);



module.exports = router;
