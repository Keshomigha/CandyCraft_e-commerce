const {
  createProduct,
  getProducts,
  getProductById,
  getProductsBySeller,
  updateProduct,
  deleteProduct,
} = require('../models/productModel');
const { findSellerByUserId } = require('../models/userModel');

async function listProducts(req, res, next) {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { rows: products, total } = await getProducts({ category, search, limit: Number(limit), offset });
    res.json({ products, total });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function addProduct(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(403).json({ message: 'Seller profile not found' });
    }

    const { name, description, price, stock, category } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await createProduct(seller.id, {
      name,
      description,
      price,
      stock: stock || 0,
      category,
      imageUrl,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function getMyProducts(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(403).json({ message: 'Seller profile not found' });
    }

    const products = await getProductsBySeller(seller.id);
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function editProduct(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(403).json({ message: 'Seller profile not found' });
    }

    const fields = { ...req.body };
    if (req.file) {
      fields.image_url = `/uploads/${req.file.filename}`;
    }

    const product = await updateProduct(req.params.id, seller.id, fields);
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not owned by you' });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function removeProduct(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(403).json({ message: 'Seller profile not found' });
    }

    const product = await deleteProduct(req.params.id, seller.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not owned by you' });
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  addProduct,
  getMyProducts,
  editProduct,
  removeProduct,
};
