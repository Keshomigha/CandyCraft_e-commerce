const { QueryTypes } = require('sequelize');
const { sequelize, Product, WishlistItem } = require('../models/sequelize');

async function getWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    // Flattens the joined product columns onto each wishlist row — see
    // productModel.js for why joined reads stay raw.
    const rows = await sequelize.query(
      `SELECT w.id AS wishlist_id, w.created_at,
              p.id, p.name, p.description, p.price, p.stock, p.category, p.image_url
       FROM wishlist_items w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      { bind: [userId], type: QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function addToWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // ON CONFLICT DO NOTHING has no direct Sequelize model-method
    // equivalent that also returns null (vs. the existing row) on a
    // conflict, so this single insert stays raw to preserve that exact
    // "item: null when already wishlisted" response shape.
    const rows = await sequelize.query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`,
      { bind: [userId, productId], type: QueryTypes.INSERT }
    );

    res.status(201).json({ message: 'Product added to wishlist', item: rows[0][0] || null });
  } catch (err) {
    next(err);
  }
}

async function removeFromWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const item = await WishlistItem.findOne({ where: { user_id: userId, product_id: productId } });
    if (!item) {
      return res.status(404).json({ message: 'Product was not in your wishlist' });
    }
    await item.destroy();

    res.json({ message: 'Product removed from wishlist' });
  } catch (err) {
    next(err);
  }
}

async function checkWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const count = await WishlistItem.count({ where: { user_id: userId, product_id: productId } });
    res.json({ wishlisted: count > 0 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
};
