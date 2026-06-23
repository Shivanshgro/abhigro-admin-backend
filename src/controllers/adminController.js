const pool = require('../config/db');

const num = async (q) => {
  try { const r = await pool.query(q); return Number(r.rows[0].count); }
  catch (e) { return 0; }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {};
    stats.total_users      = await num(`SELECT COUNT(*) FROM users`);
    stats.total_shops      = await num(`SELECT COUNT(*) FROM shops`);
    stats.total_products   = await num(`SELECT COUNT(*) FROM products`);
    stats.total_orders     = await num(`SELECT COUNT(*) FROM orders`);
    stats.total_deliveries = await num(`SELECT COUNT(*) FROM orders WHERE delivery_boy_id IS NOT NULL`);
    stats.total_pharmacies = await num(`SELECT COUNT(*) FROM pharmacies`);

    let revenue = 0;
    try {
      const r = await pool.query(`SELECT COALESCE(SUM(total_amount),0) AS sum FROM orders`);
      revenue = Math.round(Number(r.rows[0].sum));
    } catch (e) { revenue = 0; }
    stats.total_revenue = revenue;

    res.json({ stats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, name, email, phone, role, created_at FROM users ORDER BY id DESC`
    );
    res.json({ users: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    await pool.query(`UPDATE users SET role=$1 WHERE id=$2`, [role, req.params.id]);
    res.json({ message: 'User role updated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
