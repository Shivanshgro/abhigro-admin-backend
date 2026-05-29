const pool = require('../config/db');

exports.createShop = async (req, res) => {
  try {
    const { shop_name, owner_name, phone, address, latitude, longitude } = req.body;

    if (!shop_name || !owner_name || !phone) {
      return res.status(400).json({ error: 'shop_name, owner_name and phone are required' });
    }

    const result = await pool.query(
      `INSERT INTO shops(shop_name, owner_name, phone, address, latitude, longitude, created_by, is_active)
       VALUES($1,$2,$3,$4,$5,$6,$7, true) RETURNING *`,
      [shop_name, owner_name, phone, address, latitude, longitude, req.user.id]
    );
    res.status(201).json({ message: 'Shop created successfully', shop: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getShops = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shops ORDER BY id DESC');
    res.json({ message: 'Shops fetched successfully', shops: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { shop_name, owner_name, phone, address, latitude, longitude, is_active } = req.body;

    const result = await pool.query(
      `UPDATE shops
       SET shop_name=$1, owner_name=$2, phone=$3, address=$4,
           latitude=$5, longitude=$6,
           is_active=COALESCE($7, is_active)
       WHERE id=$8 RETURNING *`,
      [shop_name, owner_name, phone, address, latitude, longitude, is_active, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    res.json({ message: 'Shop updated', shop: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.disableShop = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE shops SET is_active=false WHERE id=$1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    res.json({ message: 'Shop disabled', shop: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enableShop = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE shops SET is_active=true WHERE id=$1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    res.json({ message: 'Shop enabled', shop: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
