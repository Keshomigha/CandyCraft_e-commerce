const { QueryTypes } = require('sequelize');
const { sequelize, Order } = require('../models/sequelize');
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
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const result = await sequelize.transaction(async (t) => {
      const order = await Order.findOne({
        where: { id: orderId, user_id: userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) {
        return { notFound: true };
      }

      if (order.status !== 'pending' && order.status !== 'processing') {
        return { badStatus: order.status };
      }

      await order.update({ status: 'cancelled' }, { transaction: t });

      const items = await sequelize.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        { bind: [orderId], type: QueryTypes.SELECT, transaction: t }
      );
      for (const item of items) {
        await sequelize.query(
          'UPDATE products SET stock = stock + $1 WHERE id = $2',
          { bind: [item.quantity, item.product_id], type: QueryTypes.UPDATE, transaction: t }
        );
      }

      return { ok: true };
    });

    if (result.notFound) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (result.badStatus) {
      return res.status(400).json({ message: `Cannot cancel an order in "${result.badStatus}" status` });
    }

    res.json({ message: 'Order cancelled successfully', orderId });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkout, listMyOrders, getOrderDetails, cancelOrder };
