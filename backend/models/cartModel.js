const { QueryTypes } = require('sequelize');
const { sequelize, CartItem } = require('./sequelize');

// Flattens the joined product's name/price/image/stock alongside the cart
// row — kept raw for the same flattening reason as the product/seller joins
// elsewhere (see productModel.js).
async function getCartByUser(userId) {
  return sequelize.query(
    `SELECT c.id, c.product_id, c.quantity, c.customization, p.name, p.price, p.image_url, p.stock
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC`,
    { bind: [userId], type: QueryTypes.SELECT }
  );
}

// The "add quantity to whatever's already there" upsert (with a COALESCE
// fallback on customization) needs Postgres's ON CONFLICT ... DO UPDATE
// with access to both the existing and incoming row (EXCLUDED) — Sequelize's
// upsert() always just overwrites, so this one stays a raw query.
async function addOrUpdateCartItem(userId, productId, quantity, customization = null) {
  const rows = await sequelize.query(
    `INSERT INTO cart_items (user_id, product_id, quantity, customization)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                   customization = COALESCE(EXCLUDED.customization, cart_items.customization)
     RETURNING *`,
    {
      bind: [userId, productId, quantity, customization ? JSON.stringify(customization) : null],
      type: QueryTypes.INSERT,
    }
  );
  return rows[0][0];
}

async function setCartItemQuantity(userId, productId, quantity) {
  const [, rows] = await CartItem.update(
    { quantity },
    { where: { user_id: userId, product_id: productId }, returning: true }
  );
  return rows[0] ? rows[0].get({ plain: true }) : undefined;
}

async function removeCartItem(userId, productId) {
  const item = await CartItem.findOne({ where: { user_id: userId, product_id: productId } });
  if (!item) return undefined;
  const plain = item.get({ plain: true });
  await item.destroy();
  return plain;
}

async function clearCart(userId) {
  await CartItem.destroy({ where: { user_id: userId } });
}

module.exports = {
  getCartByUser,
  addOrUpdateCartItem,
  setCartItemQuantity,
  removeCartItem,
  clearCart,
};
