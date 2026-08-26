const { QueryTypes } = require('sequelize');
const { sequelize } = require('./sequelize');

// Every function here is a multi-table join or aggregate whose flattened
// column shape (name, image_url, buyer_name, avg_rating, …) is consumed
// directly by the frontend — see productModel.js for why those stay raw
// `sequelize.query` calls rather than ORM `include`/`group` builders.

async function getItemsByOrder(orderId) {
  return sequelize.query(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    { bind: [orderId], type: QueryTypes.SELECT }
  );
}

async function getOrderItemsBySeller(sellerId) {
  return sequelize.query(
    `SELECT oi.*, o.user_id, o.status AS order_status, o.created_at AS order_date, p.name
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE oi.seller_id = $1
     ORDER BY o.created_at DESC`,
    { bind: [sellerId], type: QueryTypes.SELECT }
  );
}

async function getSellerStats(sellerId) {
  const [revenueRows, productRows, ratingRows] = await Promise.all([
    sequelize.query(
      `SELECT
         COALESCE(SUM(oi.quantity * oi.price), 0) AS total_revenue,
         COALESCE(SUM(oi.quantity), 0) AS total_items_sold,
         COUNT(DISTINCT oi.order_id) AS total_orders
       FROM order_items oi
       WHERE oi.seller_id = $1`,
      { bind: [sellerId], type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COUNT(*) AS product_count FROM products WHERE seller_id = $1`,
      { bind: [sellerId], type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COALESCE(AVG(r.rating), 0) AS avg_rating, COUNT(r.id) AS review_count
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       WHERE p.seller_id = $1 AND r.status = 'visible'`,
      { bind: [sellerId], type: QueryTypes.SELECT }
    ),
  ]);

  const rev = revenueRows[0];
  const prod = productRows[0];
  const rat = ratingRows[0];

  return {
    totalRevenue: Number(rev.total_revenue),
    totalItemsSold: Number(rev.total_items_sold),
    totalOrders: Number(rev.total_orders),
    totalProducts: Number(prod.product_count),
    avgRating: Math.round(Number(rat.avg_rating) * 10) / 10,
    reviewCount: Number(rat.review_count),
  };
}

async function getMonthlyRevenue(sellerId) {
  const rows = await sequelize.query(
    `SELECT
       TO_CHAR(o.created_at, 'Mon') AS month,
       EXTRACT(MONTH FROM o.created_at) AS month_num,
       EXTRACT(YEAR FROM o.created_at) AS year,
       COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = $1
       AND o.created_at >= NOW() - INTERVAL '6 months'
       AND o.status != 'cancelled'
     GROUP BY TO_CHAR(o.created_at, 'Mon'), EXTRACT(MONTH FROM o.created_at), EXTRACT(YEAR FROM o.created_at)
     ORDER BY year, month_num`,
    { bind: [sellerId], type: QueryTypes.SELECT }
  );
  return rows.map((r) => ({ month: r.month, revenue: Number(r.revenue) }));
}

async function getRecentOrdersBySeller(sellerId, limit = 5) {
  return sequelize.query(
    `SELECT oi.id AS item_id, oi.order_id, oi.quantity, oi.price,
            o.status, o.created_at AS order_date,
            p.name AS product_name, p.image_url,
            u.name AS buyer_name
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     JOIN users u ON u.id = o.user_id
     WHERE oi.seller_id = $1
     ORDER BY o.created_at DESC
     LIMIT $2`,
    { bind: [sellerId, limit], type: QueryTypes.SELECT }
  );
}

module.exports = {
  getItemsByOrder,
  getOrderItemsBySeller,
  getSellerStats,
  getMonthlyRevenue,
  getRecentOrdersBySeller,
};
