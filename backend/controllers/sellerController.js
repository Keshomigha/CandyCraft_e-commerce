const { findSellerByUserId } = require('../models/userModel');
const { getOrderItemsBySeller, getSellerStats, getMonthlyRevenue, getRecentOrdersBySeller } = require('../models/orderItemModel');
const { getReviewsBySeller } = require('../models/reviewModel');
const { updateOrderStatus } = require('../models/orderModel');
const { OrderItem } = require('../models/sequelize');

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

async function getRevenueChart(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const data = await getMonthlyRevenue(seller.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const [stats, revenueChart, recentOrders] = await Promise.all([
      getSellerStats(seller.id),
      getMonthlyRevenue(seller.id),
      getRecentOrdersBySeller(seller.id, 5),
    ]);

    res.json({ stats, revenueChart, recentOrders });
  } catch (err) {
    next(err);
  }
}

async function changeOrderStatus(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['processing', 'shipped', 'delivered'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    // Verify this order contains items from this seller
    const check = await OrderItem.findOne({ where: { order_id: id, seller_id: seller.id } });
    if (!check) {
      return res.status(404).json({ message: 'Order not found or not associated with your store' });
    }

    const updated = await updateOrderStatus(id, status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, getOrders, getStats, getReviews, getRevenueChart, getDashboard, changeOrderStatus };
