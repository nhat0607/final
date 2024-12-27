const cron = require('node-cron');
const Reservation = require('../models/reservation');
const Room = require('../models/room');

// Hợp nhất khoảng thời gian
const mergeAvailableDates = (dates) => {
    dates.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const merged = [];
    for (const date of dates) {
        if (!merged.length || new Date(date.startDate) > new Date(merged[merged.length - 1].endDate)) {
            merged.push(date);
        } else {
            merged[merged.length - 1].endDate = new Date(
                Math.max(
                    new Date(merged[merged.length - 1].endDate),
                    new Date(date.endDate)
                )
            );
        }
    }
    return merged;
};

cron.schedule('* * * * *', async () => {


    const now = new Date();

    try {
        // Tìm các đặt phòng đã hết hạn
        const expiredReservations = await Reservation.find({
            expirationDate: { $lt: now },
            status: 'booked', // Chỉ kiểm tra các đặt phòng chưa thanh toán
        });

        for (const reservation of expiredReservations) {
            console.log(`Reservation ${reservation._id} has expired. Updating status and restoring available dates...`);

            // Cập nhật trạng thái đặt phòng thành "canceled"
            reservation.status = 'cancelled';
            await reservation.save();

            // Trả lại khoảng thời gian vào availableDates của Room
            const room = await Room.findById(reservation.room);
            if (room) {
                room.availableDates.push({
                    startDate: reservation.checkInDate,
                    endDate: reservation.checkOutDate,
                });

                // Gộp các khoảng ngày trống chồng chéo
                room.availableDates = mergeAvailableDates(room.availableDates);
                await room.save();

                console.log(`Room ${room._id}: Restored available dates for reservation ${reservation._id}`);
            }
        }


    } catch (error) {
        console.error('Error while checking expired reservations:', error);
    }
});
