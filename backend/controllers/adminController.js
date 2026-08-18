const pool = require('../config/db');
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

    const targetCheck = await pool.query('SELECT role FROM users WHERE id = $1', [targetId]);
    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetCheck.rows[0].role === 'admin') {
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

    const targetCheck = await pool.query('SELECT role FROM users WHERE id = $1', [targetId]);
    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetCheck.rows[0].role === 'admin') {
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
      const targetCheck = await pool.query('SELECT role FROM users WHERE id = $1', [report.target_id]);
      if (targetCheck.rows[0]?.role === 'admin') {
        return res.status(403).json({ message: 'Cannot warn an admin account' });
      }
      await createWarning(report.target_id, message, req.user.id);
      await resolveReportsForTarget(report.target_type, report.target_id, 'actioned');
    } else if (action === 'suspend') {
      const targetCheck = await pool.query('SELECT role FROM users WHERE id = $1', [report.target_id]);
      if (targetCheck.rows[0]?.role === 'admin') {
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
    const [users, sellers, products, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM sellers'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'cancelled'`),
    ]);

    res.json({
      totalUsers: Number(users.rows[0].count),
      totalSellers: Number(sellers.rows[0].count),
      totalProducts: Number(products.rows[0].count),
      totalOrders: Number(orders.rows[0].count),
      totalRevenue: Number(revenue.rows[0].total),
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
    const [
      userCount, sellerCount, productCount, orderCount, revenue,
      newUsers, newSellers, newProducts, newOrders,
      sellerStatusCounts, productStatusCounts, orderStatusCounts,
      recentOrders, recentSellers, recentReports, recentUsers, recentProducts,
      pendingSellers, pendingProducts, pendingReports, priorityReports,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM sellers'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'cancelled'`),

      pool.query(`SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(*) FROM sellers WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(*) FROM products WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'`),

      pool.query(`SELECT status, COUNT(*) FROM sellers GROUP BY status`),
      pool.query(`SELECT status, COUNT(*) FROM products GROUP BY status`),
      pool.query(`SELECT status, COUNT(*) FROM orders GROUP BY status`),

      pool.query(`
        SELECT o.id, o.total_amount, o.created_at, u.name AS actor_name
        FROM orders o JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 5
      `),
      pool.query(`
        SELECT s.id, s.shop_name, s.created_at, u.name AS actor_name
        FROM sellers s JOIN users u ON u.id = s.user_id
        ORDER BY s.created_at DESC LIMIT 5
      `),
      pool.query(`
        SELECT r.id, r.reason, r.target_type, r.created_at, reporter.name AS actor_name
        FROM reports r JOIN users reporter ON reporter.id = r.reporter_id
        ORDER BY r.created_at DESC LIMIT 5
      `),
      pool.query(`SELECT id, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5`),
      pool.query(`
        SELECT p.id, p.name, p.created_at, s.shop_name
        FROM products p JOIN sellers s ON s.id = p.seller_id
        ORDER BY p.created_at DESC LIMIT 5
      `),

      pool.query(`SELECT COUNT(*) FROM sellers WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM products WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM reports WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM reports WHERE status = 'pending' AND priority = true`),
    ]);

    const countBy = (rows) => rows.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {});
    const sellersByStatus = countBy(sellerStatusCounts.rows);
    const productsByStatus = countBy(productStatusCounts.rows);
    const ordersByStatus = countBy(orderStatusCounts.rows);

    const rate = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

    const activity = [
      ...recentOrders.rows.map((o) => ({
        type: 'order', id: o.id, created_at: o.created_at,
        actorName: o.actor_name, amount: Number(o.total_amount),
      })),
      ...recentSellers.rows.map((s) => ({
        type: 'seller', id: s.id, created_at: s.created_at,
        actorName: s.actor_name, shopName: s.shop_name,
      })),
      ...recentReports.rows.map((r) => ({
        type: 'report', id: r.id, created_at: r.created_at,
        actorName: r.actor_name, reason: r.reason, targetType: r.target_type,
      })),
      ...recentUsers.rows.map((u) => ({
        type: 'user', id: u.id, created_at: u.created_at,
        actorName: u.name, role: u.role,
      })),
      ...recentProducts.rows.map((p) => ({
        type: 'product', id: p.id, created_at: p.created_at,
        productName: p.name, shopName: p.shop_name,
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    res.json({
      stats: {
        totalUsers: Number(userCount.rows[0].count),
        totalSellers: Number(sellerCount.rows[0].count),
        totalProducts: Number(productCount.rows[0].count),
        totalOrders: Number(orderCount.rows[0].count),
        totalRevenue: Number(revenue.rows[0].total),
      },
      trends: {
        newUsers7d: Number(newUsers.rows[0].count),
        newSellers7d: Number(newSellers.rows[0].count),
        newProducts7d: Number(newProducts.rows[0].count),
        newOrders7d: Number(newOrders.rows[0].count),
      },
      quickActions: {
        pendingSellers: Number(pendingSellers.rows[0].count),
        pendingProducts: Number(pendingProducts.rows[0].count),
        pendingReports: Number(pendingReports.rows[0].count),
        priorityReports: Number(priorityReports.rows[0].count),
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
