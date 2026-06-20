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