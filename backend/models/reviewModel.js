const pool = require('../config/db');

async function getReviewsByProduct(productId) {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1 AND r.status = 'visible'
     ORDER BY r.created_at DESC`,
    [productId]
  );
  return result.rows;
}

async function getReviewByUserAndProduct(userId, productId) {
  const result = await pool.query(
    'SELECT * FROM reviews WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  return result.rows[0];
}

async function hasPurchasedProduct(userId, productId) {
  const result = await pool.query(
    `SELECT 1 FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = $1 AND oi.product_id = $2
     LIMIT 1`,
    [userId, productId]
  );
  return result.rows.length > 0;
}

async function createReview(userId, productId, rating, comment) {
  const result = await pool.query(
    `INSERT INTO reviews (product_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [productId, userId, rating, comment]
  );
  return result.rows[0];
}

async function getReviewsBySeller(sellerId) {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.status, r.created_at,
            u.name AS user_name, p.id AS product_id, p.name AS product_name
     FROM reviews r
     JOIN products p ON p.id = r.product_id
     JOIN users u ON u.id = r.user_id
     WHERE p.seller_id = $1
     ORDER BY r.created_at DESC`,
    [sellerId]
  );
  return result.rows;
}

async function getAllReviewsAdmin() {
  const result = await pool.query(
    `SELECT r.*, u.name AS user_name, p.name AS product_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     ORDER BY r.created_at DESC`
  );
  return result.rows;
}

async function updateReviewStatus(id, status) {
  const result = await pool.query(
    'UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

async function getReviewsByUser(userId) {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, p.id AS product_id, p.name AS product_name, p.image_url AS product_image
     FROM reviews r
     JOIN products p ON p.id = r.product_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getPendingReviewsByUser(userId) {
  const result = await pool.query(
    `SELECT DISTINCT p.id AS product_id, p.name AS product_name, p.image_url AS product_image, o.id AS order_id
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = $1 AND o.status IN ('delivered', 'shipped') AND NOT EXISTS (
       SELECT 1 FROM reviews r WHERE r.user_id = $1 AND r.product_id = oi.product_id
     )`,
     [userId]
  );
  return result.rows;
}

module.exports = {
  getReviewsByProduct,
  getReviewByUserAndProduct,
  hasPurchasedProduct,
  createReview,
  getReviewsBySeller,
  getAllReviewsAdmin,
  updateReviewStatus,
  getReviewsByUser,
  getPendingReviewsByUser,
};
