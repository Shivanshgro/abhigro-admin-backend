const pool = require('../config/db');

// ── Vendors (shops) ──────────────────────────────────────────
exports.getVendors = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT s.*, u.name AS owner_name, u.phone AS owner_phone
       FROM shops s
       LEFT JOIN users u ON u.id = s.owner_user_id
       ORDER BY s.is_active ASC, s.id DESC`
    );
    res.json({ vendors: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.approveVendor = async (req, res) => {
  try {
    await pool.query(`UPDATE shops SET is_active = true WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Vendor approved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.disableVendor = async (req, res) => {
  try {
    await pool.query(`UPDATE shops SET is_active = false WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Vendor disabled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Delivery partners (users with role delivery) ─────────────
exports.getDeliveryPartners = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,
              name AS full_name,
              phone,
              email,
              role,
              (role = 'delivery') AS is_approved
       FROM users
       WHERE role IN ('delivery','delivery_pending')
       ORDER BY id DESC`
    );
    res.json({ partners: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.approveDeliveryPartner = async (req, res) => {
  try {
    await pool.query(`UPDATE users SET role = 'delivery' WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Delivery partner approved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.disableDeliveryPartner = async (req, res) => {
  try {
    await pool.query(`UPDATE users SET role = 'customer' WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Delivery partner disabled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
