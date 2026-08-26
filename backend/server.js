const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { QueryTypes } = require('sequelize');
const sequelize = require('./config/db');
const { syncDatabase } = require('./models/sequelize');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const { getApprovedSellers } = require('./models/userModel');

// Connect and make sure every table the Sequelize models declare actually
// exists — this replaces the old hand-rolled "check a column, ALTER TABLE
// if missing" IIFE. sequelize.sync() only creates tables that don't exist
// yet; it never alters an existing table's columns, so it's safe to run
// against a database (like this project's dev DB) that already has data.
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database via Sequelize');
    await syncDatabase();
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
    const [{ now }] = await sequelize.query('SELECT NOW()', { type: QueryTypes.SELECT });
    res.json({ time: now });
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
    const rows = await sequelize.query(
      `SELECT DISTINCT category FROM products WHERE status = 'approved' AND category IS NOT NULL ORDER BY category`,
      { type: QueryTypes.SELECT }
    );
    res.json(rows.map((r) => r.category));
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
app.use('/api/uploads', uploadRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
