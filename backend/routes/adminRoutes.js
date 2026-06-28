const express = require('express');
const {
  listUsers,
  listSellers,
  setSellerStatus,
  listProducts,
  setProductStatus,
  listReviews,
  setReviewStatus,
  listOrders,
  getStats,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);

router.get('/users', listUsers);

router.get('/sellers', listSellers);
router.patch('/sellers/:id/status', setSellerStatus);

router.get('/products', listProducts);
router.patch('/products/:id/status', setProductStatus);

router.get('/reviews', listReviews);
router.patch('/reviews/:id/status', setReviewStatus);

router.get('/orders', listOrders);

module.exports = router;
