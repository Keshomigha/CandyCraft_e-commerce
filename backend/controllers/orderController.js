const pool = require('../config/db');
const { placeOrder, getOrdersByUser, getOrderById } = require('../models/orderModel');
const { getItemsByOrder } = require('../models/orderItemModel');

async function checkout(req, res, next) {
  try {
    const { shippingAddress } = req.body;
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    const order = await placeOrder(req.user.id, shippingAddress);
    const items = await getItemsByOrder(order.id);

    res.status(201).json({ ...order, items });
  } catch (err) {
    next(err);
  }
}

async function listMyOrders(req, res, next) {
  try {
    const orders = await getOrdersByUser(req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function getOrderDetails(req, res, next) {
  try {
    const order = await getOrderById(req.params.id, req.user.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const items = await getItemsByOrder(order.id);
    res.json({ ...order, items });
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  const client = await pool.connect();
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    await client.query('BEGIN');

    const orderRes = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [orderId, userId]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderRes.rows[0];
    if (order.status !== 'pending' && order.status !== 'processing') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Cannot cancel an order in "${order.status}" status` });
    }

    await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [orderId]);

    const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
    for (const item of itemsRes.rows) {
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Order cancelled successfully', orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { checkout, listMyOrders, getOrderDetails, cancelOrder };
