const axios = require('axios').default;
const CryptoJS = require('crypto-js');
const moment = require('moment');
const Reservation = require('../models/reservation'); // Model đặt phòng
const Order = require('../models/order'); // Model order bạn đã tạo
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const User = require('../models/user');
const Transaction = require('../models/transaction'); // Model giao dịch
const AdminBalance = require('../models/adminBalance');
const HostBalance = require('../models/hostBalance');
const { sendPaymentConfirmationEmail } = require('../middlewares/gmailMiddleware');


// APP INFO
const config = {
    app_id: "2553",
    key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
    key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
    endpoint: "https://sb-openapi.zalopay.vn/v2/create"
};

// Tạo đơn hàng và gọi API thanh toán Zalopay
exports.createOrder = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: 'Người dùng không được xác thực' });
    }
    const { reservationId } = req.body; // Nhận ID đặt phòng và số tiền từ client

    try {
        // Lấy thông tin đặt phòng
        const reservation = await Reservation.findById(reservationId).populate('room');
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // Tính toán số tiền (amount) dựa trên giá phòng và số ngày
        if (!reservation.room || !reservation.room.price) {
            return res.status(400).json({ success: false, message: 'Room information is incomplete or missing' });
        }

        const checkInDate = new Date(reservation.checkInDate);
        const checkOutDate = new Date(reservation.checkOutDate);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)); // Số đêm
        let amount;
        if (reservation.paymentMethod == 50) {
            amount = reservation.room.price * nights * 0.5 ; // Tổng số tiền
        } else {
            amount = reservation.room.price * nights ; // Tổng số tiền
        }
        // const amount = reservation.room.price * nights ; // Tổng số tiền

        // Tạo thông tin đơn hàng
        const transID = Math.floor(Math.random() * 1000000);
        const embed_data = { reservationId }; // Gắn ID đặt phòng vào embed_data để xử lý callback
        const items = [
            {
                //room_name: reservation.room.name, // Lấy tên phòng
                checkIn: reservation.checkInDate,
                checkOut: reservation.checkOutDate,
                amount: amount, // Số tiền cho phòng
            },
        ];

        const order = {
            app_id: config.app_id,
            app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // Mã giao dịch duy nhất
            app_user: req.user.id, // ID người dùng
            app_time: Date.now(), // Thời gian tạo đơn hàng
            item: JSON.stringify(items),
            embed_data: JSON.stringify(embed_data),
            amount: amount, // Tổng số tiền thanh toán
            description: `Payment for reservation #${reservationId}`,
            bank_code: "", // Sử dụng Zalopay app để thanh toán
            callback_url: "https://12f8-2001-ee0-1c56-61dc-5daa-77e0-915d-b155.ngrok-free.app/api/orders/callback",
        };

        // Tạo mã xác thực
        const data = config.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
        order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

        // Gọi API Zalopay
        const response = await axios.post(config.endpoint, null, { params: order });


        if (response.data.return_code === 1) {
            // Lưu đơn hàng vào database
            const newOrder = await Order.create({
                reservation: reservationId,
                user: req.user.id,
                transId: order.app_trans_id,
                amount,
                status: 'pending', // Trạng thái chờ thanh toán
                paymentUrl: response.data.order_url, // URL thanh toán trả về từ Zalopay
                paymentMethod: reservation.paymentMethod,
            });

            return res.status(201).json({
                success: true,
                message: 'Order created successfully',
                paymentUrl: response.data.order_url, // Đường dẫn để khách thanh toán
                orderId: newOrder._id,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: response.data.return_message || 'Failed to create Zalopay order',
            });
        }
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

exports.handleZaloPayCallback = async (req, res) => {
    let result = {};

    try {
        const dataStr = req.body.data;
        const reqMac = req.body.mac;

        // Tính toán mac
        const mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();

        console.log("dataStr:", dataStr);
        console.log("reqMac:", reqMac);
        console.log("calculatedMac:", mac);

        if (reqMac !== mac) {
            result.return_code = -1;
            result.return_message = "mac not equal";
            return res.json(result); // Trả về ngay nếu mac không khớp
        }

        // Parse dữ liệu JSON từ callback
        let dataJson;
        try {
            dataJson = JSON.parse(dataStr);
        } catch (err) {
            throw new Error("Invalid JSON format in callback data");
        }

        // Lấy thông tin giao dịch
        const appTransId = dataJson["app_trans_id"];
        const order = await Order.findOne({ transId: appTransId });

        if (!order) {
            throw new Error(`Order with transId ${appTransId} not found`);
        }

        // Kiểm tra nếu trạng thái đã là 'paid'
        if (order.status === "paid") {
            result.return_code = 1;
            result.return_message = "Order already paid";
            return res.json(result);
        }

        // Cập nhật trạng thái của Order
        order.status = "paid";
        await order.save();

        // Cập nhật trạng thái của Reservation
        const reservation = await Reservation.findById(order.reservation);
        if (!reservation) {
            throw new Error(`Reservation with id ${order.reservation} not found`);
        }
        reservation.status = "completed";
        await reservation.save();


        const room = await Room.findById(reservation.room);
        if (!room) {
            throw new Error(`Room with id ${reservation.room} not found`);
        }

        const hotel = await Hotel.findById(room.hotel);
        if (!hotel) {
            throw new Error(`Hotel with id ${room.hotel} not found`);
        }

        const hostId = hotel.owner;
        if (!hostId) {
            throw new Error(`Host ID not found in Hotel with id ${room.hotel}`);
        }
        
        let hostAmount;
        let adminFee;

        if (order.paymentMethod == 100) {
            hostAmount = order.amount * 0.75; // Host nhận 75%
            adminFee = order.amount * 0.25;  // Admin nhận 25%
        } else {
            hostAmount = order.amount * 0.50; // Host nhận 50%
            adminFee = order.amount * 0.50;  // Admin nhận 50%
        }


        console.log("UserId:", order.user._id);
        console.log("Amount:", order.amount);

        // Quản lý số dư Admin và Host
        // const hostAmount = order.amount * 0.75; // Host nhận 75%
        // const adminFee = order.amount * 0.25;  // Admin nhận 25%

        const host = await User.findById(hostId);
        // const user = await User.findById(order.user);

        if (host) {
            // Nếu tìm thấy host, gán thông tin cho hostName và hostEmail
            hostName = host.name;
            hostEmail = host.email;
        } else {
            console.log('Host not found');
        }


        const transaction = new Transaction({
            orderId: order._id,
            userId: order.user._id, // Lấy từ liên kết với Order
            hostId: hostId, // Lấy hostId từ Reservation
            roomId: room,
            reservationId: order.reservation,
            amount: order.amount, // Giả sử Order có trường amount
            hostAmount: hostAmount, // Tính toán dựa trên công thức (amount - adminFee)
            adminFee: adminFee,
            status: "paid",
            paymentDate: new Date(),
            hostName: hostName,  // Lưu thông tin hostName vào Transaction
            hostEmail: hostEmail, // Lưu thông tin hostEmail vào Transaction
            paymentMethod: order.paymentMethod,
        });

        await transaction.save();




        // Cập nhật AdminBalance
        let adminBalance = await AdminBalance.findOne();
        if (!adminBalance) {
            console.log('Admin balance not found. Initializing new admin balance.');
            adminBalance = new AdminBalance({
                totalBalance: 0,
                lastUpdated: Date.now(),
            });
        }
        adminBalance.totalBalance += adminFee; // Cộng thêm phần hoa hồng của admin
        adminBalance.lastUpdated = Date.now();
        await adminBalance.save();

        // Cập nhật HostBalance
        let hostBalance = await HostBalance.findOne({ hostId });
        if (!hostBalance) {
            console.log(`Host balance not found for hostId: ${hostId}, creating new balance`);
            hostBalance = new HostBalance({ hostId, totalBalance: 0 });
        }
        hostBalance.totalBalance += hostAmount;
        hostBalance.lastUpdated = Date.now();
        await hostBalance.save();


        console.log(`Order ${order._id} marked as paid`);
        console.log(`Reservation ${reservation._id} marked as completed`);
        console.log(`Transaction created for order ${order._id}`);
        console.log(`Host ${reservation.hostId} received amount ${hostAmount}`);
        console.log(`Admin balance updated, remaining: ${adminBalance.totalBalance}`);

        result.return_code = 1;
        result.return_message = "success";

        // await sendPaymentConfirmationEmail(user, order._id, reservation._id, order.amount );
    } catch (err) {
        console.error("Error processing callback:", err.message);
        result.return_code = 0; // Zalopay sẽ callback lại
        result.return_message = err.message;
    }

    // Trả kết quả về Zalopay
    res.json(result);
};
