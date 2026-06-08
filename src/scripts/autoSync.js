/**
 * autoSync.js — Automated Product Catalog Sync Script (AbhiGro / Zepto-style)
 *
 * Run manually: node src/scripts/autoSync.js
 * Or schedule via cron / node-cron every N minutes
 *
 * What it does:
 *  1. Reads from supplier_catalog table (if it exists) OR any API you configure
 *  2. Syncs price, image_url, stock for every product
 *  3. Auto-marks products "out_of_stock" when stock=0
 *  4. Auto-marks back to "in_stock" when stock is replenished
 *  5. Logs a detailed report
 */

require('dotenv').config();
const pool = require('../config/db');

async function getSupplierCatalog() {
  try {
    const check = await pool.query(
      "SELECT to_regclass('public.supplier_catalog') AS tbl"
    );
    if (!check.rows[0].tbl) {
      console.log('[autoSync] No supplier_catalog table — running stock reconciliation only.');
      return null;
    }
    const r = await pool.query(
      'SELECT product_name,shop_id,price,stock,image_url,category,description FROM supplier_catalog WHERE is_active=true'
    );
    return r.rows;
  } catch { return null; }
}

async function syncCatalog(items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let updated=0, created=0, outOfStockMarked=0, inStockRestored=0;
    for (const p of items) {
      const stock = Number(p.stock)||0;
      const ss = stock<=0 ? 'out_of_stock' : 'in_stock';
      const ex = await client.query(
        'SELECT id,stock_status FROM products WHERE product_name=$1 AND shop_id=$2 LIMIT 1',
        [p.product_name, p.shop_id]
      );
      if (ex.rows.length) {
        const {id, stock_status:prev} = ex.rows[0];
        await client.query(
          `UPDATE products SET price=$1,stock=$2,
           image_url=COALESCE(NULLIF($3,''),image_url),
           description=COALESCE(NULLIF($4,''),description),
           category=COALESCE(NULLIF($5,''),category),
           stock_status=$6,is_active=true,updated_at=NOW() WHERE id=$7`,
          [p.price,stock,p.image_url,p.description,p.category,ss,id]
        );
        updated++;
        if (prev!=='out_of_stock'&&ss==='out_of_stock') outOfStockMarked++;
        if (prev==='out_of_stock'&&ss==='in_stock')     inStockRestored++;
      } else {
        await client.query(
          `INSERT INTO products(shop_id,product_name,description,category,price,stock,image_url,stock_status,is_active,updated_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())`,
          [p.shop_id,p.product_name,p.description,p.category,p.price,stock,p.image_url,ss]
        );
        created++;
      }
    }
    await client.query('COMMIT');
    return {updated,created,outOfStockMarked,inStockRestored};
  } catch(e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}

async function reconcileStock() {
  const oos = await pool.query(
    `UPDATE products SET stock_status='out_of_stock',updated_at=NOW()
     WHERE stock<=0 AND stock_status!='out_of_stock' AND is_active=true RETURNING id,product_name`
  );
  const bis = await pool.query(
    `UPDATE products SET stock_status='in_stock',updated_at=NOW()
     WHERE stock>0 AND stock_status='out_of_stock' AND is_active=true RETURNING id,product_name`
  );
  return {oos:oos.rows, bis:bis.rows};
}

async function run() {
  console.log(`\n[autoSync] Starting @ ${new Date().toISOString()}`);
  try {
    const items = await getSupplierCatalog();
    if (items && items.length) {
      console.log(`[autoSync] ${items.length} items from supplier catalog`);
      const r = await syncCatalog(items);
      console.log(`[autoSync] Created:${r.created} Updated:${r.updated} NewOOS:${r.outOfStockMarked} Restored:${r.inStockRestored}`);
    }
    const {oos,bis} = await reconcileStock();
    if (oos.length) console.log(`[autoSync] Marked OOS (${oos.length}): ${oos.map(p=>p.product_name).join(', ')}`);
    if (bis.length) console.log(`[autoSync] Back in stock (${bis.length}): ${bis.map(p=>p.product_name).join(', ')}`);
    if (!oos.length&&!bis.length) console.log('[autoSync] All stock statuses accurate.');
    console.log(`[autoSync] Done @ ${new Date().toISOString()}\n`);
  } catch(e) {
    console.error('[autoSync] Error:', e.message);
  } finally {
    await pool.end();
  }
}

run();
