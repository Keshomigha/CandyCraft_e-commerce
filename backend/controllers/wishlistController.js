const pool = require('../config/db');

async function getWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT w.id AS wishlist_id, w.created_at, 
              p.id, p.name, p.description, p.price, p.stock, p.category, p.image_url
       FROM wishlist_items w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
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

    // Verify product exists
    const prodCheck = await pool.query('SELECT 1 FROM products WHERE id = $1', [productId]);
    if (prodCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Add to wishlist (using ON CONFLICT DO NOTHING to avoid duplicate errors)
    const result = await pool.query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`,
      [userId, productId]
    );

    res.status(201).json({ message: 'Product added to wishlist', item: result.rows[0] || null });
  } catch (err) {
    next(err);
  }
}

async function removeFromWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await pool.query(
      'DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product was not in your wishlist' });
    }

    res.json({ message: 'Product removed from wishlist' });
  } catch (err) {
    next(err);
  }
}

async function checkWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await pool.query(
      'SELECT 1 FROM wishlist_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    res.json({ wishlisted: result.rows.length > 0 });
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
