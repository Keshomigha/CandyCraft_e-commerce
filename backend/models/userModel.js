const { QueryTypes } = require('sequelize');
const { sequelize, User, Seller } = require('./sequelize');

async function createUser({ name, email, password, role }) {
  const user = await User.create({ name, email, password, role });
  return { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at };
}

async function findUserByEmail(email) {
  const user = await User.findOne({ where: { email } });
  return user ? user.get({ plain: true }) : undefined;
}

async function findUserById(id) {
  const user = await User.findByPk(id, {
    attributes: ['id', 'name', 'email', 'role', 'created_at'],
  });
  return user ? user.get({ plain: true }) : undefined;
}

async function findSellerByUserId(userId) {
  const seller = await Seller.findOne({ where: { user_id: userId } });
  return seller ? seller.get({ plain: true }) : undefined;
}

async function createSellerProfile(userId, shopName, description) {
  const seller = await Seller.create({ user_id: userId, shop_name: shopName, description: description || null });
  return seller.get({ plain: true });
}

// Aggregates real per-seller rating/product stats via a LEFT JOIN — kept as
// a raw query since the flattened alias shape (avg_rating, review_count,
// product_count sitting alongside the seller's own columns) is what the
// frontend consumes directly, and that's awkward to reproduce with
// Sequelize's `include`, which nests associated rows instead of flattening.
async function getApprovedSellers() {
  return sequelize.query(
    `SELECT s.id, s.user_id, s.shop_name, s.description, u.name,
            COUNT(DISTINCT p.id) AS product_count,
            COALESCE(AVG(r.rating), 0)::float AS avg_rating,
            COUNT(DISTINCT r.id)::int AS review_count
     FROM sellers s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN products p ON p.seller_id = s.id AND p.status = 'approved'
     LEFT JOIN reviews r ON r.product_id = p.id AND r.status = 'visible'
     WHERE s.status = 'approved'
     GROUP BY s.id, u.name
     ORDER BY product_count DESC`,
    { type: QueryTypes.SELECT }
  );
}

async function getAllUsers() {
  const users = await User.findAll({
    attributes: ['id', 'name', 'email', 'role', 'status', 'created_at'],
    order: [['created_at', 'DESC']],
  });
  return users.map((u) => u.get({ plain: true }));
}

async function updateUserStatus(id, status) {
  const [, rows] = await User.update(
    { status },
    { where: { id }, returning: ['id', 'name', 'email', 'role', 'status', 'created_at'] }
  );
  return rows[0] ? rows[0].get({ plain: true }) : undefined;
}

async function deleteUserById(id) {
  const user = await User.findByPk(id, { attributes: ['id', 'name', 'email', 'role'] });
  if (!user) return undefined;
  const plain = user.get({ plain: true });
  await user.destroy();
  return plain;
}

// Flattens seller + owning-user columns for the admin table — see
// getApprovedSellers() above for why this stays a raw query.
async function getAllSellers() {
  return sequelize.query(
    `SELECT s.id, s.user_id, s.shop_name, s.description, s.status, s.created_at,
            u.name, u.email
     FROM sellers s
     JOIN users u ON u.id = s.user_id
     ORDER BY s.created_at DESC`,
    { type: QueryTypes.SELECT }
  );
}

async function updateSellerStatus(sellerId, status) {
  const [, rows] = await Seller.update({ status }, { where: { id: sellerId }, returning: true });
  return rows[0] ? rows[0].get({ plain: true }) : undefined;
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
  updateUserStatus,
  deleteUserById,
};
