const pool = require('../config/db');

exports.getVendors = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM shops ORDER BY id DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.approveVendor = async (req, res) => {
  try {
    await pool.query('UPDATE shops SET is_active = true WHERE id = \', [req.params.id]);
    res.json({ success: true, message: 'Vendor approved' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.disableVendor = async (req, res) => {
  try {
    await pool.query('UPDATE shops SET is_active = false WHERE id = \', [req.params.id]);
    res.json({ success: true, message: 'Vendor disabled' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getDeliveryPartners = async (req, res) => {
  try {
    const r = await pool.query("SELECT id, name, email, phone, role FROM users WHERE role = 'delivery' ORDER BY id DESC");
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.approveDeliveryPartner = async (req, res) => {
  try {
    await pool.query("UPDATE users SET role = 'delivery' WHERE id = \", [req.params.id]);
    res.json({ success: true, message: 'Delivery partner approved' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.disableDeliveryPartner = async (req, res) => {
  try {
    await pool.query("UPDATE users SET role = 'customer' WHERE id = \", [req.params.id]);
    res.json({ success: true, message: 'Delivery partner disabled' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
