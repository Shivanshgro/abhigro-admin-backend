const pool = require('../config/db');

// ── Dashboard stats ──────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {};
    const safe = async (q) => {
      try { const r = await pool.query(q); return Number(r.rows[0].count); }
      catch (e) { return 0; }
    };
    stats.totalUsers   = await safe(`SELECT COUNT(*) FROM users`);
    stats.totalOrders  = await safe(`SELECT COUNT(*) FROM orders`);
    stats.totalShops   = await safe(`SELECT COUNT(*) FROM shops`);
    stats.totalProducts= await safe(`SELECT COUNT(*) FROM products`);

    let revenue = 0;
    try {
      const r = await pool.query(`SELECT COALESCE(SUM(total_amount),0) AS sum FROM orders`);
      revenue = Number(r.rows[0].sum);
    } catch (e) { revenue = 0; }
    stats.totalRevenue = revenue;

    let recentOrders = [];
    try {
      const r = await pool.query(`SELECT id, total_amount, status, created_at FROM orders ORDER BY id DESC LIMIT 10`);
      recentOrders = r.rows;
    } catch (e) { recentOrders = []; }
    stats.recentOrders = recentOrders;

    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── Users ────────────────────────────────────────────────────
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
