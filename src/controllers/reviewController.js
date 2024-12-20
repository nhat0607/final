const Reservation = require('../models/reservation');
const Review = require('../models/review');
const Room = require('../models/room');
const User = require('../models/user');
const { updateHotelRating } = require('../utils/ratinghotel');
const mongoose = require('mongoose');


exports.addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roomId, rating, comment } = req.body;
        const files = req.files;

        // Kiểm tra phòng
        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Kiểm tra xem user có đặt phòng đó không
        const reservation = await Reservation.findOne({
            user: userId,
            room: roomId,
            status: 'completed', // Chỉ chấp nhận những booking đã hoàn tất
            isReviewed: false,  // Booking chưa được review
            checkOutDate: { $lte: new Date() }, // Chỉ review sau ngày check-out
        });

        if (!reservation) {
            return res.status(403).json({
                success: false,
                message: 'You can only review after completing your stay and only once.',
            });
        }


        // Lấy URL của file
        const images = files
            .filter(file => file.mimetype.startsWith('image'))
            .map(file => `/uploads/reviews/${file.filename}`);
        const videos = files
            .filter(file => file.mimetype.startsWith('video'))
            .map(file => `/uploads/reviews/${file.filename}`);


        // Gộp images và videos
        const media = [...images, ...videos];

        // Tạo review mới
        const review = await Review.create({
            room: roomId,
            user: req.user.id, // Lấy ID người dùng từ middleware auth
            rating,
            comment,
            media,
        });

        // Cập nhật trạng thái booking đã được review
        reservation.isReviewed = true;
        await reservation.save();

        // Cập nhật điểm số khách sạn
        await updateHotelRating(room.hotel);


        res.status(201).json({ success: true, review });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }


};

exports.getReviewsByRoomId = async (req, res) => {
    try {
      const { roomId } = req.params; 
        // console.log(roomId);

      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({ message: "Invalid booking" });
      }

      const reviews = await Review.find({room: new mongoose.Types.ObjectId(roomId) })
        .populate("user")
        .exec();

      if (reviews.length === 0) {
        return res.status(404).json({ message: "No booking found" });
      }
  
      res.status(200).json(reviews);
    } catch (err) {
      console.error("Error fetching booking:", err);
      res.status(500).json({ message: "Server Error" });
    }
  };
