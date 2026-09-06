const { QueryTypes } = require('sequelize');
const { sequelize, SearchLog } = require('./sequelize');

async function logSearch(query, userId) {
  const trimmed = (query || '').trim();
  if (!trimmed) return;
  await SearchLog.create({ query: trimmed, user_id: userId || null });
}

// Real usage-derived "trending searches" — the most frequent search terms
// actually typed by users in the last 30 days. No hardcoded/sample terms.
// GROUP BY on a lowercased expression + ORDER BY the resulting alias is
// awkward to express reliably through Sequelize's fn/literal builder, so
// this stays a raw aggregate query (see productModel.js for the same call).
async function getPopularSearches(limit = 6) {
  const rows = await sequelize.query(
    `SELECT LOWER(query) AS term, COUNT(*) AS count
     FROM search_logs
     WHERE created_at >= NOW() - INTERVAL '30 days'
     GROUP BY LOWER(query)
     ORDER BY count DESC, MAX(created_at) DESC
     LIMIT $1`,
    { bind: [limit], type: QueryTypes.SELECT }
  );
  return rows.map((r) => r.term);
}

module.exports = { logSearch, getPopularSearches };
