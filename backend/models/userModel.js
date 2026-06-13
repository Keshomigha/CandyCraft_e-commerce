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

async function createSellerProfile(userId, shopName, description) {
  const result = await pool.query(
    `INSERT INTO sellers (user_id, shop_name, description)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, shop_name, description, status, created_at`,
    [userId, shopName, description || null]
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  createSellerProfile,
};
