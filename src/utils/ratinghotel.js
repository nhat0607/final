const mongoose = require('mongoose');
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const Review = require('../models/review');
const { Types } = require('mongoose');

const calculateHotelRating = async (hotelId) => {
    const rooms = await Room.find({ hotel: hotelId });
    const roomIds = rooms.map(room => new Types.ObjectId(room._id));

    const reviews = await Review.find({ room: { $in: roomIds } });
    const totalReviews = reviews.length;

    if (totalReviews === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / totalReviews).toFixed(1);
};


const updateHotelRating = async (hotelId) => {
    const newRating = await calculateHotelRating(hotelId);
    const Hotel = require('../models/hotel');
    await Hotel.findByIdAndUpdate(hotelId, { rating: newRating });
};

module.exports = {
    calculateHotelRating,
    updateHotelRating,
};
