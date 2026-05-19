// middleware/auth.js — JWT authentication middleware
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await query('SELECT id,username,email,full_name,role,avatar_url,xp_points,theme_pref FROM Users WHERE id=?', [decoded.id]);
    if (!users.length) return res.status(401).json({ error: 'User not found' });
    req.user = users[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { auth, adminOnly };
