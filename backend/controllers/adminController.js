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
};
