const { QueryTypes } = require('sequelize');
const { sequelize, Review } = require('./sequelize');

async function getReviewsByProduct(productId) {
  return sequelize.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1 AND r.status = 'visible'
     ORDER BY r.created_at DESC`,
    { bind: [productId], type: QueryTypes.SELECT }
  );
}

async function getReviewByUserAndProduct(userId, productId) {
  const review = await Review.findOne({ where: { user_id: userId, product_id: productId } });
  return review ? review.get({ plain: true }) : undefined;
}

async function hasPurchasedProduct(userId, productId) {
  const rows = await sequelize.query(
    `SELECT 1 FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = $1 AND oi.product_id = $2
     LIMIT 1`,
    { bind: [userId, productId], type: QueryTypes.SELECT }
  );
  return rows.length > 0;
}

async function createReview(userId, productId, rating, comment) {
  const review = await Review.create({ product_id: productId, user_id: userId, rating, comment });
  return review.get({ plain: true });
}

async function getReviewsBySeller(sellerId) {
  return sequelize.query(
    `SELECT r.id, r.rating, r.comment, r.status, r.created_at,
            u.name AS user_name, p.id AS product_id, p.name AS product_name
     FROM reviews r
     JOIN products p ON p.id = r.product_id
     JOIN users u ON u.id = r.user_id
     WHERE p.seller_id = $1
     ORDER BY r.created_at DESC`,
    { bind: [sellerId], type: QueryTypes.SELECT }
  );
}

async function getAllReviewsAdmin() {
  return sequelize.query(
    `SELECT r.*, u.name AS user_name, p.name AS product_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     ORDER BY r.created_at DESC`,
    { type: QueryTypes.SELECT }
  );
}

async function updateReviewStatus(id, status) {
  const [, rows] = await Review.update({ status }, { where: { id }, returning: true });
  return rows[0] ? rows[0].get({ plain: true }) : undefined;
}

async function deleteReviewAdmin(id) {
  const review = await Review.findByPk(id);
  if (!review) return undefined;
  const plain = review.get({ plain: true });
  await review.destroy();
  return plain;
}

async function getReviewsByUser(userId) {
  return sequelize.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, p.id AS product_id, p.name AS product_name, p.image_url AS product_image
     FROM reviews r
     JOIN products p ON p.id = r.product_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    { bind: [userId], type: QueryTypes.SELECT }
  );
}

async function getPendingReviewsByUser(userId) {
  return sequelize.query(
    `SELECT DISTINCT p.id AS product_id, p.name AS product_name, p.image_url AS product_image, o.id AS order_id
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = $1 AND o.status IN ('delivered', 'shipped') AND NOT EXISTS (
       SELECT 1 FROM reviews r WHERE r.user_id = $1 AND r.product_id = oi.product_id
     )`,
    { bind: [userId], type: QueryTypes.SELECT }
  );
}

module.exports = {
  getReviewsByProduct,
  getReviewByUserAndProduct,
  hasPurchasedProduct,
  createReview,
  getReviewsBySeller,
  getAllReviewsAdmin,
  updateReviewStatus,
  deleteReviewAdmin,
  getReviewsByUser,
  getPendingReviewsByUser,
};
