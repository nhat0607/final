const express = require('express');
const mongoose = require('mongoose');
const hotelRoutes = require('./src/routes/hotelRoutes');
const authRoutes = require('./src/routes/authRoutes');
const roomRoutes = require('./src/routes/roomRoutes')
const reservationRoutes = require('./src/routes/reservationRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes')
const { engine } = require('express-handlebars'); // Sử dụng destructuring để lấy engine từ express-handlebars
const path = require('path');

const cors = require('cors');

const dotenv = require('dotenv'); // Thêm dòng này để import dotenv

dotenv.config(); // Gọi hàm config() để sử dụng biến môi trường

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: err.message,
    });
});

// Cấu hình CORS
app.use(cors({
    origin: '*', // Chỉ cho phép frontend của bạn
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các method được phép
    credentials: true, // Nếu frontend gửi kèm cookie
}));

// Hoặc cho phép mọi nguồn gốc (không khuyến khích trong sản phẩm thực tế)
app.use(cors());



app.engine('handlebars', engine()); // Thay đổi ở đây
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src', 'views')); // Thư mục chứa template Handlebars

// Kết nối tới MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));


// Sử dụng routes

// Sử dụng routes cho xác thực
app.use('/api/auth', authRoutes);

app.use('/api/hotels', hotelRoutes);

app.use('/api/rooms', roomRoutes);

app.use('/api/reservations', reservationRoutes);

//app.use('/api', paymentRoutes);

app.use('/api/orders', orderRoutes); // Đăng ký routes order

app.use('/uploads/reviews', express.static('uploads'));

app.use('/api/reviews', reviewRoutes);

app.use('/api/transaction', transactionRoutes);



// Định nghĩa route mẫu
app.get('/', (req, res) => {
    res.send('Welcome to the Booking App API');
});
// Đọc các biến môi trường từ file .env


// Middleware để parse JSON
app.use(express.json());

// Export app để sử dụng trong server.js
module.exports = app;
