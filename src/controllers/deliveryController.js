const pool = require('../config/db');

exports.createDelivery = async (req, res) => {
  try {
    const {
      order_id,
      delivery_partner,
      rider_name,
      rider_phone,
      estimated_time
    } = req.body;

    const result = await pool.query(
      `INSERT INTO deliveries
      (order_id, delivery_partner, rider_name, rider_phone, estimated_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [order_id, delivery_partner, rider_name, rider_phone, estimated_time]
    );

    res.status(201).json({
      message: 'Delivery assigned successfully',
      delivery: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDeliveries = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM deliveries ORDER BY id DESC'
    );

    res.json({
      message: 'Deliveries fetched successfully',
      deliveries: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_status } = req.body;

    const result = await pool.query(
      `UPDATE deliveries
       SET delivery_status = $1
       WHERE id = $2
       RETURNING *`,
      [delivery_status, id]
    );

    res.json({
      message: 'Delivery status updated successfully',
      delivery: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};