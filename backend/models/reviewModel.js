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