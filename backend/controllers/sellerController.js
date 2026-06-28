const { findSellerByUserId } = require('../models/userModel');
const { getOrderItemsBySeller, getSellerStats } = require('../models/orderItemModel');
const { getReviewsBySeller } = require('../models/reviewModel');

async function getProfile(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }
    res.json(seller);
  } catch (err) {
    next(err);
  }
}

async function getOrders(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const items = await getOrderItemsBySeller(seller.id);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const stats = await getSellerStats(seller.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function getReviews(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const reviews = await getReviewsBySeller(seller.id);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, getOrders, getStats, getReviews };
