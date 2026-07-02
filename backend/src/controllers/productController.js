const db = require('../../config/database'); // Đã sửa đường dẫn chuẩn theo file của bạn

// 1. Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM products ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Tìm sản phẩm bằng mã vạch (Dùng cho máy quét Barcode)
exports.getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        const [rows] = await db.execute('SELECT * FROM products WHERE barcode = ?', [barcode]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm với mã vạch này!' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Thêm sản phẩm mới vào kho
exports.createProduct = async (req, res) => {
    try {
        const { barcode, name, price, stock, unit, category_id } = req.body;
        
        // Kiểm tra xem mã vạch đã tồn tại chưa
        const [exist] = await db.execute('SELECT id FROM products WHERE barcode = ?', [barcode]);
        if (exist.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã vạch này đã tồn tại ở một sản phẩm khác!' });
        }

        await db.execute(
            'INSERT INTO products (barcode, name, price, stock, unit, category_id) VALUES (?, ?, ?, ?, ?, ?)',
            [barcode, name, price, stock, unit || 'Cái', category_id || 1]
        );
        res.json({ success: true, message: 'Thêm sản phẩm vào kho thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Cập nhật thông tin sản phẩm (Sửa hàng hóa/Sửa kho)
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { barcode, name, price, stock, unit, category_id } = req.body;

        await db.execute(
            'UPDATE products SET barcode = ?, name = ?, price = ?, stock = ?, unit = ?, category_id = ? WHERE id = ?',
            [barcode, name, price, stock, unit, category_id, id]
        );
        res.json({ success: true, message: 'Cập nhật sản phẩm thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Xóa sản phẩm khỏi hệ thống
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM products WHERE id = ?', [id]);
        res.json({ success: true, message: 'Đã xóa sản phẩm khỏi kho!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};