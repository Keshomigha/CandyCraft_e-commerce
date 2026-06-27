const express = require('express');
const { viewCart, addItem, updateItem, removeItem, emptyCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', viewCart);
router.post('/', addItem);
router.put('/:productId', updateItem);
router.delete('/:productId', removeItem);
router.delete('/', emptyCart);

module.exports = router;
