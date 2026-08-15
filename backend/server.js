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
const reportRoutes = require('./routes/reportRoutes');
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

    const statusCol = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='users' AND column_name='status'
    `);
    if (statusCol.rows.length === 0) {
      console.log('Adding status column to users table...');
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended'))
      `);
      console.log('Status column added to users table.');
    }

    await pool.query(`ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_status_check`);
    await pool.query(`
      ALTER TABLE sellers ADD CONSTRAINT sellers_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('product', 'user')),
        target_id INTEGER NOT NULL,
        reason VARCHAR(30) NOT NULL CHECK (reason IN ('scam', 'inappropriate', 'spam', 'prohibited', 'other')),
        details TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'actioned')),
        priority BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_warnings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT,
        issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const customizableCol = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='products' AND column_name='customizable'
    `);
    if (customizableCol.rows.length === 0) {
      console.log('Adding custom order columns to products table...');
      await pool.query(`
        ALTER TABLE products
        ADD COLUMN customizable BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN customization_options JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN customization_fee NUMERIC(10, 2) NOT NULL DEFAULT 0
      `);
      console.log('Custom order columns added to products table.');
    }

    const cartCustomizationCol = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='cart_items' AND column_name='customization'
    `);
    if (cartCustomizationCol.rows.length === 0) {
      console.log('Adding customization column to cart_items table...');
      await pool.query(`ALTER TABLE cart_items ADD COLUMN customization JSONB`);
      console.log('Customization column added to cart_items table.');
    }

    const orderItemCustomizationCol = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='order_items' AND column_name='customization'
    `);
    if (orderItemCustomizationCol.rows.length === 0) {
      console.log('Adding customization column to order_items table...');
      await pool.query(`ALTER TABLE order_items ADD COLUMN customization JSONB`);
      console.log('Customization column added to order_items table.');
    }

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
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
