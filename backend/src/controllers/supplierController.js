const db = require('../../config/database');

// Lấy danh sách nhà cung cấp
exports.getAllSuppliers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM suppliers ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm nhà cung cấp
exports.createSupplier = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        await db.execute('INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)', [name, phone, address]);
        res.json({ success: true, message: 'Thêm nhà cung cấp thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lập phiếu nhập hàng kho và tự động cộng dồn tồn kho sản phẩm
exports.createReceipt = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const { supplier_id, items, created_by } = req.body; // items: [{product_id, import_price, quantity}]
        
        let total_amount = 0;
        items.forEach(item => { total_amount += item.import_price * item.quantity; });

        // Insert phiếu nhập
        const [receiptResult] = await connection.execute(
            'INSERT INTO goods_receipts (supplier_id, total_amount, created_by) VALUES (?, ?, ?)',
            [supplier_id, total_amount, created_by || null]
        );
        const receiptId = receiptResult.insertId;

        // Xử lý từng sản phẩm trong phiếu nhập
        for (const item of items) {
            await connection.execute(
                'INSERT INTO goods_receipt_details (receipt_id, product_id, import_price, quantity) VALUES (?, ?, ?, ?)',
                [receiptId, item.product_id, item.import_price, item.quantity]
            );
            // Tự động tăng số lượng tồn kho sản phẩm (stock)
            await connection.execute(
                'UPDATE products SET stock = stock + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Lập phiếu nhập kho và cập nhật số lượng tồn kho thành công!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// Xem lịch sử nhập hàng
exports.getReceipts = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, s.name as supplier_name 
            FROM goods_receipts r 
            LEFT JOIN suppliers s ON r.supplier_id = s.id 
            ORDER BY r.id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};