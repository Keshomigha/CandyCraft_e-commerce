const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query('SELECT id, role, status FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
}

module.exports = { protect };
