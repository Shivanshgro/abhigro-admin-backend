const pool = require('../config/db');

// GET /api/admin/medicine/orders
exports.getMedicineOrders = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, ph.pharmacy_name
       FROM medicine_orders o
       LEFT JOIN pharmacies ph ON ph.id = o.pharmacy_id
       ORDER BY o.id DESC LIMIT 300`
    );
    res.json({ orders: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/admin/medicine/orders/:id
exports.getMedicineOrder = async (req, res) => {
  try {
    const o = await pool.query(
      `SELECT o.*, ph.pharmacy_name, ph.drug_license_number
       FROM medicine_orders o LEFT JOIN pharmacies ph ON ph.id = o.pharmacy_id
       WHERE o.id = $1`, [req.params.id]);
    if (o.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const items = await pool.query(`SELECT * FROM medicine_order_items WHERE order_id=$1`, [req.params.id]);
    const history = await pool.query(`SELECT * FROM medicine_order_status_history WHERE order_id=$1 ORDER BY id`, [req.params.id]);
    res.json({ order: { ...o.rows[0], items: items.rows, history: history.rows } });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/admin/pharmacies
exports.getPharmacies = async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM pharmacies ORDER BY id DESC`);
    res.json({ pharmacies: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/admin/pharmacies
exports.createPharmacy = async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `INSERT INTO pharmacies(owner_user_id, pharmacy_name, owner_name, phone, email, address, pincode,
         drug_license_number, license_expiry_date, gst_number, is_active, is_online)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [b.owner_user_id || null, b.pharmacy_name, b.owner_name || null, b.phone || null, b.email || null,
       b.address || null, b.pincode || null, b.drug_license_number || null, b.license_expiry_date || null,
       b.gst_number || null, b.is_active ?? true, b.is_online ?? true]);
    res.json({ pharmacy: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PUT /api/admin/pharmacies/:id/approve
exports.approvePharmacy = async (req, res) => {
  try {
    await pool.query(`UPDATE pharmacies SET is_active=true, updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Pharmacy approved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PUT /api/admin/pharmacies/:id/disable
exports.disablePharmacy = async (req, res) => {
  try {
    await pool.query(`UPDATE pharmacies SET is_active=false, is_online=false, updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Pharmacy disabled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/admin/medicine/reports
exports.getMedicineReports = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT
         COUNT(*) AS total_orders,
         COUNT(*) FILTER (WHERE order_status='completed') AS completed_orders,
         COALESCE(SUM(total_medicine_amount) FILTER (WHERE order_status='completed'),0) AS medicine_value,
         COALESCE(SUM(pharmacy_commission_amount) FILTER (WHERE order_status='completed'),0) AS commission_earned,
         COALESCE(SUM(delivery_fee) FILTER (WHERE order_status='completed'),0) AS delivery_fees,
         COALESCE(SUM(platform_fee) FILTER (WHERE order_status='completed'),0) AS platform_fees
       FROM medicine_orders`);
    const x = r.rows[0];
    const earning = Number(x.commission_earned) + Number(x.delivery_fees) + Number(x.platform_fees);
    res.json({ report: { ...x, abhigro_total_earning: Math.round(earning * 100) / 100 } });
  } catch (e) { res.status(500).json({ error: e.message }); }
};