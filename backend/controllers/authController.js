// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../utils/db');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    if (!username || !email || !password || !full_name)
      return res.status(400).json({ error: 'All fields required' });

    const exists = await query('SELECT id FROM Users WHERE email=? OR username=?', [email, username]);
    if (exists.length) return res.status(409).json({ error: 'Email or username already taken' });

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO Users (username,email,password_hash,full_name) VALUES (?,?,?,?)',
      [username, email, hash, full_name]
    );
    const user = { id: result.insertId, username, email, full_name, role: 'member', xp_points: 0 };
    await query('INSERT INTO Achievements (user_id,badge_name,badge_icon,xp_bonus,description) VALUES (?,?,?,?,?)',
      [user.id, 'First Login', '🌟', 25, 'Welcome to SyncSphere!']);
    await query('UPDATE Users SET xp_points=xp_points+25 WHERE id=?', [user.id]);

    res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const [user] = await query('SELECT * FROM Users WHERE email=?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    await query("UPDATE Users SET is_online=1, last_seen=datetime('now') WHERE id=?", [user.id]);
    delete user.password_hash;
    res.json({ token: signToken(user.id), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const [user] = await query(
      'SELECT id,username,email,full_name,avatar_url,role,bio,skills,xp_points,streak_days,theme_pref,created_at FROM Users WHERE id=?',
      [req.user.id]
    );
    const teams = await query(
      `SELECT t.*,tm.role_tag FROM Teams t JOIN TeamMembers tm ON tm.team_id=t.id WHERE tm.user_id=?`,
      [req.user.id]
    );
    const badges = await query('SELECT * FROM Achievements WHERE user_id=? ORDER BY earned_at DESC LIMIT 10', [req.user.id]);
    res.json({ user, teams, badges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  await query("UPDATE Users SET is_online=0, last_seen=datetime('now') WHERE id=?", [req.user.id]);
  res.json({ message: 'Logged out' });
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, bio, skills, theme_pref } = req.body;
    await query("UPDATE Users SET full_name=?,bio=?,skills=?,theme_pref=?,updated_at=datetime('now') WHERE id=?",
      [full_name, bio, JSON.stringify(skills), theme_pref, req.user.id]);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await query(
      `SELECT t.*, teams.name as team_name 
       FROM Tasks t 
       JOIN Teams teams ON t.team_id = teams.id
       WHERE t.assigned_to=? AND t.status != 'done'
       ORDER BY CASE t.status
         WHEN 'blocked' THEN 1
         WHEN 'in_progress' THEN 2
         WHEN 'review' THEN 3
         WHEN 'todo' THEN 4
         ELSE 5
       END, t.due_date ASC`,
      [req.user.id]
    );
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    // Only allow admins to view audit logs
    const [user] = await query('SELECT role FROM Users WHERE id=?', [req.user.id]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    const logs = await query(
      `SELECT a.*, u.full_name, u.username, u.avatar_url, t.name as team_name
       FROM ActivityLogs a
       JOIN Users u ON a.user_id = u.id
       LEFT JOIN Teams t ON a.team_id = t.id
       ORDER BY a.created_at DESC LIMIT 30`
    );
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


