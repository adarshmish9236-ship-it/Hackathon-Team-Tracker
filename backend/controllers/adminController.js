// controllers/adminController.js — God-Level Admin Management Controls
const { query } = require('../utils/db');
const os = require('os'); // For simulated system telemetry

exports.getAllUsers = async (req, res) => {
  try {
    const users = await query(
      `SELECT id, username, email, full_name, role, avatar_url, xp_points, streak_days, is_online, created_at,
        (SELECT COUNT(*) FROM TeamMembers WHERE user_id = Users.id) as team_count
       FROM Users
       ORDER BY created_at DESC`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await query('UPDATE Users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await query(
      `SELECT t.*, u.full_name as owner_name, u.username as owner_username,
        (SELECT COUNT(*) FROM TeamMembers WHERE team_id = t.id) as member_count,
        (SELECT COUNT(*) FROM Tasks WHERE team_id = t.id) as task_count
       FROM Teams t
       LEFT JOIN Users u ON t.owner_id = u.id
       ORDER BY t.created_at DESC`
    );
    res.json(teams);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Teams WHERE id = ?', [id]);
    res.json({ message: 'Team deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── NEW GOD-LEVEL ENDPOINTS ──

exports.getTelemetry = async (req, res) => {
  try {
    const [uCount] = await query('SELECT COUNT(*) as c FROM Users');
    const [tCount] = await query('SELECT COUNT(*) as c FROM Teams');
    const [taskCount] = await query('SELECT COUNT(*) as c FROM Tasks WHERE status="done"');
    
    // Simulate CPU and Memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPerc = ((totalMem - freeMem) / totalMem) * 100;
    
    res.json({
      users: uCount.c,
      teams: tCount.c,
      tasksCompleted: taskCount.c,
      uptime: process.uptime(),
      memoryUsage: usedMemPerc.toFixed(2),
      cpuLoad: (Math.random() * 40 + 10).toFixed(2), // simulated
      activeSockets: Math.floor(Math.random() * 500 + 100), // simulated
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getThreats = async (req, res) => {
  try {
    const threats = await query('SELECT * FROM ThreatLogs ORDER BY created_at DESC LIMIT 50');
    res.json(threats);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getDatabaseStats = async (req, res) => {
  try {
    const stats = {
      size: '24.5 MB',
      tables: 15,
      queriesPerSecond: Math.floor(Math.random() * 200 + 50),
      health: '99.9%',
    };
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await query('SELECT * FROM SystemSettings');
    const config = {};
    settings.forEach(s => config[s.setting_key] = s.setting_value);
    res.json(config);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    await query('UPDATE SystemSettings SET setting_value = ? WHERE setting_key = ?', [value, key]);
    res.json({ message: 'Setting updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Note: Broadcast is handled via Socket.IO directly or a POST that triggers io.emit
exports.broadcast = async (req, res) => {
  try {
    const { message, severity } = req.body;
    const io = req.app.get('io');
    if (io) {
      io.emit('global-broadcast', { message, severity, timestamp: new Date() });
      await query('INSERT INTO ActivityLogs (user_id, action, meta) VALUES (?, ?, ?)', [req.user.id, 'global_broadcast', message]);
      res.json({ success: true, message: 'Broadcast dispatched' });
    } else {
      res.status(500).json({ error: 'Socket engine offline' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
};
