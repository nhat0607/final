const Reservation = require('../models/reservation');
const Room = require('../models/room');
const mongoose = require('mongoose');


exports.bookRoom = async (req, res) => {
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

      const isAvailable = room.availableDates.some(availableDate => {
          const availableStart = new Date(availableDate.startDate);
          const availableEnd = new Date(availableDate.endDate);
          return availableStart <= startDate && availableEnd >= endDate;
      });

      if (!isAvailable) {
          return res.status(400).json({
              success: false,
              message: 'Room is not available during this period.',
          });
      }

      // Tính thời gian hết hạn (10 phút sau khi đặt phòng)
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 10);

      const reservation = await Reservation.create({
          room: roomId,
          user: req.user.id,
          checkInDate,
          checkOutDate,
          expirationDate, // Lưu thời gian hết hạn
      });

      room.bookDates.push({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
    });

      const updatedAvailableDates = [];
      room.availableDates.forEach(availableDate => {
          const availableStart = new Date(availableDate.startDate);
          const availableEnd = new Date(availableDate.endDate);

          if (startDate > availableStart && endDate < availableEnd) {
              updatedAvailableDates.push({ startDate: availableStart, endDate: new Date(startDate.setDate(startDate.getDate() - 0)) });
              updatedAvailableDates.push({ startDate: new Date(endDate.setDate(endDate.getDate() + 0)), endDate: availableEnd });
          } else if (startDate <= availableStart && endDate < availableEnd && endDate >= availableStart) {
              updatedAvailableDates.push({ startDate: new Date(endDate.setDate(endDate.getDate() + 1)), endDate: availableEnd });
          } else if (startDate > availableStart && endDate >= availableEnd && startDate <= availableEnd) {
              updatedAvailableDates.push({ startDate: availableStart, endDate: new Date(startDate.setDate(startDate.getDate() - 1)) });
          } else if (endDate < availableStart || startDate > availableEnd) {
              updatedAvailableDates.push(availableDate);
          }
      });

      room.availableDates = updatedAvailableDates;
      await room.save();

      res.status(201).json({ success: true, data: reservation });
  } catch (error) {
      console.error(error);
      res.status(400).json({ success: false, message: error.message });
  }
};

// API đặt phòng
// exports.bookRoom = async (req, res) => {
//     const { roomId } = req.params;
//     const { checkInDate, checkOutDate } = req.body;

//     try {
//         // Tìm phòng theo ID
//         const room = await Room.findById(roomId);

//         if (!room) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Room not found',
//             });
//         }

//         // Chuyển đổi ngày để so sánh
//         const startDate = new Date(checkInDate);
//         const endDate = new Date(checkOutDate);

//         // Kiểm tra xem toàn bộ khoảng thời gian có trống không
//         const requestedDates = [];
//         for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
//             requestedDates.push(date.toISOString().split('T')[0]); // Định dạng YYYY-MM-DD
//         }

//         // Chuyển đổi availableDates trong room về định dạng YYYY-MM-DD để so sánh
//         const availableDatesFormatted = room.availableDates.map(date => {
//             return new Date(date).toISOString().split('T')[0]; // Định dạng lại ngày từ ISO thành YYYY-MM-DD
//         });

//         // Kiểm tra xem các ngày yêu cầu có nằm trong danh sách availableDates không
//         const isAvailable = requestedDates.every(date => availableDatesFormatted.includes(date));

//         if (!isAvailable) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Room is not available during this period.',
//             });
//         }

//         // Tạo đặt phòng mới
//         const reservation = await Reservation.create({
//             room: roomId,
//             user: req.user.id,
//             checkInDate,
//             checkOutDate,
//         });

//         // Cập nhật danh sách ngày trống của phòng (loại bỏ những ngày đã đặt)
//         room.availableDates = room.availableDates.filter(date => {
//             return date < startDate || date > endDate;
//         });

//         await room.save();

//         res.status(201).json({
//             success: true,
//             data: reservation,
//         });
//     } catch (error) {
//         res.status(400).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

//kiểm tra phòng còn trống
exports.checkAvailability = async (req, res) => {
    const { roomId } = req.params;
    const { checkInDate, checkOutDate } = req.body;

    try {
        // Tìm phòng theo ID
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        // Chuyển đổi ngày để so sánh
        const startDate = new Date(checkInDate);
        const endDate = new Date(checkOutDate);

        // Tạo mảng các ngày yêu cầu
        const requestedDates = [];
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            requestedDates.push(date.toISOString().split('T')[0]); // Định dạng YYYY-MM-DD
        }

        // Chuyển đổi availableDates trong room về định dạng YYYY-MM-DD
        const availableDatesFormatted = room.availableDates.map(date => {
            return new Date(date).toISOString().split('T')[0]; // Định dạng lại ngày từ ISO thành YYYY-MM-DD
        });

        // Kiểm tra xem các ngày yêu cầu có nằm trong danh sách availableDates không
        const isAvailable = requestedDates.every(date => availableDatesFormatted.includes(date));

        if (isAvailable) {
            return res.status(200).json({
                success: true,
                message: 'Room is available during this period.',
            });
        } else {
            return res.status(200).json({
                success: false,
                message: 'Room is not available during this period.',
            });
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


//hủy phòng
exports.cancelBooking = async (req, res) => {
    const { reservationId } = req.params;

    try {
        // Tìm đặt phòng
        const reservation = await Reservation.findById(reservationId);

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // Kiểm tra nếu `reservation.user` hoặc `req.user` bị undefined
        if (!reservation.user || !req.user) {
            return res.status(400).json({ success: false, message: 'User information missing' });
        }

        // Xác thực người dùng (chỉ người tạo hoặc admin mới có quyền)
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this reservation' });
        }

        // Hủy đặt phòng
        reservation.status = 'cancelled';
        await reservation.save();

        // Cập nhật ngày trống của phòng
        const room = await Room.findById(reservation.room);
        const checkInDate = new Date(reservation.checkInDate);
        const checkOutDate = new Date(reservation.checkOutDate);

        // Cập nhật `availableDates` bằng cách hợp nhất khoảng trống mới vào danh sách hiện tại
        const updatedAvailableDates = [];
        let merged = false;

        for (const availableDate of room.availableDates) {
            const availableStart = new Date(availableDate.startDate);
            const availableEnd = new Date(availableDate.endDate);

            // Nếu khoảng mới ở ngay trước hoặc ngay sau khoảng hiện tại, hợp nhất chúng
            if (!merged && checkOutDate < availableStart && checkOutDate.getTime() + 86400000 === availableStart.getTime()) {
                updatedAvailableDates.push({ startDate: checkInDate, endDate: availableEnd });
                merged = true;
            } else if (!merged && checkInDate > availableEnd && checkInDate.getTime() - 86400000 === availableEnd.getTime()) {
                updatedAvailableDates.push({ startDate: availableStart, endDate: checkOutDate });
                merged = true;
            } else if (checkOutDate < availableStart || checkInDate > availableEnd) {
                // Nếu khoảng mới không liên quan, giữ nguyên khoảng hiện tại
                updatedAvailableDates.push(availableDate);
            } else if (!merged) {
                // Nếu chưa hợp nhất, thêm khoảng mới vào
                updatedAvailableDates.push({ startDate: checkInDate, endDate: checkOutDate });
                merged = true;
            }
        }

        // Nếu chưa hợp nhất khoảng mới với khoảng nào, thêm nó vào
        if (!merged) {
            updatedAvailableDates.push({ startDate: checkInDate, endDate: checkOutDate });
        }

        // Sắp xếp lại các khoảng thời gian trống và cập nhật `availableDates`
        room.availableDates = updatedAvailableDates.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        await room.save();

        res.status(200).json({
            success: true,
            message: 'Reservation cancelled',
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


exports.getBookingsByHotel = async (req, res) => {
    try {
      const { hotelId } = req.params; // Lấy hotelId từ params
      console.log(hotelId);
  
      // Kiểm tra nếu hotelId không hợp lệ
      if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        return res.status(400).json({ message: "Invalid hotelId" });
      }
  
      // Truy vấn tất cả các bản ghi có hotelId trùng khớp và lọc room không null
      const bookings = await Reservation.find()
        .populate({
          path: 'room', // Liên kết với Room
          match: { hotel: new mongoose.Types.ObjectId(hotelId) }, // Lọc theo hotelId trong Room
          populate: { path: 'hotel' }, // Tùy chọn: Lấy thêm thông tin chi tiết về hotel
        })
        .populate("user", "name email") // Lấy thông tin người dùng
        .exec();
  
      // Lọc bỏ các bản ghi có room là null
      const filteredBookings = bookings.filter(booking => booking.room !== null);
  
      // Nếu không tìm thấy đặt phòng nào
      if (filteredBookings.length === 0) {
        return res.status(200).json([]);    
      }
  
      // Trả về danh sách đặt phòng đã lọc
      res.status(200).json(filteredBookings);
    } catch (err) {
      console.error("Error fetching bookings by hotelId:", err);
      res.status(500).json({ message: "Server Error" });
    }
  };
  
    exports.getBookingsByUser = async (req, res) => {
      try {
        const { userId } = req.params; // Lấy hotelId từ params
    
        // Kiểm tra nếu hotelId không hợp lệ
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: "Invalid userId" });
        }
    
        // Truy vấn tất cả các bản ghi có hotelId trùng khớp
        const bookings = await Reservation.find({ user: new mongoose.Types.ObjectId(userId) })
          .populate({          
            path: 'room', 
            populate: { path: 'hotel' },
          })
          .exec();
        // console.log(bookings);
  
        // Nếu không tìm thấy đặt phòng nào
        if (bookings.length === 0) {
          return res.status(404).json({ message: "No bookings found for this user" });
        }
    
        // Trả về danh sách đặt phòng
        res.status(200).json(bookings);
      } catch (err) {
        console.error("Error fetching bookings by userId:", err);
        res.status(500).json({ message: "Server Error" });
      }
    };
  
  exports.getBookingsById = async (req, res) => {
    try {
      const { Id } = req.params; // Lấy hotelId từ params
  
      // Kiểm tra nếu hotelId không hợp lệ
      if (!mongoose.Types.ObjectId.isValid(Id)) {
        return res.status(400).json({ message: "Invalid booking" });
      }
  
      // Truy vấn tất cả các bản ghi có hotelId trùng khớp
      const bookings = await Reservation.findById(Id)
          .populate("user")
        .populate("room") 
        .exec();
        if (bookings.length === 0) {
        return res.status(404).json({ message: "No booking found" });
      }
  
      // Trả về danh sách đặt phòng
      res.status(200).json(bookings);
    } catch (err) {
      console.error("Error fetching booking:", err);
      res.status(500).json({ message: "Server Error" });
    }
  };
  
  exports.updateGuestsById = async (req, res) => {
    try {
      const { Id } = req.params; // Lấy booking Id từ params
      const { guests } = req.body; // Lấy danh sách guests từ body request
   
      // Kiểm tra nếu booking Id không hợp lệ
      if (!mongoose.Types.ObjectId.isValid(Id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
    
      // Kiểm tra dữ liệu guests có tồn tại và đúng định dạng
      if (!Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ message: "Guests data is invalid or missing" });
      }
    
      // Tìm và cập nhật danh sách guests
      const updatedReservation = await Reservation.findByIdAndUpdate(
        Id,
        { guests }, // Cập nhật trường guests
        { new: true, runValidators: true } // Trả về bản ghi đã cập nhật và kiểm tra validation
      );
    
        // Kiểm tra nếu không tìm thấy booking
        if (!updatedReservation) {
          return res.status(404).json({ message: "Booking not found" });
        }
    
      // Trả về bản ghi đã cập nhật
      res.status(200).json(updatedReservation);
    } catch (err) {
      console.error("Error updating guests:", err);
      res.status(500).json({ message: "Server Error" });
    }
  };