const pool = require('../config/db');

async function safeCount(query) {
  try {
    const r = await pool.query(query);
    return Number(r.rows[0].count || r.rows[0].total || 0);
  } catch { return 0; }
}

async function safeSum(query) {
  try {
    const r = await pool.query(query);
    return r.rows[0].total_revenue || 0;
  } catch { return 0; }
}

exports.getDashboardStats = async (req, res) => {
  try {
    const [users, shops, products, orders, deliveries, revenue] = await Promise.all([
      safeCount('SELECT COUNT(*) FROM users'),
      safeCount('SELECT COUNT(*) FROM shops'),
      safeCount('SELECT COUNT(*) FROM products'),
      safeCount('SELECT COUNT(*) FROM orders'),
      safeCount('SELECT COUNT(*) FROM deliveries'),
      safeSum("SELECT COALESCE(SUM(amount),0) AS total_revenue FROM payments WHERE payment_status='success'"),
    ]);

    res.json({
      message: 'Dashboard stats fetched successfully',
      stats: { total_users: users, total_shops: shops, total_products: products, total_orders: orders, total_deliveries: deliveries, total_revenue: revenue }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, created_at FROM users ORDER BY id DESC`
    );
    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const result = await pool.query(
      `UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, email, role`,
      [role, id]
    );
    res.json({ message: 'Role updated', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
