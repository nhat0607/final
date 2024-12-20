const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/all', userController.getAllUsers);

router.post('/adduser', protect, authorize('admin'), userController.createUser);

router.patch('/updateuser/:id', protect, authorize('admin'), userController.updateUser);

module.exports = router;