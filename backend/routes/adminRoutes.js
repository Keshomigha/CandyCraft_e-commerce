const express = require('express');
const {
  listUsers,
  setUserStatus,
  removeUser,
  listSellers,
  setSellerStatus,
  listProducts,
  setProductStatus,
  removeProduct,
  listReviews,
  setReviewStatus,
  removeReview,
  listOrders,
  setOrderStatus,
  listReports,
  resolveReport,
  getStats,
  getDashboardOverview,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);
router.get('/dashboard-overview', getDashboardOverview);

router.get('/users', listUsers);
router.patch('/users/:id/status', setUserStatus);
router.delete('/users/:id', removeUser);

router.get('/sellers', listSellers);
router.patch('/sellers/:id/status', setSellerStatus);

router.get('/products', listProducts);
router.patch('/products/:id/status', setProductStatus);
router.delete('/products/:id', removeProduct);

router.get('/reviews', listReviews);
router.patch('/reviews/:id/status', setReviewStatus);
router.delete('/reviews/:id', removeReview);

router.get('/orders', listOrders);
router.patch('/orders/:id/status', setOrderStatus);

router.get('/reports', listReports);
router.patch('/reports/:id/resolve', resolveReport);

module.exports = router;
