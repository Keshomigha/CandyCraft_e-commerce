const {
  createProduct,
  getProducts,
  getProductById,
  getSearchSuggestions,
  getProductsBySeller,
  updateProduct,
  deleteProduct,
} = require('../models/productModel');
const { findSellerByUserId } = require('../models/userModel');
const { logSearch, getPopularSearches } = require('../models/searchLogModel');
const { Op, fn, col } = require('sequelize');
const { Product } = require('../models/sequelize');

const VALID_SORTS = ['relevance', 'newest', 'price_asc', 'price_desc', 'rating'];

async function listProducts(req, res, next) {
  try {
    const {
      category, search, minPrice, maxPrice, sellerId, minRating, inStock,
      sort = 'relevance', page = 1, limit = 20,
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { rows: products, total } = await getProducts({
      category,
      search,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sellerId: sellerId ? Number(sellerId) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      inStockOnly: inStock === 'true',
      sort: VALID_SORTS.includes(sort) ? sort : 'relevance',
      limit: Number(limit),
      offset,
    });

    // A "search" query represents a real, executed search (not every
    // keystroke) — logging it here is what powers real "popular searches"
    // for the search bar, with no hardcoded/sample trending terms.
    if (search && search.trim()) {
      logSearch(search, req.user?.id).catch(() => {});
    }

    res.json({ products, total });
  } catch (err) {
    next(err);
  }
}

async function getSuggestions(req, res, next) {
  try {
    const q = (req.query.q || '').trim();

    if (q.length < 2) {
      const popularSearches = await getPopularSearches(6);
      return res.json({ products: [], shops: [], categories: [], popularSearches });
    }

    const [{ products, shops }, popularSearches, categoryRows] = await Promise.all([
      getSearchSuggestions(q),
      getPopularSearches(6),
      Product.findAll({
        attributes: [[fn('DISTINCT', col('category')), 'category']],
        where: { status: 'approved', category: { [Op.iLike]: `%${q}%` } },
        order: [['category', 'ASC']],
        limit: 5,
        raw: true,
      }),
    ]);

    res.json({
      products, shops,
      categories: categoryRows.map((r) => r.category),
      popularSearches,
    });
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

function parseCustomizationOptions(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseCustomizationSettings(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function addProduct(req, res, next) {
  try {
    const seller = await findSellerByUserId(req.user.id);
    if (!seller) {
      return res.status(403).json({ message: 'Seller profile not found' });
    }

    const {
      name, description, price, stock, category,
      customizable, customizationOptions, customizationFee, customizationSettings,
    } = req.body;
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
      customizable: customizable === 'true' || customizable === true,
      customizationOptions: parseCustomizationOptions(customizationOptions),
      customizationFee: customizationFee ? Number(customizationFee) : 0,
      customizationSettings: parseCustomizationSettings(customizationSettings),
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
    if (fields.customizable !== undefined) {
      fields.customizable = fields.customizable === 'true' || fields.customizable === true;
    }
    if (fields.customizationOptions !== undefined) {
      fields.customization_options = parseCustomizationOptions(fields.customizationOptions);
      delete fields.customizationOptions;
    }
    if (fields.customizationFee !== undefined) {
      fields.customization_fee = Number(fields.customizationFee) || 0;
      delete fields.customizationFee;
    }
    if (fields.customizationSettings !== undefined) {
      fields.customization_settings = parseCustomizationSettings(fields.customizationSettings);
      delete fields.customizationSettings;
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
  getSuggestions,
  getProduct,
  addProduct,
  getMyProducts,
  editProduct,
  removeProduct,
};
