const pool = require('../config/db');

// Resolve a category (name or id) → category_id. Creates category if missing.
async function resolveCategoryId(category) {
  if (category === undefined || category === null || category === '') return null;
  if (!isNaN(category)) return Number(category);
  const found = await pool.query(`SELECT id FROM categories WHERE LOWER(name)=LOWER($1)`, [category]);
  if (found.rows.length > 0) return found.rows[0].id;
  const created = await pool.query(`INSERT INTO categories(name) VALUES($1) RETURNING id`, [category]);
  return created.rows[0].id;
}

// GET — returns products from the shared 'grocery' DB.
// Aliases customer columns → admin field names so the admin UI still works.
exports.getProducts = async (req, res) => {
  try {
    const { category, stock_status, search } = req.query;
    let q = `
      SELECT p.*,
             p.name  AS product_name,
             p.image AS image_url,
             c.name  AS category,
             CASE WHEN p.is_active = false OR p.stock <= 0 THEN 'out_of_stock' ELSE 'in_stock' END AS stock_status
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE 1=1`;
    const params = [];
    if (category)     { params.push(category);      q += ` AND c.name = $${params.length}`; }
    if (search)       { params.push(`%${search}%`); q += ` AND p.name ILIKE $${params.length}`; }
    q += ` ORDER BY p.id DESC`;
    let result = await pool.query(q, params);
    let rows = result.rows;
    if (stock_status) rows = rows.filter(r => r.stock_status === stock_status);
    res.json({ message: 'Products fetched successfully', total: rows.length, products: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE — accepts admin field names, writes to customer columns
exports.createProduct = async (req, res) => {
  try {
    const name  = req.body.name || req.body.product_name;
    const image = req.body.image || req.body.image_url || '';
    const { description, price, stock, mrp, unit } = req.body;
    const category = req.body.category || req.body.category_id;
    if (!name || !price) return res.status(400).json({ error: 'name and price are required' });

    const stockNum = Number(stock) || 0;
    const isActive = stockNum > 0;
    const category_id = await resolveCategoryId(category);

    const result = await pool.query(
      `INSERT INTO products (name, description, price, mrp, unit, stock, image, category_id, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, description || '', price, mrp || price, unit || '', stockNum, image, category_id, isActive]
    );
    res.status(201).json({ message: 'Product created successfully', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const name  = req.body.name || req.body.product_name;
    const image = req.body.image || req.body.image_url;
    const { description, price, stock, mrp, unit } = req.body;
    const category = req.body.category || req.body.category_id;

    const stockNum = stock !== undefined ? Number(stock) : undefined;
    const isActive = stockNum !== undefined ? stockNum > 0 : undefined;
    const category_id = (category !== undefined && category !== '') ? await resolveCategoryId(category) : null;

    const result = await pool.query(
      `UPDATE products SET
        name        = COALESCE($1, name),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        price       = COALESCE($4, price),
        stock       = COALESCE($5, stock),
        image       = COALESCE($6, image),
        mrp         = COALESCE($7, mrp),
        unit        = COALESCE($8, unit),
        is_active   = COALESCE($9, is_active),
        updated_at  = NOW()
       WHERE id = $10 RETURNING *`,
      [name, description, category_id, price, stockNum, image, mrp, unit, isActive, id]
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

// Stock check — uses is_active as the in/out flag
exports.runStockCheck = async (req, res) => {
  try {
    const outOfStock = await pool.query(`UPDATE products SET is_active=false,updated_at=NOW() WHERE stock<=0 AND is_active=true RETURNING id,name`);
    const backInStock = await pool.query(`UPDATE products SET is_active=true,updated_at=NOW() WHERE stock>0 AND is_active=false RETURNING id,name`);
    res.json({ message: 'Stock check completed', marked_out_of_stock: outOfStock.rows, marked_in_stock: backInStock.rows, checked_at: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk sync (supplier feed)
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
        const name = p.name || p.product_name;
        const image = p.image || p.image_url || '';
        const stock = Number(p.stock) || 0;
        const isActive = stock > 0;
        const category_id = await resolveCategoryId(p.category || p.category_id);
        const existing = await client.query(`SELECT id FROM products WHERE LOWER(name)=LOWER($1) LIMIT 1`, [name]);
        if (existing.rows.length > 0) {
          await client.query(
            `UPDATE products SET price=$1, stock=$2, is_active=$3, image=COALESCE(NULLIF($4,''),image), updated_at=NOW() WHERE id=$5`,
            [p.price, stock, isActive, image, existing.rows[0].id]);
          results.updated++;
        } else {
          await client.query(
            `INSERT INTO products(name,description,price,mrp,stock,image,category_id,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
            [name, p.description || '', p.price, p.mrp || p.price, stock, image, category_id, isActive]);
          results.created++;
        }
      } catch (e) { results.errors.push({ product: p.name || p.product_name, error: e.message }); }
    }
    await client.query('COMMIT');
    res.json({ message: 'Sync completed', summary: results });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally { client.release(); }
};
