const pool = require('../config/db');
const { getAllUsers, getAllSellers, updateSellerStatus } = require('../models/userModel');
const { getAllProductsAdmin, updateProductStatus } = require('../models/productModel');
const { getAllReviewsAdmin, updateReviewStatus } = require('../models/reviewModel');
const { getAllOrdersAdmin } = require('../models/orderModel');

const VALID_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];
const VALID_REVIEW_STATUSES = ['visible', 'hidden'];

async function listUsers(req, res, next) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function listSellers(req, res, next) {
  try {
    const sellers = await getAllSellers();
    res.json(sellers);
  } catch (err) {
    next(err);
  }
}

async function setSellerStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_APPROVAL_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_APPROVAL_STATUSES.join(', ')}` });
    }

    const seller = await updateSellerStatus(req.params.id, status);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json(seller);
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const products = await getAllProductsAdmin();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function setProductStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_APPROVAL_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_APPROVAL_STATUSES.join(', ')}` });
    }

    const product = await updateProductStatus(req.params.id, status);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function listReviews(req, res, next) {
  try {
    const reviews = await getAllReviewsAdmin();
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

async function setReviewStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_REVIEW_STATUSES.join(', ')}` });
    }

    const review = await updateReviewStatus(req.params.id, status);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const orders = await getAllOrdersAdmin();
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const [users, sellers, products, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM sellers'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'cancelled'`),
    ]);

    res.json({
      totalUsers: Number(users.rows[0].count),
      totalSellers: Number(sellers.rows[0].count),
      totalProducts: Number(products.rows[0].count),
      totalOrders: Number(orders.rows[0].count),
      totalRevenue: Number(revenue.rows[0].total),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  listSellers,
  setSellerStatus,
  listProducts,
  setProductStatus,
  listReviews,
  setReviewStatus,
  listOrders,
  getStats,
};
