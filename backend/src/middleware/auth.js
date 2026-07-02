const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // 1. Lấy token từ header "Authorization" (Định dạng chuẩn: Bearer <token>)
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Truy cập bị từ chối! Bạn chưa đăng nhập hoặc thiếu Token bảo mật.' 
            });
        }

        // 2. Tách lấy chuỗi chuỗi Token nguyên bản đứng sau chữ "Bearer "
        const token = authHeader.split(' ')[1];

        // 3. Giải mã và xác thực Token bằng mã bí mật JWT_SECRET trong file .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supermarket_secret_key_2025');

        // 4. Đính kèm thông tin nhân viên đã giải mã vào req để các controller sau có thể dùng
        req.employee = decoded;

        // 5. Token hợp lệ, cho phép đi tiếp đến hàm xử lý trong Controller
        next();
        
    } catch (error) {
        console.error('Lỗi xác thực Token:', error.message);
        return res.status(401).json({ 
            success: false, 
            message: 'Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.' 
        });
    }
};