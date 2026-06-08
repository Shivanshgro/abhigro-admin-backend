-- Migration: Add stock_status and updated_at to products table
-- Run once: psql -U postgres -d grocery_app -f src/scripts/migrate_products.sql

-- 1. Add stock_status column
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'in_stock';

-- 2. Add updated_at column
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 3. Backfill stock_status based on existing stock values
UPDATE products
SET stock_status = CASE
  WHEN stock <= 0 THEN 'out_of_stock'
  ELSE 'in_stock'
END;

-- 4. Add index for fast stock_status filtering
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);

-- 5. Optional: supplier_catalog table (used by autoSync.js)
CREATE TABLE IF NOT EXISTS supplier_catalog (
  id           SERIAL PRIMARY KEY,
  shop_id      INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description  TEXT,
  category     VARCHAR(100),
  price        NUMERIC(10,2) NOT NULL,
  stock        INT DEFAULT 0,
  image_url    TEXT,
  is_active    BOOLEAN DEFAULT true,
  updated_at   TIMESTAMP DEFAULT NOW()
);

SELECT 'Migration complete!' AS status;
