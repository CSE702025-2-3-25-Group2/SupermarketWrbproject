const mysql = require('mysql2');
require('dotenv').config();

// Tạo một Connection Pool để tối ưu hóa việc kết nối dữ liệu
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'supermarket_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Chuyển đổi Pool sang dạng Promise để thuận tiện sử dụng async/await khi viết API
const db = pool.promise();

// Thử nghiệm kết nối ngay khi khởi động ứng dụng
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Lỗi kết nối cơ sở dữ liệu XAMPP:', err.message);
    } else {
        console.log('✅ Kết nối thành công đến database XAMPP (supermarket_db)!');
        connection.release(); // Giải phóng kết nối sau khi kiểm tra xong
    }
});

module.exports = db;