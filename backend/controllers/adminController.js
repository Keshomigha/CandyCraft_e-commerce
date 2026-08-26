const { Op, fn, col, QueryTypes } = require('sequelize');
const { sequelize, User, Seller, Product, Order, Report } = require('../models/sequelize');
const {
  getAllUsers,
  getAllSellers,
  updateSellerStatus,
  updateUserStatus,
  deleteUserById,
} = require('../models/userModel');
const { getAllProductsAdmin, updateProductStatus, deleteProductAdmin } = require('../models/productModel');
const { getAllReviewsAdmin, updateReviewStatus, deleteReviewAdmin } = require('../models/reviewModel');
const { getAllOrdersAdmin, updateOrderStatus } = require('../models/orderModel');
const {
  getAllReportsAdmin,
  getReportById,
  resolveReportsForTarget,
  createWarning,
} = require('../models/reportModel');

const VALID_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];
const VALID_SELLER_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];
const VALID_REVIEW_STATUSES = ['visible', 'hidden'];
const VALID_USER_STATUSES = ['active', 'suspended'];
const VALID_ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const VALID_REPORT_ACTIONS = ['dismiss', 'remove', 'warn', 'suspend'];

async function listUsers(req, res, next) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function listSellers(req, res, next) {
  try {
    const sellers = await getAllSellers();
    res.json(sellers);
  } catch (err) {
    next(err);
  }
}

async function setSellerStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_SELLER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_SELLER_STATUSES.join(', ')}` });
    }

    const seller = await updateSellerStatus(req.params.id, status);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json(seller);
  } catch (err) {
    next(err);
  }
}

async function setUserStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_USER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_USER_STATUSES.join(', ')}` });
    }

    const targetId = Number(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'You cannot change the status of your own account' });
    }

    const targetUser = await User.findByPk(targetId, { attributes: ['role'] });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot change the status of another admin account' });
    }

    const user = await updateUserStatus(targetId, status);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function removeUser(req, res, next) {
  try {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const targetUser = await User.findByPk(targetId, { attributes: ['role'] });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete another admin account' });
    }

    const user = await deleteUserById(targetId);
    res.json({ message: 'User deleted', user });
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const products = await getAllProductsAdmin();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function setProductStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_APPROVAL_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_APPROVAL_STATUSES.join(', ')}` });
    }

    const product = await updateProductStatus(req.params.id, status);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function removeProduct(req, res, next) {
  try {
    const product = await deleteProductAdmin(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted', product });
  } catch (err) {
    next(err);
  }
}

async function listReviews(req, res, next) {
  try {
    const reviews = await getAllReviewsAdmin();
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

async function setReviewStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_REVIEW_STATUSES.join(', ')}` });
    }

    const review = await updateReviewStatus(req.params.id, status);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (err) {
    next(err);
  }
}

async function removeReview(req, res, next) {
  try {
    const review = await deleteReviewAdmin(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review deleted', review });
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const orders = await getAllOrdersAdmin();
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function setOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_ORDER_STATUSES.join(', ')}` });
    }

    const order = await updateOrderStatus(req.params.id, status);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
}

async function listReports(req, res, next) {
  try {
    const reports = await getAllReportsAdmin();
    res.json(reports);
  } catch (err) {
    next(err);
  }
}

async function resolveReport(req, res, next) {
  try {
    const { action, message } = req.body;
    if (!VALID_REPORT_ACTIONS.includes(action)) {
      return res.status(400).json({ message: `action must be one of: ${VALID_REPORT_ACTIONS.join(', ')}` });
    }

    const report = await getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (report.status !== 'pending') {
      return res.status(400).json({ message: 'This report has already been resolved' });
    }

    if (action === 'remove' && report.target_type !== 'product') {
      return res.status(400).json({ message: '"remove" is only valid for product reports' });
    }
    if ((action === 'warn' || action === 'suspend') && report.target_type !== 'user') {
      return res.status(400).json({ message: `"${action}" is only valid for user reports` });
    }
    if ((action === 'warn' || action === 'suspend') && report.target_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot take this action on your own account' });
    }

    if (action === 'dismiss') {
      await resolveReportsForTarget(report.target_type, report.target_id, 'dismissed');
    } else if (action === 'remove') {
      await deleteProductAdmin(report.target_id);
      await resolveReportsForTarget(report.target_type, report.target_id, 'actioned');
    } else if (action === 'warn') {
      const targetUser = await User.findByPk(report.target_id, { attributes: ['role'] });
      if (targetUser?.role === 'admin') {
        return res.status(403).json({ message: 'Cannot warn an admin account' });
      }
      await createWarning(report.target_id, message, req.user.id);
      await resolveReportsForTarget(report.target_type, report.target_id, 'actioned');
    } else if (action === 'suspend') {
      const targetUser = await User.findByPk(report.target_id, { attributes: ['role'] });
      if (targetUser?.role === 'admin') {
        return res.status(403).json({ message: 'Cannot suspend an admin account' });
      }
      await updateUserStatus(report.target_id, 'suspended');
      await resolveReportsForTarget(report.target_type, report.target_id, 'actioned');
    }

    res.json({ message: `Report ${action === 'dismiss' ? 'dismissed' : 'resolved'}` });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const [totalUsers, totalSellers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
      User.count(),
      Seller.count(),
      Product.count(),
      Order.count(),
      Order.sum('total_amount', { where: { status: { [Op.ne]: 'cancelled' } } }),
    ]);

    res.json({
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue || 0,
    });
  } catch (err) {
    next(err);
  }
}

// Every figure below is a real, live query against actual rows — no
// placeholder/sample data. Trends are "new since 7 days ago" counts;
// health rates are computed only from decided/concluded records so a
// pile of still-pending applications doesn't skew them.
async function getDashboardOverview(req, res, next) {
  try {
    const sevenDaysAgo = { created_at: { [Op.gte]: sequelize.literal("NOW() - INTERVAL '7 days'") } };

    const [
      totalUsers, totalSellers, totalProducts, totalOrders, totalRevenue,
      newUsers7d, newSellers7d, newProducts7d, newOrders7d,
      sellerStatusCounts, productStatusCounts, orderStatusCounts,
      recentOrders, recentSellers, recentReports, recentUsers, recentProducts,
      pendingSellers, pendingProducts, pendingReports, priorityReports,
    ] = await Promise.all([
      User.count(),
      Seller.count(),
      Product.count(),
      Order.count(),
      Order.sum('total_amount', { where: { status: { [Op.ne]: 'cancelled' } } }),

      User.count({ where: sevenDaysAgo }),
      Seller.count({ where: sevenDaysAgo }),
      Product.count({ where: sevenDaysAgo }),
      Order.count({ where: sevenDaysAgo }),

      Seller.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }),
      Product.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }),
      Order.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }),

      sequelize.query(`
        SELECT o.id, o.total_amount, o.created_at, u.name AS actor_name
        FROM orders o JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 5
      `, { type: QueryTypes.SELECT }),
      sequelize.query(`
        SELECT s.id, s.shop_name, s.created_at, u.name AS actor_name
        FROM sellers s JOIN users u ON u.id = s.user_id
        ORDER BY s.created_at DESC LIMIT 5
      `, { type: QueryTypes.SELECT }),
      sequelize.query(`
        SELECT r.id, r.reason, r.target_type, r.created_at, reporter.name AS actor_name
        FROM reports r JOIN users reporter ON reporter.id = r.reporter_id
        ORDER BY r.created_at DESC LIMIT 5
      `, { type: QueryTypes.SELECT }),
      User.findAll({ attributes: ['id', 'name', 'role', 'created_at'], order: [['created_at', 'DESC']], limit: 5, raw: true }),
      sequelize.query(`
        SELECT p.id, p.name, p.created_at, s.shop_name
        FROM products p JOIN sellers s ON s.id = p.seller_id
        ORDER BY p.created_at DESC LIMIT 5
      `, { type: QueryTypes.SELECT }),

      Seller.count({ where: { status: 'pending' } }),
      Product.count({ where: { status: 'pending' } }),
      Report.count({ where: { status: 'pending' } }),
      Report.count({ where: { status: 'pending', priority: true } }),
    ]);

    const countBy = (rows) => rows.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {});
    const sellersByStatus = countBy(sellerStatusCounts);
    const productsByStatus = countBy(productStatusCounts);
    const ordersByStatus = countBy(orderStatusCounts);

    const rate = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

    const activity = [
      ...recentOrders.map((o) => ({
        type: 'order', id: o.id, created_at: o.created_at,
        actorName: o.actor_name, amount: Number(o.total_amount),
      })),
      ...recentSellers.map((s) => ({
        type: 'seller', id: s.id, created_at: s.created_at,
        actorName: s.actor_name, shopName: s.shop_name,
      })),
      ...recentReports.map((r) => ({
        type: 'report', id: r.id, created_at: r.created_at,
        actorName: r.actor_name, reason: r.reason, targetType: r.target_type,
      })),
      ...recentUsers.map((u) => ({
        type: 'user', id: u.id, created_at: u.created_at,
        actorName: u.name, role: u.role,
      })),
      ...recentProducts.map((p) => ({
        type: 'product', id: p.id, created_at: p.created_at,
        productName: p.name, shopName: p.shop_name,
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    res.json({
      stats: {
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue || 0,
      },
      trends: {
        newUsers7d,
        newSellers7d,
        newProducts7d,
        newOrders7d,
      },
      quickActions: {
        pendingSellers,
        pendingProducts,
        pendingReports,
        priorityReports,
      },
      health: {
        orderSuccessRate: rate(ordersByStatus.delivered || 0, (ordersByStatus.delivered || 0) + (ordersByStatus.cancelled || 0)),
        sellerApprovalRate: rate(sellersByStatus.approved || 0, (sellersByStatus.approved || 0) + (sellersByStatus.rejected || 0)),
        productApprovalRate: rate(productsByStatus.approved || 0, (productsByStatus.approved || 0) + (productsByStatus.rejected || 0)),
      },
      activity,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  setUserStatus,
  removeUser,
  listSellers,
  setSellerStatus,
  listProducts,
  setProductStatus,
  removeProduct,
  listReviews,
  setReviewStatus,
  removeReview,
  listOrders,
  setOrderStatus,
  listReports,
  resolveReport,
  getStats,
  getDashboardOverview,
};
