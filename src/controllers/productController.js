const pool = require('../config/db');

exports.getProducts = async (req, res) => {
  try {
    const { category, shop_id, stock_status, search } = req.query;
    let q = `SELECT * FROM products WHERE 1=1`;
    const params = [];
    if (category)     { params.push(category);      q += ` AND category = $${params.length}`; }
    if (shop_id)      { params.push(shop_id);       q += ` AND shop_id = $${params.length}`; }
    if (stock_status) { params.push(stock_status);  q += ` AND stock_status = $${params.length}`; }
    if (search)       { params.push(`%${search}%`); q += ` AND product_name ILIKE $${params.length}`; }
    q += ` ORDER BY id DESC`;
    const result = await pool.query(q, params);
    res.json({ message: 'Products fetched successfully', total: result.rows.length, products: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { shop_id, product_name, description, category, price, stock, image_url } = req.body;
    const stockNum = Number(stock) || 0;
    const stockStatus = stockNum <= 0 ? 'out_of_stock' : 'in_stock';
    const result = await pool.query(
      `INSERT INTO products (shop_id,product_name,description,category,price,stock,image_url,stock_status,is_active,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW()) RETURNING *`,
      [shop_id, product_name, description, category, price, stockNum, image_url, stockStatus]
    );
    res.status(201).json({ message: 'Product created successfully', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, description, category, price, stock, image_url } = req.body;
    const stockNum = stock !== undefined ? Number(stock) : undefined;
    const stockStatus = stockNum !== undefined ? (stockNum <= 0 ? 'out_of_stock' : 'in_stock') : undefined;
    const result = await pool.query(
      `UPDATE products SET product_name=COALESCE($1,product_name),description=COALESCE($2,description),category=COALESCE($3,category),price=COALESCE($4,price),stock=COALESCE($5,stock),image_url=COALESCE($6,image_url),stock_status=COALESCE($7,stock_status),updated_at=NOW() WHERE id=$8 RETURNING *`,
      [product_name, description, category, price, stockNum, image_url, stockStatus, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated successfully', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE products SET is_active=false,updated_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product disabled successfully', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enableProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE products SET is_active=true,updated_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product enabled successfully', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.runStockCheck = async (req, res) => {
  try {
    const outOfStock = await pool.query(
      `UPDATE products SET stock_status='out_of_stock',updated_at=NOW() WHERE stock<=0 AND stock_status!='out_of_stock' RETURNING id,product_name`
    );
    const backInStock = await pool.query(
      `UPDATE products SET stock_status='in_stock',updated_at=NOW() WHERE stock>0 AND stock_status='out_of_stock' RETURNING id,product_name`
    );
    res.json({ message: 'Stock check completed', marked_out_of_stock: outOfStock.rows, marked_in_stock: backInStock.rows, checked_at: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};