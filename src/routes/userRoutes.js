const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/all', userController.getAllUsers);


router.get('/:id',protect, userController.detailUser);

router.put('/update/:id',protect, userController.updateUser);

router.patch('/updateuser/:id', protect, authorize('admin'), userController.updateStatus);

module.exports = router;