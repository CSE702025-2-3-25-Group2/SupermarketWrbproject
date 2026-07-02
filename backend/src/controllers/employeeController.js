const { pool } = require('../../config/database');

const getAll = async (req, res) => {
    const { search, position, status } = req.query;
    let sql = `SELECT * FROM employees WHERE 1=1`;
    const params = [];
    if (search) { sql += ` AND (name LIKE ? OR code LIKE ? OR phone LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (position) { sql += ` AND position = ?`; params.push(position); }
    if (status) { sql += ` AND status = ?`; params.push(status); }
    sql += ` ORDER BY id DESC`;
    try {
        const [rows] = await pool.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM employees WHERE id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const create = async (req, res) => {
    const { code, name, phone, email, position, salary, start_date } = req.body;
    if (!code || !name) return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    try {
        const [r] = await pool.query(
            `INSERT INTO employees (code, name, phone, email, position, salary, start_date) VALUES (?,?,?,?,?,?,?)`,
            [code, name, phone, email, position || 'cashier', salary || 0, start_date || null]
        );
        res.status(201).json({ success: true, message: 'Thêm nhân viên thành công', id: r.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Mã nhân viên đã tồn tại' });
        res.status(500).json({ success: false, message: err.message });
    }
};

const update = async (req, res) => {
    const { name, phone, email, position, salary, start_date, status } = req.body;
    try {
        await pool.query(
            `UPDATE employees SET name=?, phone=?, email=?, position=?, salary=?, start_date=?, status=? WHERE id=?`,
            [name, phone, email, position, salary, start_date, status, req.params.id]
        );
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const remove = async (req, res) => {
    try {
        await pool.query(`UPDATE employees SET status='inactive' WHERE id=?`, [req.params.id]);
        res.json({ success: true, message: 'Đã vô hiệu hóa nhân viên' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAll, getOne, create, update, remove };