const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'grocery_app',
});

pool.connect((err, client, release) => {
  if (err) {
    console.log('DATABASE CONNECTION ERROR:', err.message);
    console.log('DB CONFIG:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
    });
  } else {
    console.log('PostgreSQL Connected to', process.env.DB_NAME);
    release();
  }
});

module.exports = pool;
