const express = require('express');
const {
  getProfile,
  getOrders,
  getStats,
  getReviews,
  getRevenueChart,
  getDashboard,
  changeOrderStatus,
} = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('seller'));

router.get('/profile', getProfile);
router.get('/dashboard', getDashboard);
router.get('/orders', getOrders);
router.get('/stats', getStats);
router.get('/reviews', getReviews);
router.get('/revenue-chart', getRevenueChart);
router.put('/orders/:id/status', changeOrderStatus);

module.exports = router;
