const { QueryTypes, Op } = require('sequelize');
const { sequelize, Product } = require('./sequelize');

async function createProduct(sellerId, {
  name, description, price, stock, category, imageUrl,
  customizable = false, customizationOptions = [], customizationFee = 0, customizationSettings = {},
}) {
  const product = await Product.create({
    seller_id: sellerId, name, description, price, stock, category, image_url: imageUrl,
    customizable, customization_options: customizationOptions,
    customization_fee: customizationFee, customization_settings: customizationSettings,
  });
  return product.get({ plain: true });
}

const SORT_COLUMNS = {
  relevance: 'p.created_at DESC',
  newest: 'p.created_at DESC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  rating: 'avg_rating DESC NULLS LAST',
};

// Dynamic filters + a computed avg_rating/review_count aggregate, sitting
// alongside every column of the product itself and the seller's shop_name —
// this stays a raw, hand-built query because Sequelize's `include`/`group`
// query builder would nest the shop_name under an association object
// instead of flattening it, which is what every caller of this function
// (and the frontend beyond it) expects.
async function getProducts({
  category, search, minPrice, maxPrice, sellerId, minRating, inStockOnly,
  sort = 'relevance', limit = 20, offset = 0,
} = {}) {
  const conditions = [`p.status = 'approved'`];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`p.category = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.category ILIKE $${params.length} OR s.shop_name ILIKE $${params.length})`);
  }

  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    params.push(minPrice);
    conditions.push(`p.price >= $${params.length}`);
  }

  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    params.push(maxPrice);
    conditions.push(`p.price <= $${params.length}`);
  }

  if (sellerId) {
    params.push(sellerId);
    conditions.push(`p.seller_id = $${params.length}`);
  }

  if (inStockOnly) {
    conditions.push(`p.stock > 0`);
  }

  const where = conditions.join(' AND ');
  const having = minRating ? `HAVING COALESCE(AVG(r.rating), 0) >= ${Number(minRating)}` : '';

  const countRows = await sequelize.query(
    `SELECT COUNT(*) FROM (
       SELECT p.id
       FROM products p
       JOIN sellers s ON s.id = p.seller_id
       LEFT JOIN reviews r ON r.product_id = p.id AND r.status = 'visible'
       WHERE ${where}
       GROUP BY p.id
       ${having}
     ) counted`,
    { bind: params, type: QueryTypes.SELECT }
  );
  const total = parseInt(countRows[0].count, 10);

  const orderBy = SORT_COLUMNS[sort] || SORT_COLUMNS.relevance;
  const limitParams = [...params, limit, offset];

  const rows = await sequelize.query(
    `SELECT p.*, s.shop_name,
            COALESCE(AVG(r.rating), 0)::float AS avg_rating,
            COUNT(r.id)::int AS review_count
     FROM products p
     JOIN sellers s ON s.id = p.seller_id
     LEFT JOIN reviews r ON r.product_id = p.id AND r.status = 'visible'
     WHERE ${where}
     GROUP BY p.id, s.shop_name
     ${having}
     ORDER BY ${orderBy}
     LIMIT $${limitParams.length - 1} OFFSET $${limitParams.length}`,
    { bind: limitParams, type: QueryTypes.SELECT }
  );

  return { rows, total };
}

async function getProductById(id) {
  const rows = await sequelize.query(
    `SELECT p.*, s.shop_name,
            COALESCE(AVG(r.rating), 0)::float AS avg_rating,
            COUNT(r.id)::int AS review_count
     FROM products p
     JOIN sellers s ON s.id = p.seller_id
     LEFT JOIN reviews r ON r.product_id = p.id AND r.status = 'visible'
     WHERE p.id = $1
     GROUP BY p.id, s.shop_name`,
    { bind: [id], type: QueryTypes.SELECT }
  );
  return rows[0];
}

async function getSearchSuggestions(q) {
  const like = `%${q}%`;
  const [products, shops] = await Promise.all([
    Product.findAll({
      where: { status: 'approved', name: { [Op.iLike]: like } },
      attributes: ['id', 'name', 'price', 'image_url', 'category'],
      order: [['created_at', 'DESC']],
      limit: 5,
    }),
    sequelize.query(
      `SELECT s.id, s.shop_name FROM sellers s WHERE s.status = 'approved' AND s.shop_name ILIKE $1 LIMIT 4`,
      { bind: [like], type: QueryTypes.SELECT }
    ),
  ]);
  return { products: products.map((p) => p.get({ plain: true })), shops };
}

async function getProductsBySeller(sellerId) {
  const products = await Product.findAll({
    where: { seller_id: sellerId },
    order: [['created_at', 'DESC']],
  });
  return products.map((p) => p.get({ plain: true }));
}

const UPDATABLE_FIELDS = [
  'name', 'description', 'price', 'stock', 'category', 'image_url',
  'customizable', 'customization_options', 'customization_fee', 'customization_settings',
];

async function updateProduct(id, sellerId, fields) {
  const changes = {};
  for (const [key, value] of Object.entries(fields)) {
    if (UPDATABLE_FIELDS.includes(key) && value !== undefined) {
      changes[key] = value;
    }
  }

  if (Object.keys(changes).length === 0) {
    return getProductById(id);
  }

  const [, rows] = await Product.update(changes, {
    where: { id, seller_id: sellerId },
    returning: true,
  });
  return rows[0] ? rows[0].get({ plain: true }) : undefined;
}

async function deleteProduct(id, sellerId) {
  const product = await Product.findOne({ where: { id, seller_id: sellerId } });
  if (!product) return undefined;
  const plain = product.get({ plain: true });
  await product.destroy();
  return plain;
}

// Flattens the owning seller's shop_name alongside every product column —
// see getProducts() above for why this stays raw.
async function getAllProductsAdmin() {
  return sequelize.query(
    `SELECT p.*, s.shop_name
     FROM products p
     JOIN sellers s ON s.id = p.seller_id
     ORDER BY p.created_at DESC`,
    { type: QueryTypes.SELECT }
  );
}

async function updateProductStatus(id, status) {
  const [, rows] = await Product.update({ status }, { where: { id }, returning: true });
  return rows[0] ? rows[0].get({ plain: true }) : undefined;
}

async function deleteProductAdmin(id) {
  const product = await Product.findByPk(id);
  if (!product) return undefined;
  const plain = product.get({ plain: true });
  await product.destroy();
  return plain;
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getSearchSuggestions,
  getProductsBySeller,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  updateProductStatus,
  deleteProductAdmin,
};
