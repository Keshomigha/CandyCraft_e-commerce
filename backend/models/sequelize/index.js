const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('buyer', 'seller', 'admin'), allowNull: false, defaultValue: 'buyer' },
  status: { type: DataTypes.ENUM('active', 'suspended'), allowNull: false, defaultValue: 'active' },
  phone: DataTypes.STRING(20),
  address: DataTypes.TEXT,
  city: DataTypes.STRING(100),
  postal_code: DataTypes.STRING(20),
}, { tableName: 'users' });

const Seller = sequelize.define('Seller', {
  user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  shop_name: { type: DataTypes.STRING(150), allowNull: false },
  description: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'), allowNull: false, defaultValue: 'pending' },
}, { tableName: 'sellers' });

const Product = sequelize.define('Product', {
  seller_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: DataTypes.TEXT,
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  category: DataTypes.STRING(100),
  image_url: DataTypes.STRING(255),
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  customizable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  customization_options: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  customization_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  customization_settings: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, { tableName: 'products' });

const CartItem = sequelize.define('CartItem', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  customization: DataTypes.JSONB,
}, {
  tableName: 'cart_items',
  indexes: [{ unique: true, fields: ['user_id', 'product_id'] }],
});

const Order = sequelize.define('Order', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'), allowNull: false, defaultValue: 'pending' },
  shipping_address: DataTypes.TEXT,
}, { tableName: 'orders' });

const OrderItem = sequelize.define('OrderItem', {
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  seller_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  customization: DataTypes.JSONB,
}, { tableName: 'order_items' });

const Review = sequelize.define('Review', {
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('visible', 'hidden'), allowNull: false, defaultValue: 'visible' },
}, { tableName: 'reviews' });

const WishlistItem = sequelize.define('WishlistItem', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'wishlist_items',
  indexes: [{ unique: true, fields: ['user_id', 'product_id'] }],
});

const Report = sequelize.define('Report', {
  reporter_id: { type: DataTypes.INTEGER, allowNull: false },
  target_type: { type: DataTypes.ENUM('product', 'user'), allowNull: false },
  target_id: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.ENUM('scam', 'inappropriate', 'spam', 'prohibited', 'other'), allowNull: false },
  details: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('pending', 'dismissed', 'actioned'), allowNull: false, defaultValue: 'pending' },
  priority: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'reports' });

const UserWarning = sequelize.define('UserWarning', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  message: DataTypes.TEXT,
  issued_by: DataTypes.INTEGER,
}, { tableName: 'user_warnings' });

const SearchLog = sequelize.define('SearchLog', {
  query: { type: DataTypes.STRING(200), allowNull: false },
  user_id: DataTypes.INTEGER,
}, { tableName: 'search_logs' });

// Associations — foreignKey matches the attribute names above 1:1, since
// those are already the real snake_case DB columns.
User.hasOne(Seller, { foreignKey: 'user_id' });
Seller.belongsTo(User, { foreignKey: 'user_id' });

Seller.hasMany(Product, { foreignKey: 'seller_id' });
Product.belongsTo(Seller, { foreignKey: 'seller_id' });

User.hasMany(CartItem, { foreignKey: 'user_id' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });
Seller.hasMany(OrderItem, { foreignKey: 'seller_id' });
OrderItem.belongsTo(Seller, { foreignKey: 'seller_id' });

Product.hasMany(Review, { foreignKey: 'product_id' });
Review.belongsTo(Product, { foreignKey: 'product_id' });
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(WishlistItem, { foreignKey: 'user_id' });
WishlistItem.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(WishlistItem, { foreignKey: 'product_id' });
WishlistItem.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Report, { foreignKey: 'reporter_id', as: 'reportsFiled' });
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });

User.hasMany(UserWarning, { foreignKey: 'user_id' });
UserWarning.belongsTo(User, { foreignKey: 'user_id' });
UserWarning.belongsTo(User, { foreignKey: 'issued_by', as: 'issuer' });

User.hasMany(SearchLog, { foreignKey: 'user_id' });
SearchLog.belongsTo(User, { foreignKey: 'user_id' });

async function syncDatabase() {
  await sequelize.sync();
}

module.exports = {
  sequelize,
  User,
  Seller,
  Product,
  CartItem,
  Order,
  OrderItem,
  Review,
  WishlistItem,
  Report,
  UserWarning,
  SearchLog,
  syncDatabase,
};
