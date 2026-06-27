const {
  getReviewsByProduct,
  getReviewByUserAndProduct,
  hasPurchasedProduct,
  createReview,
  getReviewsByUser,
  getPendingReviewsByUser,
} = require('../models/reviewModel');
const { getProductById } = require('../models/productModel');

async function listProductReviews(req, res, next) {
  try {
    const reviews = await getReviewsByProduct(req.params.productId);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

async function addReview(req, res, next) {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'productId and rating (1-5) are required' });
    }

    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const purchased = await hasPurchasedProduct(req.user.id, productId);
    if (!purchased) {
      return res.status(403).json({ message: 'You can only review products you have purchased' });
    }

    const existing = await getReviewByUserAndProduct(req.user.id, productId);
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this product' });
    }

    const review = await createReview(req.user.id, productId, rating, comment);
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

async function listMyReviews(req, res, next) {
  try {
    const reviews = await getReviewsByUser(req.user.id);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

async function listPendingReviews(req, res, next) {
  try {
    const pending = await getPendingReviewsByUser(req.user.id);
    res.json(pending);
  } catch (err) {
    next(err);
  }
}

module.exports = { listProductReviews, addReview, listMyReviews, listPendingReviews };
