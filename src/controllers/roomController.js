// controllers/roomController.js
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Thêm phòng mới cho một khách sạn
// exports.addRoom = async (req, res) => {
//     const { roomNumber, capacity, price } = req.body;

//     try {
//         // Kiểm tra quyền truy cập
//         if (!req.user || !['admin', 'hotelOwner'].includes(req.user.role)) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Not authorized to add a room',
//             });
//         }

//         // Tạo phòng mới
//         const room = new Room({
//             hotel: req.params.hotelId, // ID của khách sạn
//             roomNumber,
//             capacity,
//             price,
//         });

//         // Lưu phòng vào MongoDB
//         await room.save();

//         res.status(201).json({
//             success: true,
//             data: room,
//             message: 'Room added successfully',
//         });
//     } catch (error) {
//         res.status(400).json({
//             success: false,
//             message: 'Error adding room',
//             error: error.message,
//         });
//     }
// };

// exports.addRoom = async (req, res) => {
//     const { hotelId } = req.params;

//     try {
//         // Tìm khách sạn theo ID
//         const hotel = await Hotel.findById(hotelId);

//         if (!hotel) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Hotel not found',
//             });
//         }

//         // Kiểm tra xem người dùng có phải là chủ sở hữu của khách sạn không
//         if (hotel.owner.toString() !== req.user.id) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Not authorized to add a room to this hotel',
//             });
//         }

//         // Tạo phòng mới
//         const room = new Room({
//             ...req.body,
//             hotel: hotelId, // Gán ID khách sạn cho phòng
//         });

//         // Lưu phòng vào MongoDB
//         await room.save();

//         res.status(201).json({
//             success: true,
//             data: room,
//             message: 'Room added successfully',
//         });
//     } catch (error) {
//         res.status(400).json({
//             success: false,
//             message: 'Error adding room',
//             error: error.message,
//         });
//     }
// };

// exports.addRoom = async (req, res) => {
//     const { hotelId } = req.params;
//     const { startDate, endDate } = req.body; // Thêm thời điểm bắt đầu và kết thúc của ngày trống từ req.body

//     try {
//         // Tìm khách sạn theo ID
//         const hotel = await Hotel.findById(hotelId);

//         if (!hotel) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Hotel not found',
//             });
//         }

//         // Kiểm tra xem người dùng có phải là chủ sở hữu của khách sạn không
//         if (hotel.owner.toString() !== req.user.id) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Not authorized to add a room to this hotel',
//             });
//         }

//         // Tạo danh sách các ngày trống từ startDate đến endDate
//         const availableDates = [];
//         let currentDate = new Date(startDate);
//         const lastDate = new Date(endDate);

//         while (currentDate <= lastDate) {
//             availableDates.push(new Date(currentDate));
//             currentDate.setDate(currentDate.getDate() + 1); // Tăng ngày lên 1
//         }

//         // Tạo phòng mới
//         const room = new Room({
//             ...req.body,
//             hotel: hotelId,
//             availableDates, // Gán danh sách ngày trống
//         });

//         // Lưu phòng vào MongoDB
//         await room.save();

//         res.status(201).json({
//             success: true,
//             data: room,
//             message: 'Room added successfully',
//         });
//     } catch (error) {
//         res.status(400).json({
//             success: false,
//             message: 'Error adding room',
//             error: error.message,
//         });
//     }
// };

exports.addRoom = async (req, res) => {
    const { hotelId } = req.params;
    const { roomNumber, roomType, price, capacity, startDate, endDate, amenities } = req.body;
    const files = req.files;

    try {
        // Find hotel by ID
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found',
            });
        }

        // Check ownership
        if (hotel.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add a room to this hotel',
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            return res.status(400).json({
                success: false,
                message: 'Invalid dates: startDate must be before endDate',
            });
        }

        // Validate price and capacity
        if (!price || price <= 0 || !capacity || capacity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room price or capacity',
            });
        }

        // Validate room number uniqueness
        const existingRoom = await Room.findOne({ hotel: hotelId, roomNumber });
        if (existingRoom) {
            return res.status(400).json({
                success: false,
                message: 'Room number already exists in this hotel',
            });
        }

        // Process media files
        const images = files
            .filter(file => file.mimetype.startsWith('image'))
            .map(file => `/uploads/hotel/${hotelId}/${file.filename}`);
        const videos = files
            .filter(file => file.mimetype.startsWith('video'))
            .map(file => `/uploads/hotel/${hotelId}/${file.filename}`);
        const media = [...images, ...videos];

        // Parse and validate amenities
        const parsedAmenities = amenities ? JSON.parse(amenities) : [];
        if (!Array.isArray(parsedAmenities)) {
            return res.status(400).json({
                success: false,
                message: 'Amenities must be an array',
            });
        }

        // Create new room
        const room = new Room({
            roomNumber,
            roomType,
            price,
            capacity,
            startDate: start,
            endDate: end,
            amenities: parsedAmenities,
            hotel: hotelId,
            media,
        });

        // Save room to database
        await room.save();

        // Add room reference to hotel
        hotel.rooms.push(room._id);
        await hotel.save();

        res.status(201).json({
            success: true,
            data: room,
            message: 'Room added successfully',
        });
    } catch (error) {
        console.error('Error adding room:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};



exports.updateRoom = async (req, res) => {
    const { id } = req.params;

    try {
        // Tìm phòng theo ID
        const room = await Room.findById(id).populate('hotel');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        // Tìm khách sạn liên kết với phòng đó
        const hotel = await Hotel.findById(room.hotel._id);

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
                message: 'Not authorized to update rooms in this hotel',
            });
        }

        const updateData = { ...req.body };
        if (!req.body.availableDates) {
            updateData.availableDates = room.availableDates;
        }

        // Cập nhật thông tin phòng
        const updatedRoom = await Room.findByIdAndUpdate(id, req.body, { new: true });

        res.status(200).json({
            success: true,
            data: updatedRoom,
            message: 'Room updated successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating room',
            error: error.message,
        });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const roomId = req.params.id;

        // Tìm phòng theo ID
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        // Tìm khách sạn mà phòng này thuộc về
        const hotel = await Hotel.findById(room.hotel);

        // Kiểm tra xem người dùng có phải là chủ sở hữu của khách sạn không
        if (hotel.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this room',
            });
        }

        // Xóa phòng
        room.statusroom = 'Hidden';
        await room.save();

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting room',
            error: error.message,
        });
    }
};


exports.searchRooms = async (req, res) => {
    const { location, checkInDate, checkOutDate, guests } = req.body;

    try {
        // Chuyển đổi checkInDate và checkOutDate thành đối tượng Date
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        // Tạo mảng ngày yêu cầu
        const requestedDates = [];
        for (let date = new Date(checkIn); date <= checkOut; date.setDate(date.getDate() + 1)) {
            requestedDates.push(date.toISOString().split('T')[0]); // Chuyển thành chuỗi YYYY-MM-DD
        }

        console.log('Requested Dates:', requestedDates); // In ra mảng ngày yêu cầu

        // Tìm khách sạn theo địa chỉ
        const hotels = await Hotel.find({
            $or: [
                { "location.city": { $regex: new RegExp(location, "i") } },
                { "location.country": { $regex: new RegExp(location, "i") } }
            ]
        }).select('_id');
        console.log('Hotels found:', hotels); // In ra danh sách khách sạn tìm được

        // Tìm phòng theo khách sạn, sức chứa và có sẵn trong khoảng ngày
        const availableRooms = [];
        for (const hotel of hotels) {
            const rooms = await Room.find({
                hotel: hotel._id, // Tìm phòng trong khách sạn
                capacity: { $gte: guests }, // Lọc theo sức chứa
            });

            // Kiểm tra từng phòng nếu có đủ ngày yêu cầu
            for (const room of rooms) {
                let isAvailable = true;
                for (let i = 0; i < requestedDates.length; i++) {
                    const requestedDate = requestedDates[i];

                    // Kiểm tra xem ngày yêu cầu có nằm trong bất kỳ khoảng availableDates nào của phòng không
                    let found = false;
                    for (const availableDate of room.availableDates) {
                        const startDate = new Date(availableDate.startDate);
                        const endDate = new Date(availableDate.endDate);
                        const requestedDateObj = new Date(requestedDate);

                        // Kiểm tra nếu ngày yêu cầu nằm trong khoảng availableDates
                        if (requestedDateObj >= startDate && requestedDateObj <= endDate) {
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        isAvailable = false;
                        break;
                    }
                }

                if (isAvailable) {
                    availableRooms.push(room);
                }
            }
        }

        console.log('Available Rooms:', availableRooms); // In ra danh sách phòng có sẵn

        if (availableRooms.length === 0) {
            // Nếu không tìm thấy phòng, kiểm tra điều kiện nào không thỏa mãn
            if (hotels.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No hotels found for the selected location.',
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'No rooms available for the selected dates and location.',
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: availableRooms,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.detailRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(400).json({
                success: false,
                message: "room not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: room,
        });
    } catch (error) {
        console.error('Error fetching room details:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }

};


exports.getRoomsByHotel = async (req, res) => {
    try {
      const { hotelId } = req.params;
    //   console.log(hotelId);
  
      const rooms = await Room.find({ hotel: new mongoose.Types.ObjectId(hotelId) });
  
      if (rooms.length === 0) {
        return res.status(404).json({ message: 'No rooms found for this hotel' });
      }
  
      res.status(200).json(rooms);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  };

exports.deleteMedia = async (req, res) => {
    const { roomId, fileName } = req.params;
    console.log(roomId);
    console.log(fileName);

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const fileIndex = room.media.indexOf(`/uploads/hotel/${room.hotel.toString()}/${fileName}`);
        if (fileIndex === -1) {
            return res.status(400).json({ message: 'File not found in room media' });
        }

        room.media.splice(fileIndex, 1);
        await room.save();

        const filePath = path.resolve(__dirname, '../../uploads/hotel', room.hotel.toString(), fileName);
        console.log(filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file at: ${filePath}`);
        } else {
            console.log(`File does not exist at: ${filePath}`);
        }

        res.status(200).json({ message: 'File deleted successfully', media: room.media });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};

exports.addMedia = async (req, res) => {
    const { roomId } = req.params;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        console.log('test1');
        console.log(req.files);
        const uploadedFiles = req.files.map(file => `/uploads/hotel/${req.body.hotelId}/${file.filename}`);

        room.media.push(...uploadedFiles);
        await room.save();

        res.status(200).json({ message: 'Files added successfully', media: room.media });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};

exports.updateRoomAvailableDates = async (req, res) => {
    const { roomId } = req.params;
    const { checkInDate, checkOutDate } = req.body;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
  
        const startDate = new Date(checkInDate);
        const endDate = new Date(checkOutDate);
  
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid check-in or check-out date.' });
        }
  
        if (startDate >= endDate) {
            return res.status(400).json({ success: false, message: 'Check-in date must be before check-out date.' });
        }
  
        const isOK = !room.bookDates.some(bookDate => {
            const bookDateStart = new Date(bookDate.startDate);
            const bookDateEnd = new Date(bookDate.endDate);
        
            return (startDate < bookDateEnd && endDate > bookDateStart);
        });
        
        if (!isOK) {
            return res.status(400).json({
                success: false,
                message: 'There is an existing booking during this time period.',
            });
        }

  
        // Điều chỉnh `availableDates`
        const updatedAvailableDates = [];
        let isNewRangeAdded = false;

        room.availableDates.forEach(availableDate => {
            const availableStart = new Date(availableDate.startDate);
            const availableEnd = new Date(availableDate.endDate);
        
            if (startDate >= availableStart && endDate > availableEnd && startDate <= availableEnd) {
                updatedAvailableDates.push({ 
                    startDate: availableStart, 
                    endDate: new Date(endDate.setDate(endDate.getDate() - 0)) 
                });
            } else if (startDate < availableStart && endDate < availableEnd && endDate >= availableStart) {
                updatedAvailableDates.push({ 
                    startDate: new Date(endDate.setDate(endDate.getDate() + 0)), 
                    endDate: availableEnd 
                });
            } else if (endDate < availableStart || startDate > availableEnd) {
                updatedAvailableDates.push(availableDate);
            }
        
            // Check if the new range overlaps with the current availableDate
            if (!(endDate < availableStart || startDate > availableEnd)) {
                isNewRangeAdded = true;
            }
        });
        
        // If the new range does not overlap with any existing dates, add it as a new entry
        if (!isNewRangeAdded) {
            updatedAvailableDates.push({ startDate, endDate });
        }
        room.availableDates = updatedAvailableDates;
        await room.save();
  
        res.status(200).json({ success: true, message: 'Room dates updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
  };