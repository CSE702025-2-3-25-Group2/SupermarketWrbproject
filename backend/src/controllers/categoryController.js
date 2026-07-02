const db = require('../../config/database');

exports.getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        await db.execute('INSERT INTO categories (name) VALUES (?)', [name]);
        res.json({ success: true, message: 'Thêm danh mục thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};