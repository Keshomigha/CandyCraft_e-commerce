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