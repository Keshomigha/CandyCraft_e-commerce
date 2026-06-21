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