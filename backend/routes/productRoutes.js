const express = require('express');
const {
  listProducts,
  getProduct,
  addProduct,
  getMyProducts,
  editProduct,
  removeProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', listProducts);
router.get('/mine', protect, restrictTo('seller'), getMyProducts);
router.get('/:id', getProduct);

router.post('/', protect, restrictTo('seller'), upload.single('image'), addProduct);
router.put('/:id', protect, restrictTo('seller'), upload.single('image'), editProduct);
router.delete('/:id', protect, restrictTo('seller'), removeProduct);

module.exports = router;
