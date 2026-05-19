// controllers/taskController.js — SQLite compatible
const { query } = require('../utils/db');

exports.getTasks = async (req, res) => {
  try {
    const { team_id } = req.params;
    const tasks = await query(
      `SELECT t.*,u.full_name AS assignee_name,u.avatar_url AS assignee_avatar,
              c.full_name AS creator_name
       FROM Tasks t
       LEFT JOIN Users u ON u.id=t.assigned_to
       LEFT JOIN Users c ON c.id=t.created_by
       WHERE t.team_id=? ORDER BY t.created_at DESC`, [team_id]);
    const grouped = { todo:[], in_progress:[], review:[], done:[], blocked:[] };
    tasks.forEach(t => { if (grouped[t.status]) grouped[t.status].push(t); });
    res.json({ tasks, grouped });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTask = async (req, res) => {
  try {
    const { team_id } = req.params;
    const { title, description, priority, assigned_to, due_date, tags, xp_reward, story_points } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const result = await query(
      `INSERT INTO Tasks (team_id,title,description,priority,assigned_to,created_by,due_date,tags,xp_reward,story_points)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [team_id, title, description||null, priority||'medium', assigned_to||null, req.user.id,
       due_date||null, tags ? JSON.stringify(tags) : null, xp_reward||10, story_points||1]);
    const [task] = await query(
      'SELECT t.*,u.full_name AS assignee_name FROM Tasks t LEFT JOIN Users u ON u.id=t.assigned_to WHERE t.id=?',
      [result.insertId]);
    if (assigned_to && String(assigned_to) !== String(req.user.id)) {
      await query('INSERT INTO Notifications (user_id,team_id,type,title,body) VALUES (?,?,?,?,?)',
        [assigned_to, team_id, 'task', 'New Task Assigned 📋', `You've been assigned: ${title}`]);
    }
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    // Award XP if task is being completed
    const [existing] = await query('SELECT status, assigned_to, xp_reward, team_id FROM Tasks WHERE id=?', [id]);
    if (existing && status === 'done' && existing.status !== 'done' && existing.assigned_to) {
      await query('UPDATE Users SET xp_points=xp_points+? WHERE id=?', [existing.xp_reward || 10, existing.assigned_to]);
      await query('UPDATE TeamMembers SET contribution_score=contribution_score+1 WHERE user_id=? AND team_id=?',
        [existing.assigned_to, existing.team_id]);
      await query('INSERT INTO Notifications (user_id,team_id,type,title,body) VALUES (?,?,?,?,?)',
        [existing.assigned_to, existing.team_id, 'achievement', 'Task Completed! 🎉',
         `You earned +${existing.xp_reward || 10} XP`]);
    }
    await query(
      'UPDATE Tasks SET title=?,description=?,status=?,priority=?,assigned_to=?,due_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [title, description, status, priority, assigned_to||null, due_date||null, id]);
    const [task] = await query(
      'SELECT t.*,u.full_name AS assignee_name,u.avatar_url AS assignee_avatar FROM Tasks t LEFT JOIN Users u ON u.id=t.assigned_to WHERE t.id=?',
      [id]);
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTask = async (req, res) => {
  try {
    await query('DELETE FROM Tasks WHERE id=?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.moveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const [existing] = await query('SELECT * FROM Tasks WHERE id=?', [id]);
    if (existing && status === 'done' && existing.status !== 'done' && existing.assigned_to) {
      await query('UPDATE Users SET xp_points=xp_points+? WHERE id=?', [existing.xp_reward || 10, existing.assigned_to]);
      await query('UPDATE TeamMembers SET contribution_score=contribution_score+1 WHERE user_id=? AND team_id=?',
        [existing.assigned_to, existing.team_id]);
    }
    await query('UPDATE Tasks SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, id]);
    const [task] = await query(
      'SELECT t.*,u.full_name AS assignee_name FROM Tasks t LEFT JOIN Users u ON u.id=t.assigned_to WHERE t.id=?',
      [id]);
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
