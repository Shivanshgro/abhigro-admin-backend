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
    const result = await pool.query(`UPDATE products SET is_active=false,updated_at=NOW() WHERE id=$1 RETURNING *`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product disabled successfully', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enableProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`UPDATE products SET is_active=true,updated_at=NOW() WHERE id=$1 RETURNING *`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product enabled successfully', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.runStockCheck = async (req, res) => {
  try {
    const outOfStock = await pool.query(`UPDATE products SET stock_status='out_of_stock',updated_at=NOW() WHERE stock<=0 AND stock_status!='out_of_stock' RETURNING id,product_name`);
    const backInStock = await pool.query(`UPDATE products SET stock_status='in_stock',updated_at=NOW() WHERE stock>0 AND stock_status='out_of_stock' RETURNING id,product_name`);
    res.json({ message: 'Stock check completed', marked_out_of_stock: outOfStock.rows, marked_in_stock: backInStock.rows, checked_at: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.syncProducts = async (req, res) => {
  const client = await pool.connect();
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ error: 'products array is required' });
    await client.query('BEGIN');
    const results = { updated: 0, created: 0, errors: [] };
    for (const p of products) {
      try {
        const stock = Number(p.stock) || 0;
        const stockStatus = stock <= 0 ? 'out_of_stock' : 'in_stock';
        const existing = await client.query(`SELECT id FROM products WHERE product_name=$1 AND shop_id=$2 LIMIT 1`, [p.product_name, p.shop_id]);
        if (existing.rows.length > 0) {
          await client.query(`UPDATE products SET price=$1,stock=$2,stock_status=$3,updated_at=NOW() WHERE id=$4`, [p.price, stock, stockStatus, existing.rows[0].id]);
          results.updated++;
        } else {
          await client.query(`INSERT INTO products(shop_id,product_name,description,category,price,stock,image_url,stock_status,is_active,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())`, [p.shop_id, p.product_name, p.description, p.category, p.price, stock, p.image_url, stockStatus]);
          results.created++;
        }
      } catch (e) { results.errors.push({ product: p.product_name, error: e.message }); }
    }
    await client.query('COMMIT');
    res.json({ message: 'Sync completed', summary: results });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally { client.release(); }
};
