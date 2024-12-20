const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/reviews/'; // Mặc định là thư mục reviews

        if (req.body.hotelId) {
            // Nếu có hotelId, lưu vào thư mục tương ứng
            uploadPath = `uploads/hotel/${req.body.hotelId}`;
        }

        // Tạo thư mục nếu chưa tồn tại
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and MP4 are allowed.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn file 5MB
});

module.exports = upload;
