
const pool = require('../config/db');

const VALID_TARGET_TYPES = ['product', 'user'];
const VALID_REASONS = ['scam', 'inappropriate', 'spam', 'prohibited', 'other'];

async function createReport({ reporterId, targetType, targetId, reason, details }) {
  const result = await pool.query(
    `INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [reporterId, targetType, targetId, reason, details || null]
  );
  return result.rows[0];
}

async function findPendingReport(reporterId, targetType, targetId) {
  const result = await pool.query(
    `SELECT * FROM reports
     WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3 AND status = 'pending'`,
    [reporterId, targetType, targetId]
  );
  return result.rows[0];
}

async function countRecentReports(targetType, targetId, sinceDate) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM reports
     WHERE target_type = $1 AND target_id = $2 AND created_at >= $3`,
    [targetType, targetId, sinceDate]
  );
  return Number(result.rows[0].count);
}

async function markPendingReportsPriority(targetType, targetId) {
  await pool.query(
    `UPDATE reports SET priority = true
     WHERE target_type = $1 AND target_id = $2 AND status = 'pending'`,
    [targetType, targetId]
  );
}

async function getReportById(id) {
  const result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateReportStatus(id, status) {
  const result = await pool.query(
    'UPDATE reports SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

async function resolveReportsForTarget(targetType, targetId, status) {
  await pool.query(
    `UPDATE reports SET status = $1
     WHERE target_type = $2 AND target_id = $3 AND status = 'pending'`,
    [status, targetType, targetId]
  );
}

async function getAllReportsAdmin() {
  const result = await pool.query(`
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
  `);
  return result.rows;
}

async function createWarning(userId, message, issuedBy) {
  const result = await pool.query(
    `INSERT INTO user_warnings (user_id, message, issued_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, message || null, issuedBy]
  );
  return result.rows[0];
}

async function getWarningCounts() {
  const result = await pool.query(
    `SELECT user_id, COUNT(*) AS count FROM user_warnings GROUP BY user_id`
  );
  return result.rows;
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
