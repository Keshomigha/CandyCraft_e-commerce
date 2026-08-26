const pool = require('../config/db');

async function createProduct(sellerId, {
  name, description, price, stock, category, imageUrl,
  customizable = false, customizationOptions = [], customizationFee = 0, customizationSettings = {},
}) {
  const result = await pool.query(
    `INSERT INTO products
       (seller_id, name, description, price, stock, category, image_url,
        customizable, customization_options, customization_fee, customization_settings)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      sellerId, name, description, price, stock, category, imageUrl,
      customizable, JSON.stringify(customizationOptions), customizationFee, JSON.stringify(customizationSettings),
    ]
  );
  return result.rows[0];
}

const SORT_COLUMNS = {
  relevance: 'p.created_at DESC',
  newest: 'p.created_at DESC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  rating: 'avg_rating DESC NULLS LAST',
};

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

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM (
       SELECT p.id
       FROM products p
       JOIN sellers s ON s.id = p.seller_id
       LEFT JOIN reviews r ON r.product_id = p.id AND r.status = 'visible'
       WHERE ${where}
       GROUP BY p.id
       ${having}
     ) counted`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const orderBy = SORT_COLUMNS[sort] || SORT_COLUMNS.relevance;
  params.push(limit);
  params.push(offset);

  const result = await pool.query(
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
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: result.rows, total };
}

async function getProductById(id) {
  const result = await pool.query(
    `SELECT p.*, s.shop_name,
            COALESCE(AVG(r.rating), 0)::float AS avg_rating,
            COUNT(r.id)::int AS review_count
     FROM products p
     JOIN sellers s ON s.id = p.seller_id
     LEFT JOIN reviews r ON r.product_id = p.id AND r.status = 'visible'
     WHERE p.id = $1
     GROUP BY p.id, s.shop_name`,
    [id]
  );
  return result.rows[0];
}

async function getSearchSuggestions(q) {
  const like = `%${q}%`;
  const [products, shops] = await Promise.all([
    pool.query(
      `SELECT p.id, p.name, p.price, p.image_url, p.category
       FROM products p
       WHERE p.status = 'approved' AND p.name ILIKE $1
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [like]
    ),
    pool.query(
      `SELECT s.id, s.shop_name
       FROM sellers s
       WHERE s.status = 'approved' AND s.shop_name ILIKE $1
       LIMIT 4`,
      [like]
    ),
  ]);
  return { products: products.rows, shops: shops.rows };
}

async function getProductsBySeller(sellerId) {
  const result = await pool.query(
    'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
    [sellerId]
  );
  return result.rows;
}

async function updateProduct(id, sellerId, fields) {
  const allowed = [
    'name', 'description', 'price', 'stock', 'category', 'image_url',
    'customizable', 'customization_options', 'customization_fee', 'customization_settings',
  ];
  const jsonFields = ['customization_options', 'customization_settings'];
  const updates = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    if (allowed.includes(key) && value !== undefined) {
      params.push(jsonFields.includes(key) ? JSON.stringify(value) : value);
      updates.push(`${key} = $${params.length}`);
    }
  }

  if (updates.length === 0) {
    return getProductById(id);
  }

  params.push(id);
  params.push(sellerId);

  const result = await pool.query(
    `UPDATE products SET ${updates.join(', ')}
     WHERE id = $${params.length - 1} AND seller_id = $${params.length}
     RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteProduct(id, sellerId) {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1 AND seller_id = $2 RETURNING *',
    [id, sellerId]
  );
  return result.rows[0];
}

async function getAllProductsAdmin() {
  const result = await pool.query(
    `SELECT p.*, s.shop_name
     FROM products p
     JOIN sellers s ON s.id = p.seller_id
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

async function updateProductStatus(id, status) {
  const result = await pool.query(
    'UPDATE products SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

async function deleteProductAdmin(id) {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
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
