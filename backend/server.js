const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const { getApprovedSellers } = require('./models/userModel');

// Run self-healing schema updates on server start
(async () => {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='phone'
    `);
    if (res.rows.length === 0) {
      console.log('Adding profile columns to users table...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN phone VARCHAR(20),
        ADD COLUMN address TEXT,
        ADD COLUMN city VARCHAR(100),
        ADD COLUMN postal_code VARCHAR(20)
      `);
      console.log('Profile columns added successfully.');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);
    console.log('Database tables verified successfully.');
  } catch (err) {
    console.error('Error verifying database schema on startup:', err);
  }
})();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-check', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0].now });
  } catch (err) {
    next(err);
  }
});

app.get('/api/sellers', async (req, res, next) => {
  try {
    const sellers = await getApprovedSellers();
    res.json(sellers);
  } catch (err) {
    next(err);
  }
});

app.get('/api/categories', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category FROM products WHERE status = 'approved' AND category IS NOT NULL ORDER BY category`
    );
    res.json(result.rows.map((r) => r.category));
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
