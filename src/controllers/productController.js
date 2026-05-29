const pool = require('../config/db');

exports.createProduct = async (req, res) => {
  try {
    const {
      shop_id,
      product_name,
      description,
      category,
      price,
      stock,
      image_url
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products
      (shop_id, product_name, description, category, price, stock, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [shop_id, product_name, description, category, price, stock, image_url]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM products
      WHERE is_active = true
      ORDER BY id DESC
    `);

    res.json({
      message: 'Products fetched successfully',
      products: result.rows
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE products
       SET is_active = false
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message: 'Product disabled successfully',
      product: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      product_name,
      description,
      category,
      price,
      stock,
      image_url
    } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET product_name = $1,
           description = $2,
           category = $3,
           price = $4,
           stock = $5,
           image_url = $6
       WHERE id = $7
       RETURNING *`,
      [product_name, description, category, price, stock, image_url, id]
    );

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};