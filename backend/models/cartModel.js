const pool = require('../config/db');

async function getCartByUser(userId) {
  const result = await pool.query(
    `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url, p.stock
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function addOrUpdateCartItem(userId, productId, quantity) {
  const result = await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
     RETURNING *`,
    [userId, productId, quantity]
  );
  return result.rows[0];
}

async function setCartItemQuantity(userId, productId, quantity) {
  const result = await pool.query(
    `UPDATE cart_items SET quantity = $3
     WHERE user_id = $1 AND product_id = $2
     RETURNING *`,
    [userId, productId, quantity]
  );
  return result.rows[0];
}

async function removeCartItem(userId, productId) {
  const result = await pool.query(
    'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 RETURNING *',
    [userId, productId]
  );
  return result.rows[0];
}

async function clearCart(userId) {
  await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
}

module.exports = {
  getCartByUser,
  addOrUpdateCartItem,
  setCartItemQuantity,
  removeCartItem,
  clearCart,
};