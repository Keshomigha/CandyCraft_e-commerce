const { QueryTypes, Op, fn, col } = require('sequelize');
const { sequelize, Report, UserWarning } = require('./sequelize');

const VALID_TARGET_TYPES = ['product', 'user'];
const VALID_REASONS = ['scam', 'inappropriate', 'spam', 'prohibited', 'other'];

async function createReport({ reporterId, targetType, targetId, reason, details }) {
  const report = await Report.create({
    reporter_id: reporterId, target_type: targetType, target_id: targetId,
    reason, details: details || null,
  });
  return report.get({ plain: true });
}

async function findPendingReport(reporterId, targetType, targetId) {
  const report = await Report.findOne({
    where: { reporter_id: reporterId, target_type: targetType, target_id: targetId, status: 'pending' },
  });
  return report ? report.get({ plain: true }) : undefined;
}

async function countRecentReports(targetType, targetId, sinceDate) {
  return Report.count({
    where: { target_type: targetType, target_id: targetId, created_at: { [Op.gte]: sinceDate } },
  });
}

async function markPendingReportsPriority(targetType, targetId) {
  await Report.update(
    { priority: true },
    { where: { target_type: targetType, target_id: targetId, status: 'pending' } }
  );
}

async function getReportById(id) {
  const report = await Report.findByPk(id);
  return report ? report.get({ plain: true }) : undefined;
}

async function updateReportStatus(id, status) {
  const [, rows] = await Report.update({ status }, { where: { id }, returning: true });
  return rows[0] ? rows[0].get({ plain: true }) : undefined;
}

async function resolveReportsForTarget(targetType, targetId, status) {
  await Report.update(
    { status },
    { where: { target_type: targetType, target_id: targetId, status: 'pending' } }
  );
}

// Polymorphic target (product vs. user) resolved via CASE, plus a
// correlated subquery for the target's total report count — stays a raw
// query since neither maps cleanly onto Sequelize's association-based
// `include`.
async function getAllReportsAdmin() {
  return sequelize.query(`
    SELECT
      r.*,
      reporter.name AS reporter_name,
      reporter.email AS reporter_email,
      CASE
        WHEN r.target_type = 'product' THEN p.name
        WHEN r.target_type = 'user' THEN target_user.name
      END AS target_name,
      CASE
        WHEN r.target_type = 'product' THEN p.status
        WHEN r.target_type = 'user' THEN target_user.status
      END AS target_status,
      (
        SELECT COUNT(*) FROM reports r2
        WHERE r2.target_type = r.target_type AND r2.target_id = r.target_id
      ) AS total_reports_for_target
    FROM reports r
    JOIN users reporter ON reporter.id = r.reporter_id
    LEFT JOIN products p ON r.target_type = 'product' AND p.id = r.target_id
    LEFT JOIN users target_user ON r.target_type = 'user' AND target_user.id = r.target_id
    ORDER BY r.priority DESC, r.created_at DESC
  `, { type: QueryTypes.SELECT });
}

async function createWarning(userId, message, issuedBy) {
  const warning = await UserWarning.create({ user_id: userId, message: message || null, issued_by: issuedBy });
  return warning.get({ plain: true });
}

async function getWarningCounts() {
  const rows = await UserWarning.findAll({
    attributes: ['user_id', [fn('COUNT', col('id')), 'count']],
    group: ['user_id'],
    raw: true,
  });
  return rows;
}

module.exports = {
  VALID_TARGET_TYPES,
  VALID_REASONS,
  createReport,
  findPendingReport,
  countRecentReports,
  markPendingReportsPriority,
  getReportById,
  updateReportStatus,
  resolveReportsForTarget,
  getAllReportsAdmin,
  createWarning,
  getWarningCounts,
};
