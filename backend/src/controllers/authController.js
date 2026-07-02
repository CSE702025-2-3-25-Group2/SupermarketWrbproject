const db = require('../../config/database');
const jwt = require('jsonwebtoken');

// Xử lý đăng nhập
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu!' });
        }

        const [rows] = await db.execute('SELECT * FROM employees WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại!' });
        }

        const employee = rows[0];

        // So sánh trực tiếp mật khẩu thuần thục
        if (password !== employee.password) {
            return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
        }

        // Tạo chuỗi Token bảo mật JWT mã hóa trong 1 ngày
        const token = jwt.sign(
            { id: employee.id, username: employee.username, role: employee.role },
            'SUPERMARKET_SECRET_KEY',
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: employee.id,
                username: employee.username,
                full_name: employee.full_name,
                role: employee.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy tất cả nhân viên (Chỉ Admin)
exports.getAllEmployees = async (req, res) => {
    try {
        if (req.employee.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền này!' });
        }
        const [rows] = await db.execute('SELECT id, username, full_name, role, created_at FROM employees');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin tự tạo tài khoản mới cho nhân viên cấp dưới
exports.createEmployee = async (req, res) => {
    try {
        if (req.employee.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền này!' });
        }

        const { username, password, full_name, role } = req.body;
        if (!username || !password || !full_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin!' });
        }

        const [exist] = await db.execute('SELECT id FROM employees WHERE username = ?', [username]);
        if (exist.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên tài khoản này đã tồn tại!' });
        }

        await db.execute(
            'INSERT INTO employees (username, password, full_name, role) VALUES (?, ?, ?, ?)',
            [username, password, full_name, role || 'staff']
        );

        res.json({ success: true, message: 'Tạo tài khoản nhân viên thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa tài khoản nhân viên
exports.deleteEmployee = async (req, res) => {
    try {
        if (req.employee.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền này!' });
        }
        const { id } = req.params;
        
        if (parseInt(id) === req.employee.id) {
            return res.status(400).json({ success: false, message: 'Bạn không thể tự xóa tài khoản của mình!' });
        }

        await db.execute('DELETE FROM employees WHERE id = ?', [id]);
        res.json({ success: true, message: 'Đã xóa nhân viên thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};