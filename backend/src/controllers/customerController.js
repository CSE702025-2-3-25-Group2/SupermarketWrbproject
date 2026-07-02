const db = require('../../config/database');

// Lấy tất cả khách hàng
exports.getAllCustomers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM customers ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm khách hàng mới
exports.createCustomer = async (req, res) => {
    try {
        const { phone, full_name } = req.body;
        if (!phone || !full_name) {
            return res.status(400).json({ success: false, message: 'Thiếu số điện thoại hoặc họ tên khách!' });
        }

        const [exist] = await db.execute('SELECT id FROM customers WHERE phone = ?', [phone]);
        if (exist.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại khách hàng này đã tồn tại!' });
        }


        const [result] = await db.execute('INSERT INTO customers (phone, full_name, points) VALUES (?, ?, 0)', [phone, full_name]);
        
        
        res.json({ 
            success: true, 
            message: 'Thêm khách hàng thành công!',
            data: {
                id: result.insertId, // Lấy ID tự động tăng vừa được sinh ra trong DB
                phone,
                full_name,
                points: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa thông tin khách hàng
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM customers WHERE id = ?', [id]);
        res.json({ success: true, message: 'Đã xóa khách hàng!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
