const Hotel = require('../models/hotel');
const express = require('express');
const Room = require('../models/room');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');


// Lấy tất cả khách sạn
exports.getAllHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find()
            .populate({
                path: 'owner',
                select: '_id',
                match: { statusaccount: 'active' },  
            });

        const activeHotels = hotels.filter(hotel => hotel.owner !== null);

        res.json(activeHotels);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving hotels', error });
    }
};

exports.getHotelsByOwner = async (req, res) => {
    try {
      const { ownerId } = req.params; // Lấy ownerId từ params
    //   console.log(ownerId);
  
      // Tìm tất cả khách sạn có ownerId trùng với giá trị trong params
      const hotels = await Hotel.find({ owner: new mongoose.Types.ObjectId(ownerId) });
  
      // Nếu không tìm thấy khách sạn nào
      if (hotels.length === 0) {
        return res.status(404).json({ message: 'No hotels found for this owner' });
      }
  
      // Trả về danh sách các khách sạn
      res.status(200).json(hotels);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
};

exports.getHotelDetails = async (req, res) => {
    try {
        // Lấy ID khách sạn từ tham số đường dẫn
        const hotelId = req.params.id;

        // Tìm khách sạn trong cơ sở dữ liệu và lấy các thông tin chi tiết
        const hotel = await Hotel.findById(hotelId)
            .populate({
                path: 'rooms', // Liên kết với các phòng trong khách sạn
                select: '', // Lấy toàn bộ thông tin của các phòng
                populate: {
                    path: 'reviews',  // Nếu muốn lấy các thông tin đánh giá từ mô hình Review
                    select: 'rating comment',  // Chỉ lấy rating và comment từ Review
                },
            });
        console.log('Hotel rooms:', hotel.rooms);

        // Nếu khách sạn không tồn tại
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found',
            });
        }
        // Kiểm tra danh sách các phòng liên kết với khách sạn
        // const rooms = await Room.find({ hotel: hotelId });
        // console.log('Rooms linked to this hotel in Room collection:', rooms);

        // Trả về chi tiết khách sạn cùng với các phòng
        res.status(200).json({
            success: true,
            data: hotel,
        });
    } catch (error) {
        console.error('Error fetching hotel details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Thêm một khách sạn mới
exports.createHotel = async (req, res) => {
    try {
        // Kiểm tra xem người dùng có quyền tạo khách sạn không
        if (!req.user || !['admin', 'hotelOwner'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create a hotel',
            });
        }

        // Tạo một đối tượng khách sạn mới từ dữ liệu được gửi qua body
        const hotel = new Hotel({
            ...req.body, // Spread operator để lấy tất cả dữ liệu từ req.body
            owner: req.user.id, // Gán owner từ token
        });

        // Lưu khách sạn vào MongoDB
        await hotel.save();

        // Trả về phản hồi thành công, cùng với dữ liệu của khách sạn vừa thêm
        res.status(201).json({
            success: true,
            data: hotel,
            message: "Hotel created successfully",
        });
    } catch (error) {
        // Xử lý lỗi khi thêm khách sạn và trả về mã lỗi phù hợp
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// exports.create = async (req, res) => {
//     res.render('create-hotel');
// }
// Cập nhật khách sạn theo ID
exports.updateHotel = async (req, res) => {
    const { id } = req.params;
    const { name, location, amenities, rating, rooms, media } = req.body;

    try {
        console.log('Processing request...');
        
        // Tìm khách sạn theo ID
        const hotel = await Hotel.findById(id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found',
            });
        }

        // Kiểm tra xem người dùng có phải là chủ khách sạn không
        if (hotel.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this hotel',
            });
        }

        // Cập nhật thông tin khách sạn
        const updatedHotelData = {
            name,
            location: typeof location === 'string' ? JSON.parse(location) : location,
            amenities: typeof amenities === 'string' ? JSON.parse(amenities) : amenities,
            rating,
            rooms: typeof rooms === 'string' ? JSON.parse(rooms) : rooms,
            media,
        };
        
        const updatedHotel = await Hotel.findByIdAndUpdate(id, updatedHotelData, { new: true });

        res.status(200).json({
            success: true,
            data: updatedHotel,
            message: 'Hotel updated successfully',
        });
    } catch (error) {
        console.error('Error updating hotel:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error updating hotel',
            error: error.message,
        });
    }
};


// Xóa một khách sạn theo ID
exports.deleteHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Hotel deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting hotel',
            error: error.message,
        });
    }
};
exports.searchHotels = async (req, res) => {
    const { location, checkInDate, checkOutDate, guests } = req.body;
    console.log(location);
    console.log(guests);

    try {
        // Chuyển đổi checkInDate và checkOutDate thành đối tượng Date
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        // Tạo mảng ngày yêu cầu
        const requestedDates = [];
        for (let date = new Date(checkIn); date <= checkOut; date.setDate(date.getDate() + 1)) {
            requestedDates.push(date.toISOString().split('T')[0]); // Chuyển thành chuỗi YYYY-MM-DD
        }
        // const removeAccents = require('remove-accents'); 
        console.log('Requested Dates:', requestedDates);
        // const normalizedLocation = removeAccents(location);
        // Tìm tất cả khách sạn theo địa điểm
        const hotels = await Hotel.find({
            $or: [
                { "location.city": { $regex: new RegExp(location, "i") } },
                { "location.country": { $regex: new RegExp(location, "i") } }
            ]
        });

        console.log('Hotels found:', hotels);

        if (hotels.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hotels found for the selected location.',
            });
        }

        // Kiểm tra khách sạn nào có phòng thỏa mãn yêu cầu
        const availableHotels = [];
        for (const hotel of hotels) {
            // Tìm các phòng trong khách sạn
            const rooms = await Room.find({
                hotel: hotel._id, // Chỉ tìm phòng thuộc khách sạn này
                capacity: { $gte: guests }, // Lọc theo sức chứa
            });

            let hotelHasAvailableRoom = false;
            let lowestPrice = Infinity; // Giá thấp nhất khởi tạo là vô cùng

            for (const room of rooms) {
                let isRoomAvailable = true;

                // Kiểm tra từng ngày yêu cầu
                for (const requestedDate of requestedDates) {
                    let dateFound = false;
                    for (const availableDate of room.availableDates) {
                        const startDate = new Date(availableDate.startDate);
                        const endDate = new Date(availableDate.endDate);
                        const requestedDateObj = new Date(requestedDate);

                        if (requestedDateObj >= startDate && requestedDateObj <= endDate) {
                            dateFound = true;
                            break;
                        }
                    }

                    if (!dateFound) {
                        isRoomAvailable = false;
                        break;
                    }
                }

                if (isRoomAvailable) {
                    hotelHasAvailableRoom = true;
                    if (room.price < lowestPrice) {
                        lowestPrice = room.price; // Cập nhật giá thấp nhất
                    }
                }
            }

            if (hotelHasAvailableRoom) {
                availableHotels.push({
                    hotel,
                    lowestPrice: lowestPrice === Infinity ? null : lowestPrice, // Thêm giá thấp nhất vào khách sạn
                });
            }
        }

        console.log('Available Hotels:', availableHotels);

        if (availableHotels.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hotels available for the selected dates and guest count.',
            });
        }

        return res.status(200).json({
            success: true,
            data: availableHotels,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getRoomsByHotel = async (req, res) => {
    const hotelId = req.params.id;
    const { checkInDate, checkOutDate, guests } = req.body;

    try {
        // Chuyển đổi checkInDate và checkOutDate thành đối tượng Date
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        // Tạo mảng ngày yêu cầu
        const requestedDates = [];
        for (let date = new Date(checkIn); date <= checkOut; date.setDate(date.getDate() + 1)) {
            requestedDates.push(date.toISOString().split('T')[0]); // Chuyển thành chuỗi YYYY-MM-DD
        }

        console.log('Requested Dates:', requestedDates);

        // Kiểm tra xem khách sạn có tồn tại không
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found.',
            });
        }

        // Tìm tất cả các phòng của khách sạn thỏa mãn điều kiện
        const rooms = await Room.find({
            hotel: hotelId, // Lọc theo ID khách sạn
            capacity: { $gte: guests }, // Lọc theo sức chứa
        });

        const availableRooms = [];

        for (const room of rooms) {
            let isRoomAvailable = true;

            // Kiểm tra từng ngày yêu cầu
            for (const requestedDate of requestedDates) {
                let dateFound = false;
                for (const availableDate of room.availableDates) {
                    const startDate = new Date(availableDate.startDate);
                    const endDate = new Date(availableDate.endDate);
                    const requestedDateObj = new Date(requestedDate);

                    if (requestedDateObj >= startDate && requestedDateObj <= endDate) {
                        dateFound = true;
                        break;
                    }
                }

                if (!dateFound) {
                    isRoomAvailable = false;
                    break;
                }
            }

            if (isRoomAvailable) {
                // Thêm thông tin phòng vào danh sách
                availableRooms.push({
                    roomId: room._id,
                    roomnumber: room.roomNumber,
                    capacity: room.capacity,
                    price: room.price,
                    balcony: room.balcony,
                });
            }
        }

        console.log('Available Rooms:', availableRooms);

        if (availableRooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No rooms available for the selected dates and guest count.',
            });
        }

        return res.status(200).json({
            success: true,
            hotel: {
                id: hotel._id,
                name: hotel.name,
                location: hotel.location,
            },
            rooms: availableRooms,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteMedia = async (req, res) => {
    const { hotelId, fileName } = req.params;

    try {
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        const fileIndex = hotel.media.indexOf(`/uploads/hotel/${hotelId.toString()}/${fileName}`);
        if (fileIndex === -1) {
            return res.status(400).json({ message: 'File not found in hotel media' });
        }

        hotel.media.splice(fileIndex, 1);
        await hotel.save();

        const filePath = path.resolve(__dirname, '../../uploads/hotel', hotel.toString(), fileName);
        console.log(filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file at: ${filePath}`);
        } else {
            console.log(`File does not exist at: ${filePath}`);
        }

        res.status(200).json({ message: 'File deleted successfully', media: hotel.media });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};

exports.addMedia = async (req, res) => {
    const { hotelId } = req.params;

    try {
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        console.log('test1');
        console.log(req.files);
        const uploadedFiles = req.files.map(file => `/uploads/hotel/${hotelId}/${file.filename}`);

        hotel.media.push(...uploadedFiles);
        await hotel.save();

        res.status(200).json({ message: 'Files added successfully', media: hotel.media });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};
