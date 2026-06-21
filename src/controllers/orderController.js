const pool = require('../config/db');

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.user.id;
    await client.query('BEGIN');

    const cartResult = await client.query(
      `SELECT cart.product_id, cart.quantity, products.price
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = $1`,
      [user_id]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    cartResult.rows.forEach(item => { totalAmount += Number(item.price) * item.quantity; });

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status)
       VALUES ($1, $2, 'confirmed') RETURNING *`,
      [user_id, totalAmount]
    );
    const order = orderResult.rows[0];

    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items(order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.price]
      );
    }

    // Delete cart_items first (child), then cart rows if any
    await client.query('DELETE FROM cart WHERE user_id = $1', [user_id]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Admin backend is admin-only → always return ALL orders (richer fields, with fallback)
exports.getOrders = async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        `SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
                a.address_line AS delivery_address, s.shop_name AS assigned_shop
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN addresses a ON a.id = o.address_id
         LEFT JOIN shops s ON s.id = o.assigned_shop_id
         ORDER BY o.id DESC LIMIT 300`
      );
    } catch (joinErr) {
      // fallback if optional columns/tables differ in this DB
      result = await pool.query(
        `SELECT o.*, u.name AS customer_name, u.email AS customer_email
         FROM orders o LEFT JOIN users u ON u.id = o.user_id
         ORDER BY o.id DESC LIMIT 300`
      );
    }
    res.json({ message: 'Orders fetched successfully', orders: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated', order: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};