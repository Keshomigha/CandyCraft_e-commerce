const pool = require('../config/db');

async function createProduct(sellerId, { name, description, price, stock, category, imageUrl }) {
  const result = await pool.query(
    `INSERT INTO products (seller_id, name, description, price, stock, category, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [sellerId, name, description, price, stock, category, imageUrl]
  );
  return result.rows[0];
}

async function getProducts({ category, search, limit = 20, offset = 0 } = {}) {
  const conditions = [`status = 'approved'`];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }

  const where = conditions.join(' AND ');

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM products WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `SELECT * FROM products
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: result.rows, total };
}

async function getProductById(id) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0];
}

async function getProductsBySeller(sellerId) {
  const result = await pool.query(
    'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
    [sellerId]
  );
  return result.rows;
}

async function updateProduct(id, sellerId, fields) {
  const allowed = ['name', 'description', 'price', 'stock', 'category', 'image_url'];
  const updates = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    if (allowed.includes(key) && value !== undefined) {
      params.push(value);
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

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductsBySeller,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  updateProductStatus,
};
