const Transaction = require('../models/transaction');
const Reservation = require('../models/reservation'); // Model đặt phòng
const Order = require('../models/order'); // Model order bạn đã tạo
const HostBalance = require('../models/hostBalance');
const AdminBalance = require('../models/adminBalance');
exports.getCustomerTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id, status: "paid" })
            .select("-hostAmount -adminFee")// Ẩn thông tin không cần thiết
            .populate({
                path: "reservationId",
                select: "room checkInDate checkOutDate", // Chỉ lấy trường cần thiết
                populate: {
                    path: "room",
                    select: "hotel", // Lấy hotelId từ Room
                    populate: {
                        path: "hotel",
                        select: "name", // Lấy tên khách sạn từ Hotel
                    },
                },
            });

        // Ghi log chi tiết khi populate gặp vấn đề
        const formattedTransactions = transactions.map((transaction) => {
            if (
                !transaction.reservationId ||
                !transaction.reservationId.roomId ||
                !transaction.reservationId.roomId.hotelId
            ) {
                console.error("Populate data missing for transaction:", {
                    transactionId: transaction._id,
                    reservationId: transaction.reservationId?._id || "null",
                    roomId: transaction.reservationId?.roomId?._id || "null",
                    hotelId: transaction.reservationId?.roomId?.hotelId?._id || "null",
                });
            }

            return {
                transactionId: transaction._id,
                roomId: transaction.reservationId?.room,
                amount: transaction.amount,
                paymentMethod: transaction.paymentMethod,
                transactionDate: transaction.transactionDate,
                status: transaction.status,
                checkInDate: transaction.reservationId?.checkInDate || null,
                checkOutDate: transaction.reservationId?.checkOutDate || null,
                hotelName: transaction.reservationId?.room?.hotel?.name || null,
            };
        });

        res.status(200).json({
            success: true,
            data: formattedTransactions,
        });
    } catch (error) {
        console.error("Error fetching customer transactions:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getHostTransactions = async (req, res) => {
    try {
        // Lấy tất cả giao dịch liên quan đến Host
        const transactions = await Transaction.find({ hostId: req.user.id, status: "paid" })
            .select("-adminFee")// Ẩn thông tin không cần thiết với Host
            .populate({
                path: "reservationId",
                select: "room checkInDate checkOutDate", // Chỉ lấy trường cần thiết
                populate: {
                    path: "room",
                    select: "hotel", // Lấy hotelId từ Room
                    populate: {
                        path: "hotel",
                        select: "name", // Lấy tên khách sạn từ Hotel
                    },
                },
            });


        // Lấy số dư hiện tại của Host
        const hostBalance = await HostBalance.findOne({ hostId: req.user.id });

        res.status(200).json({
            success: true,
            data: {
                balance: hostBalance?.totalBalance || 0, // Nếu không có, trả về 0
                transactions: transactions.map(transaction => ({
                    transactionId: transaction._id,
                    roomId: transaction.reservationId?.room,
                    hostAmount: transaction.hostAmount,
                    amount: transaction.amount,
                    paymentMethod: transaction.paymentMethod,
                    transactionDate: transaction.transactionDate,
                    status: transaction.status,
                    checkInDate: transaction.reservationId?.checkInDate || null,
                    checkOutDate: transaction.reservationId?.checkOutDate || null,
                    hotelName: transaction.reservationId?.room?.hotel?.name || null,
                })),
            },
        });
    } catch (error) {
        console.error("Error fetching host transactions:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getAdminTransactions = async (req, res) => {
    try {
        // Lấy tất cả giao dịch với trạng thái 'paid'
        const transactions = await Transaction.find({ status: "paid" })
            .populate({
                path: "userId", // Liên kết với thông tin người dùng (khách hàng)
                select: "name email", // Chỉ lấy các trường cần thiết
            })
            .populate({
                path: "reservationId", // Liên kết với thông tin đặt phòng
                select: "room checkInDate checkOutDate",
                populate: {
                    path: "room", // Liên kết với thông tin phòng
                    select: "hotel",
                    populate: {
                        path: "hotel",
                        select: "name",
                    },
                },
            });

        // Định dạng dữ liệu trước khi trả về
        // Lấy số dư hiện tại của Admin
        const adminBalance = await AdminBalance.findOne();

        const formattedTransactions = transactions.map((transaction) => ({
            transactionId: transaction._id,
            hostId: transaction.hostId,
            roomId: transaction.reservationId?.room,
            amount: transaction.amount,
            paymentMethod: transaction.paymentMethod,
            status: transaction.status,
            transactionDate: transaction.transactionDate,
            customerName: transaction.userId?.name || "N/A",
            customerEmail: transaction.userId?.email || "N/A",
            hostName: transaction.hostName || "N/A",
            hostEmail: transaction.hostEmail || "N/A",
            checkInDate: transaction.reservationId?.checkInDate || null,
            checkOutDate: transaction.reservationId?.checkOutDate || null,
            // hotelName: transaction.reservationId?.room?.hotel?.name || null,
        }));

        res.status(200).json({
            success: true,
            data: {
                balance: adminBalance?.totalBalance || 0, // Nếu không có, trả về 0
                formattedTransactions,
            },
        });
    } catch (error) {
        console.error("Error fetching admin transactions:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

