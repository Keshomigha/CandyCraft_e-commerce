const pool = require('../config/db');

async function createUser({ name, email, password, role }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, password, role]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

async function findUserById(id) {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function findSellerByUserId(userId) {
  const result = await pool.query('SELECT * FROM sellers WHERE user_id = $1', [userId]);
  return result.rows[0];
}

async function createSellerProfile(userId, shopName, description) {
  const result = await pool.query(
    `INSERT INTO sellers (user_id, shop_name, description)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, shop_name, description, status, created_at`,
    [userId, shopName, description || null]
  );
  return result.rows[0];
}

async function getApprovedSellers() {
  const result = await pool.query(
    `SELECT s.id, s.shop_name, s.description, u.name,
            COUNT(DISTINCT p.id) AS product_count
     FROM sellers s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN products p ON p.seller_id = s.id AND p.status = 'approved'
     WHERE s.status = 'approved'
     GROUP BY s.id, u.name
     ORDER BY product_count DESC
     LIMIT 8`
  );
  return result.rows;
}

async function getAllUsers() {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
}

async function getAllSellers() {
  const result = await pool.query(
    `SELECT s.id, s.user_id, s.shop_name, s.description, s.status, s.created_at,
            u.name, u.email
     FROM sellers s
     JOIN users u ON u.id = s.user_id
     ORDER BY s.created_at DESC`
  );
  return result.rows;
}

async function updateSellerStatus(sellerId, status) {
  const result = await pool.query(
    `UPDATE sellers SET status = $1 WHERE id = $2 RETURNING *`,
    [status, sellerId]
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findSellerByUserId,
  createSellerProfile,
  getApprovedSellers,
  getAllUsers,
  getAllSellers,
  updateSellerStatus,
};
