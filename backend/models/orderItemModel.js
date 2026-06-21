const pool = require('../config/db');

async function getItemsByOrder(orderId) {
  const result = await pool.query(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return result.rows;
}

async function getOrderItemsBySeller(sellerId) {
  const result = await pool.query(
    `SELECT oi.*, o.user_id, o.status AS order_status, o.created_at AS order_date, p.name
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE oi.seller_id = $1
     ORDER BY o.created_at DESC`,
    [sellerId]
  );
  return result.rows;
}

async function getSellerStats(sellerId) {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(oi.quantity * oi.price), 0) AS total_revenue,
       COALESCE(SUM(oi.quantity), 0) AS total_items_sold,
       COUNT(DISTINCT oi.order_id) AS total_orders
     FROM order_items oi
     WHERE oi.seller_id = $1`,
    [sellerId]
  );

  const row = result.rows[0];
  return {
    totalRevenue: Number(row.total_revenue),
    totalItemsSold: Number(row.total_items_sold),
    totalOrders: Number(row.total_orders),
  };
}

module.exports = { getItemsByOrder, getOrderItemsBySeller, getSellerStats };
