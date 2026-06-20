const pool = require('../config/db');

async function placeOrder(userId, shippingAddress) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const cartResult = await client.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock, p.seller_id, p.name
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1
       FOR UPDATE OF p`,
      [userId]
    );

    
    const cartItems = cartResult.rows;
    if (cartItems.length === 0) {
      throw Object.assign(new Error('Cart is empty'), { statusCode: 400 });
    }

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        throw Object.assign(
          new Error(`Not enough stock for "${item.name}". Available: ${item.stock}`),
          { statusCode: 400 }
        );
      }
    }
    
    const totalAmount = cartItems.reduce((sum, item) => sum + item.quantity * Number(item.price), 0);

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [userId, totalAmount, shippingAddress]
    );
    const order = orderResult.rows[0];

    for (const item of cartItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_id, item.seller_id, item.quantity, item.price]
      );

      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

        await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getOrdersByUser(userId) {
  const result = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function getOrderById(orderId, userId) {
  const result = await pool.query(
    'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
    [orderId, userId]
  );
  return result.rows[0];
}

async function updateOrderStatus(orderId, status) {
  const result = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, orderId]
  );
  return result.rows[0];
}

async function getAllOrdersAdmin() {
  const result = await pool.query(
    `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
}

module.exports = {
  placeOrder,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  getAllOrdersAdmin,
};
