const {
  getCartByUser,
  addOrUpdateCartItem,
  setCartItemQuantity,
  removeCartItem,
  clearCart,
} = require('../models/cartModel');
const { getProductById } = require('../models/productModel');

async function viewCart(req, res, next) {
  try {
    const items = await getCartByUser(req.user.id);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'productId and a positive quantity are required' });
    }

    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const item = await addOrUpdateCartItem(req.user.id, productId, quantity);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'A positive quantity is required' });
    }

    const item = await setCartItemQuantity(req.user.id, req.params.productId, quantity);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const item = await removeCartItem(req.user.id, req.params.productId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
}

async function emptyCart(req, res, next) {
  try {
    await clearCart(req.user.id);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
}

module.exports = { viewCart, addItem, updateItem, removeItem, emptyCart };
