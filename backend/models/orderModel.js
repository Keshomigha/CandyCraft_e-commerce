const { QueryTypes } = require('sequelize');
const { sequelize, Order } = require('./sequelize');

// Stock-reservation checkout needs a transaction with a row lock scoped to
// just the products being bought (`FOR UPDATE OF p`) while joined against
// the buyer's cart — Sequelize's ORM-level locking (`lock: true` on a
// find) locks whatever it queries directly and doesn't cleanly express
// "lock only this joined table," so the statements stay raw SQL run inside
// a real Sequelize transaction (`sequelize.transaction()`), which still
// gives proper BEGIN/COMMIT/ROLLBACK semantics through the ORM.
async function placeOrder(userId, shippingAddress) {
  return sequelize.transaction(async (t) => {
    const cartItems = await sequelize.query(
      `SELECT c.product_id, c.quantity, c.customization, p.price, p.stock, p.seller_id, p.name
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1
       FOR UPDATE OF p`,
      { bind: [userId], type: QueryTypes.SELECT, transaction: t }
    );

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

    const totalAmount = cartItems.reduce((sum, item) => {
      const fee = item.customization?.fee ? Number(item.customization.fee) : 0;
      return sum + item.quantity * Number(item.price) + fee;
    }, 0);

    const order = await Order.create(
      { user_id: userId, total_amount: totalAmount, shipping_address: shippingAddress, status: 'pending' },
      { transaction: t }
    );

    for (const item of cartItems) {
      await sequelize.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, quantity, price, customization)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        {
          bind: [
            order.id, item.product_id, item.seller_id, item.quantity, item.price,
            item.customization ? JSON.stringify(item.customization) : null,
          ],
          type: QueryTypes.INSERT,
          transaction: t,
        }
      );

      await sequelize.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        { bind: [item.quantity, item.product_id], type: QueryTypes.UPDATE, transaction: t }
      );
    }

    await sequelize.query('DELETE FROM cart_items WHERE user_id = $1', {
      bind: [userId], type: QueryTypes.DELETE, transaction: t,
    });

    return order.get({ plain: true });
  });
}

async function getOrdersByUser(userId) {
  const orders = await Order.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']] });
  return orders.map((o) => o.get({ plain: true }));
}

async function getOrderById(orderId, userId) {
  const order = await Order.findOne({ where: { id: orderId, user_id: userId } });
  return order ? order.get({ plain: true }) : undefined;
}

async function updateOrderStatus(orderId, status) {
  const [, rows] = await Order.update({ status }, { where: { id: orderId }, returning: true });
  return rows[0] ? rows[0].get({ plain: true }) : undefined;
}

// Flattens the buyer's name/email alongside the order — see productModel.js
// for why joined lookups consumed as flat JSON stay raw.
async function getAllOrdersAdmin() {
  return sequelize.query(
    `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`,
    { type: QueryTypes.SELECT }
  );
}

module.exports = {
  placeOrder,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  getAllOrdersAdmin,
};
