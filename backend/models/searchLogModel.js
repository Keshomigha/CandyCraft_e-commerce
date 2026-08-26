const pool = require('../config/db');

async function logSearch(query, userId) {
  const trimmed = (query || '').trim();
  if (!trimmed) return;
  await pool.query(
    'INSERT INTO search_logs (query, user_id) VALUES ($1, $2)',
    [trimmed, userId || null]
  );
}

// Real usage-derived "trending searches" — the most frequent search terms
// actually typed by users in the last 30 days. No hardcoded/sample terms.
async function getPopularSearches(limit = 6) {
  const result = await pool.query(
    `SELECT LOWER(query) AS term, COUNT(*) AS count
     FROM search_logs
     WHERE created_at >= NOW() - INTERVAL '30 days'
     GROUP BY LOWER(query)
     ORDER BY count DESC, MAX(created_at) DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((r) => r.term);
}

module.exports = { logSearch, getPopularSearches };
