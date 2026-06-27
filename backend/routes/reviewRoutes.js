const express = require('express');
const { listProductReviews, addReview, listMyReviews, listPendingReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, listMyReviews);
router.get('/pending', protect, listPendingReviews);
router.get('/product/:productId', listProductReviews);
router.post('/', protect, addReview);

module.exports = router;
