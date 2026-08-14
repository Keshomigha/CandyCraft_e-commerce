const { getProductById, updateProductStatus } = require('../models/productModel');
const { findUserById, updateUserStatus } = require('../models/userModel');
const {
  VALID_TARGET_TYPES,
  VALID_REASONS,
  createReport,
  findPendingReport,
  countRecentReports,
  markPendingReportsPriority,
} = require('../models/reportModel');

// 3+ reports on the same target within 7 days auto-escalates it for priority
// review and takes it out of public view pending an admin decision.
const AUTO_FLAG_THRESHOLD = 3;
const AUTO_FLAG_WINDOW_DAYS = 7;

async function submitReport(req, res, next) {
  try {
    const { targetType, targetId, reason, details } = req.body;
    const reporterId = req.user.id;

    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({ message: `targetType must be one of: ${VALID_TARGET_TYPES.join(', ')}` });
    }
    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({ message: `reason must be one of: ${VALID_REASONS.join(', ')}` });
    }

    const id = Number(targetId);
    if (!id) {
      return res.status(400).json({ message: 'targetId is required' });
    }

    if (targetType === 'user') {
      if (id === reporterId) {
        return res.status(400).json({ message: 'You cannot report yourself' });
      }
      const target = await findUserById(id);
      if (!target) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (target.role === 'admin') {
        return res.status(403).json({ message: 'Cannot report an admin account' });
      }
    } else {
      const product = await getProductById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
    }

    const existing = await findPendingReport(reporterId, targetType, id);
    if (existing) {
      return res.status(409).json({ message: 'You have already reported this. Our team is reviewing it.' });
    }

    const report = await createReport({ reporterId, targetType, targetId: id, reason, details });

    const since = new Date(Date.now() - AUTO_FLAG_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const recentCount = await countRecentReports(targetType, id, since);

    let autoFlagged = false;
    if (recentCount >= AUTO_FLAG_THRESHOLD) {
      autoFlagged = true;
      await markPendingReportsPriority(targetType, id);
      if (targetType === 'product') {
        await updateProductStatus(id, 'pending');
      } else {
        await updateUserStatus(id, 'suspended');
      }
    }

    res.status(201).json({ report, autoFlagged });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitReport };
