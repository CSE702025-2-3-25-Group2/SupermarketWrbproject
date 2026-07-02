const db = require('../../config/database');

// Tạo đơn hàng mới + Trừ kho tự động bằng Transaction
exports.createOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { employee_id, total_amount, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Giỏ hàng trống!" });
        }

        // 1. Tạo hóa đơn gốc trong bảng orders
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (employee_id, total_amount) VALUES (?, ?)',
            [employee_id, total_amount]
        );
        const orderId = orderResult.insertId;

        // 2. Lặp qua các món đồ để tạo chi tiết và trừ kho
        for (let item of items) {
            // Kiểm tra hàng tồn kho trước
            const [product] = await connection.execute('SELECT stock, name FROM products WHERE id = ?', [item.product_id]);
            if (product.length === 0) {
                throw new Error(`Sản phẩm ID ${item.product_id} không tồn tại!`);
            }
            if (product[0].stock < item.quantity) {
                throw new Error(`Sản phẩm "${product[0].name}" không đủ hàng trong kho (Còn: ${product[0].stock})`);
            }

            // Ghi vào bảng chi tiết hóa đơn
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );

            // Cập nhật khấu trừ số lượng tồn kho
            await connection.execute(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: "Thanh toán thành công!", orderId });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// Lấy toàn bộ lịch sử hóa đơn
exports.getOrderHistory = async (req, res) => {
    try {
        if (req.employee.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xem báo cáo!' });
        }
        const [orders] = await db.execute(`
            SELECT o.id, o.total_amount, o.created_at, e.full_name AS employee_name 
            FROM orders o
            JOIN employees e ON o.employee_id = e.id
            ORDER BY o.created_at DESC
        `);
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy chi tiết món bên trong một hóa đơn cụ thể
exports.getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const [items] = await db.execute(`
            SELECT od.quantity, od.price, p.name AS product_name, p.unit
            FROM order_details od
            JOIN products p ON od.product_id = p.id
            WHERE od.order_id = ?
        `, [id]);
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy số liệu tổng quan (Tổng doanh thu và số lượng đơn)
exports.getDashboardStats = async (req, res) => {
    try {
        if (req.employee.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền!' });
        }
        const [stats] = await db.execute('SELECT SUM(total_amount) AS total_revenue, COUNT(id) AS total_orders FROM orders');
        res.json({ 
            success: true, 
            data: {
                total_revenue: stats[0].total_revenue || 0,
                total_orders: stats[0].total_orders || 0
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};