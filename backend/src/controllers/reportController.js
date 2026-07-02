const { pool } = require('../../config/database');

const dashboard = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const [todayRevenue] = await pool.query(
            `SELECT COUNT(*) as orders, IFNULL(SUM(final_amount),0) as revenue FROM orders WHERE DATE(created_at)=? AND status='completed'`, [today]
        );
        const [monthRevenue] = await pool.query(
            `SELECT COUNT(*) as orders, IFNULL(SUM(final_amount),0) as revenue FROM orders WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW()) AND status='completed'`
        );
        const [productCount] = await pool.query(`SELECT COUNT(*) as total FROM products WHERE status='active'`);
        const [lowStock] = await pool.query(`SELECT COUNT(*) as total FROM products WHERE stock <= 10 AND status='active'`);
        const [employeeCount] = await pool.query(`SELECT COUNT(*) as total FROM employees WHERE status='active'`);
        const [topProducts] = await pool.query(
            `SELECT p.name, SUM(oi.quantity) as sold, SUM(oi.subtotal) as revenue
             FROM order_items oi JOIN products p ON oi.product_id=p.id
             JOIN orders o ON oi.order_id=o.id WHERE o.status='completed' AND MONTH(o.created_at)=MONTH(NOW())
             GROUP BY p.id ORDER BY sold DESC LIMIT 5`
        );
        const [revenueByDay] = await pool.query(
            `SELECT DATE(created_at) as date, IFNULL(SUM(final_amount),0) as revenue, COUNT(*) as orders
             FROM orders WHERE status='completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at) ORDER BY date ASC`
        );
        res.json({
            success: true, data: {
                today: todayRevenue[0],
                month: monthRevenue[0],
                products: productCount[0].total,
                low_stock: lowStock[0].total,
                employees: employeeCount[0].total,
                top_products: topProducts,
                revenue_by_day: revenueByDay
            }
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const revenueReport = async (req, res) => {
    const { from_date, to_date, group_by = 'day' } = req.query;
    const from = from_date || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const to = to_date || new Date().toISOString().slice(0, 10);

    let dateFormat = group_by === 'month' ? '%Y-%m' : '%Y-%m-%d';
    try {
        const [rows] = await pool.query(
            `SELECT DATE_FORMAT(created_at, ?) as period,
             COUNT(*) as orders, SUM(final_amount) as revenue, SUM(discount) as discount,
             SUM(total_amount) as gross
             FROM orders WHERE status='completed' AND DATE(created_at) BETWEEN ? AND ?
             GROUP BY period ORDER BY period ASC`,
            [dateFormat, from, to]
        );
        res.json({ success: true, data: rows, from, to });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { dashboard, revenueReport };