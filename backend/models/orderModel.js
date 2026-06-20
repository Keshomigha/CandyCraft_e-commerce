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