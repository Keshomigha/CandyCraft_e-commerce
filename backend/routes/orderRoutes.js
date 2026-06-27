const express = require('express');
const { checkout, listMyOrders, getOrderDetails, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', checkout);
router.get('/', listMyOrders);
router.get('/:id', getOrderDetails);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
