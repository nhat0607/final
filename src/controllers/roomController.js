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
    const { startDate, endDate } = req.body;

    try {
        // Tìm khách sạn theo ID
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found',
            });
        }

        // Kiểm tra quyền sở hữu
        if (hotel.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add a room to this hotel',
            });
        }

        // Kiểm tra tính hợp lệ của startDate và endDate
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date',
            });
        }

        // Tạo khoảng thời gian trống
        const availableDates = [{
            startDate: start,
            endDate: end,
        }];

        // Tạo phòng mới
        const room = new Room({
            ...req.body,
            hotel: hotelId,
            availableDates,
        });

        // Lưu phòng vào MongoDB
        await room.save();

        // Cập nhật khách sạn để thêm _id của phòng vào trường 'rooms'
        await Hotel.findByIdAndUpdate(hotelId, {
            $push: { rooms: room._id }, // Thêm _id của phòng vào mảng 'rooms' của khách sạn
        });

        res.status(201).json({
            success: true,
            data: room,
            message: 'Room added successfully',
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error adding room',
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
        await Room.findByIdAndDelete(roomId);

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
// exports.searchRooms = async (req, res) => {
//     const { location, checkInDate, checkOutDate, guests } = req.body;

//     try {
//         // Chuyển đổi checkInDate và checkOutDate thành đối tượng Date
//         const checkIn = new Date(checkInDate);
//         const checkOut = new Date(checkOutDate);

//         // Tạo mảng ngày yêu cầu
//         const requestedDates = [];
//         for (let date = new Date(checkIn); date <= checkOut; date.setDate(date.getDate() + 1)) {
//             requestedDates.push(date.toISOString().split('T')[0]); // Chuyển thành chuỗi YYYY-MM-DD
//         }

//         // Tìm khách sạn theo địa chỉ
//         const hotels = await Hotel.find({ location: location }).select('_id');

//         // Tìm phòng theo khách sạn, sức chứa và có sẵn trong khoảng ngày
//         const availableRooms = await Room.find({
//             hotel: { $in: hotels }, // Tìm phòng trong các khách sạn theo địa chỉ
//             capacity: { $gte: guests }, // Lọc theo sức chứa
//             availableDates: { $all: requestedDates }, // Kiểm tra tất cả ngày yêu cầu
//         });

//         if (availableRooms.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No rooms available for the selected dates and location.',
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             data: availableRooms,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };


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

        const uploadedFiles = req.files.map(file => `/uploads/hotel/${req.body.hotelId}/${file.filename}`);

        room.media.push(...uploadedFiles);
        await room.save();

        res.status(200).json({ message: 'Files added successfully', media: room.media });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};