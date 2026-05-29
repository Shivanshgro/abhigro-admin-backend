const pool = require('../config/db');

exports.createPayment = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { order_id, amount, payment_method, transaction_id } = req.body;

    const result = await pool.query(
      `INSERT INTO payments
      (order_id, user_id, amount, payment_status, payment_method, transaction_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [order_id, user_id, amount, 'success', payment_method, transaction_id]
    );

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT * FROM payments
       WHERE user_id = $1
       ORDER BY id DESC`,
      [user_id]
    );

    res.json({
      message: 'Payments fetched successfully',
      payments: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};