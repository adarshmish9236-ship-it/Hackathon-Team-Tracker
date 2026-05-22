// controllers/pollController.js — SQLite compatible
const { query } = require('../utils/db');

exports.getPolls = async (req, res) => {
  try {
    const { team_id } = req.params;
    const polls = await query(
      `SELECT p.*,u.full_name AS creator_name
       FROM Polls p JOIN Users u ON u.id=p.created_by
       WHERE p.team_id=? ORDER BY p.created_at DESC`, [team_id]);
    // Attach votes for each poll using SQLite-compatible query
    for (const poll of polls) {
      const votes = await query(
        'SELECT user_id, option_idx FROM Votes WHERE poll_id=?', [poll.id]);
      poll.votes_data = JSON.stringify(votes);
    }
    res.json(polls);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createPoll = async (req, res) => {
  try {
    const { team_id } = req.params;
    const { question, options, expires_at } = req.body;
    if (!question || !options?.length) return res.status(400).json({ error: 'Question and options required' });
    const result = await query(
      'INSERT INTO Polls (team_id,created_by,question,options,expires_at) VALUES (?,?,?,?,?)',
      [team_id, req.user.id, question, JSON.stringify(options), expires_at||null]);
    
    // Log in ActivityLogs
    await query('INSERT INTO ActivityLogs (user_id, team_id, action, entity_type, entity_id, meta) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, team_id, 'poll_created', 'Poll', result.insertId, JSON.stringify({ message: question })]);

    res.status(201).json({ id: result.insertId, message: 'Poll created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.vote = async (req, res) => {
  try {
    const { poll_id } = req.params;
    const { option_idx } = req.body;
    // SQLite: INSERT OR REPLACE for upsert
    const existing = await query('SELECT id FROM Votes WHERE poll_id=? AND user_id=?', [poll_id, req.user.id]);
    if (existing.length) {
      await query('UPDATE Votes SET option_idx=? WHERE poll_id=? AND user_id=?', [option_idx, poll_id, req.user.id]);
    } else {
      await query('INSERT INTO Votes (poll_id,user_id,option_idx) VALUES (?,?,?)', [poll_id, req.user.id, option_idx]);
    }
    const votes = await query('SELECT option_idx,COUNT(*) as count FROM Votes WHERE poll_id=? GROUP BY option_idx', [poll_id]);
    res.json({ votes, message: 'Vote recorded' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifs = await query(
      'SELECT * FROM Notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30', [req.user.id]);
    const [unread] = await query('SELECT unread_count FROM vw_unread_notifications WHERE user_id=?', [req.user.id]);
    res.json({ notifications: notifs, unread_count: unread?.unread_count || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.markRead = async (req, res) => {
  try {
    await query('UPDATE Notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.triggerSOS = async (req, res) => {
  try {
    const { team_id } = req.params;
    const { message, severity } = req.body;
    const result = await query(
      'INSERT INTO SOSAlerts (team_id,triggered_by,message,severity) VALUES (?,?,?,?)',
      [team_id, req.user.id, message||'Emergency help needed!', severity||'high']);
    
    // Log in ActivityLogs
    await query('INSERT INTO ActivityLogs (user_id, team_id, action, entity_type, entity_id, meta) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, team_id, 'sos_triggered', 'SOS', result.insertId, JSON.stringify({ message: message || 'Emergency help needed!' })]);

    // Notify all team members
    const members = await query(
      'SELECT user_id FROM TeamMembers WHERE team_id=? AND user_id!=? AND is_active=1',
      [team_id, req.user.id]);
    for (const m of members) {
      await query('INSERT INTO Notifications (user_id,team_id,type,title,body) VALUES (?,?,?,?,?)',
        [m.user_id, team_id, 'sos', '🆘 SOS Alert!', message || 'Emergency help needed!']);
    }
    res.status(201).json({ id: result.insertId, message: 'SOS Alert sent to all team members!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSOSAlerts = async (req, res) => {
  try {
    const { team_id } = req.params;
    const alerts = await query(
      `SELECT sa.*,u.full_name AS triggered_by_name
       FROM SOSAlerts sa JOIN Users u ON u.id=sa.triggered_by
       WHERE sa.team_id=? ORDER BY sa.created_at DESC LIMIT 10`, [team_id]);
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.resolveSOSAlert = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE SOSAlerts SET is_resolved=1,resolved_by=?,resolved_at=CURRENT_TIMESTAMP WHERE id=?',
      [req.user.id, id]);
    res.json({ message: 'SOS resolved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
