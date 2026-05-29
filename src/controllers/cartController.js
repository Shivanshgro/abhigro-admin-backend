const pool = require('../config/db');

exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, product_id, quantity]
    );

    res.status(201).json({
      message: 'Product added to cart successfully',
      cart_item: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT 
        cart_items.id,
        cart_items.quantity,
        products.product_name,
        products.price,
        products.image_url
       FROM cart_items
       JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.user_id = $1
       ORDER BY cart_items.id DESC`,
      [user_id]
    );

    res.json({
      message: 'Cart fetched successfully',
      cart: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM cart_items WHERE id = $1',
      [id]
    );

    res.json({
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};