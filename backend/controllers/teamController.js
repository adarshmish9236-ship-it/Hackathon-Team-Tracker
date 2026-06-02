// controllers/teamController.js — SQLite compatible
const { query } = require('../utils/db');
const bcrypt = require('bcryptjs');
const { ensureTeamDummyData } = require('./analyticsController');

const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();


exports.createTeam = async (req, res) => {
  try {
    const { name, description, hackathon_name, deadline, max_members, leaderDetails, members, registration_fee, is_fee_paid } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name required' });
    const invite_code = generateCode();
    
    // Create Team
    const result = await query(
      'INSERT INTO Teams (name,description,invite_code,hackathon_name,deadline,owner_id,max_members,registration_fee,is_fee_paid) VALUES (?,?,?,?,?,?,?,?,?)',
      [name, description||null, invite_code, hackathon_name||null, deadline||null, req.user.id, max_members||10, registration_fee||0.00, is_fee_paid||0]);
    const teamId = result.insertId;

    // Process Leader
    let leadRole = 'lead';
    if (leaderDetails) {
      leadRole = leaderDetails.role || 'lead';
      // github/linkedin fields not in SQLite schema — skipping profile update
    }
    await query('INSERT INTO TeamMembers (team_id,user_id,role_tag) VALUES (?,?,?)',
      [teamId, req.user.id, leadRole]);
    await query('INSERT INTO ActivityLogs (user_id,team_id,action,entity_type,entity_id) VALUES (?,?,?,?,?)',
      [req.user.id, teamId, 'team_created', 'Team', teamId]);

    // Process additional members if any
    if (members && Array.isArray(members)) {
      for (const m of members) {
        if (!m.email || !m.name) continue;
        let [existingUser] = await query('SELECT id FROM Users WHERE email=?', [m.email]);
        let memberUserId;
        if (existingUser) {
          memberUserId = existingUser.id;
          // github/linkedin fields not in SQLite schema — skipping profile update
        } else {
          // Create placeholder account
          const hash = await bcrypt.hash('Hackathon123!', 10);
          const username = m.email.split('@')[0] + Math.floor(Math.random()*1000);
          const uRes = await query(
            'INSERT INTO Users (username,email,password_hash,full_name) VALUES (?,?,?,?)',
            [username, m.email, hash, m.name]
          );
          memberUserId = uRes.insertId;
        }
        await query('INSERT INTO TeamMembers (team_id,user_id,role_tag) VALUES (?,?,?)',
          [teamId, memberUserId, m.role || 'member']);
      }
    }

    const [team] = await query('SELECT * FROM Teams WHERE id=?', [teamId]);
    res.status(201).json(team);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.joinTeam = async (req, res) => {
  try {
    const { invite_code } = req.body;
    const [team] = await query('SELECT * FROM Teams WHERE invite_code=?', [invite_code]);
    if (!team) return res.status(404).json({ error: 'Invalid invite code' });
    const already = await query('SELECT id FROM TeamMembers WHERE team_id=? AND user_id=?', [team.id, req.user.id]);
    if (already.length) return res.status(409).json({ error: 'Already a member' });
    const [count] = await query('SELECT COUNT(*) as c FROM TeamMembers WHERE team_id=?', [team.id]);
    if (count.c >= team.max_members) return res.status(400).json({ error: 'Team is full' });
    await query('INSERT INTO TeamMembers (team_id,user_id) VALUES (?,?)', [team.id, req.user.id]);
    await query('INSERT INTO Notifications (user_id,team_id,type,title,body) VALUES (?,?,?,?,?)',
      [team.owner_id, team.id, 'system', 'New member joined!',
       `${req.user.full_name} joined your team "${team.name}"`]);
    await query('INSERT INTO ActivityLogs (user_id,team_id,action,entity_type,entity_id) VALUES (?,?,?,?,?)',
      [req.user.id, team.id, 'team_joined', 'Team', team.id]);
    res.json({ team, message: 'Joined team successfully!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getTeam = async (req, res) => {
  try {
    const { id } = req.params;
    await ensureTeamDummyData(id);
    const [team] = await query('SELECT * FROM Teams WHERE id=?', [id]);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const members = await query(
      `SELECT u.id,u.username,u.full_name,u.avatar_url,u.is_online,u.xp_points,
              tm.role_tag,tm.contribution_score,tm.joined_at
       FROM Users u JOIN TeamMembers tm ON tm.user_id=u.id
       WHERE tm.team_id=? AND tm.is_active=1`, [id]);
    const analytics = await query('SELECT * FROM vw_team_analytics WHERE team_id=?', [id]);
    res.json({ team, members, analytics: analytics[0] || {} });
  } catch (err) { res.status(500).json({ error: err.message }); }
};


exports.getMyTeams = async (req, res) => {
  try {
    const teams = await query(
      `SELECT t.*,tm.role_tag,
        (SELECT COUNT(*) FROM TeamMembers WHERE team_id=t.id AND is_active=1) AS member_count
       FROM Teams t JOIN TeamMembers tm ON tm.team_id=t.id
       WHERE tm.user_id=? AND tm.is_active=1`,
      [req.user.id]);

    for (const team of teams) {
      await ensureTeamDummyData(team.id);
    }

    for (const team of teams) {
      const [counts] = await query(
        `SELECT 
          (SELECT COUNT(*) FROM Tasks WHERE team_id=? AND status='done') AS tasks_done,
          (SELECT COUNT(*) FROM Tasks WHERE team_id=?) AS tasks_total`,
        [team.id, team.id]
      );
      team.tasks_done = counts.tasks_done || 0;
      team.tasks_total = counts.tasks_total || 0;
    }

    res.json(teams);
  } catch (err) { res.status(500).json({ error: err.message }); }
};


exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const [team] = await query('SELECT owner_id FROM Teams WHERE id=?', [id]);
    if (!team || team.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const { name, description, hackathon_name, deadline, status, registration_fee, is_fee_paid } = req.body;
    await query(
      'UPDATE Teams SET name=?,description=?,hackathon_name=?,deadline=?,status=?,registration_fee=?,is_fee_paid=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [name, description, hackathon_name, deadline, status, registration_fee||0.00, is_fee_paid||0, id]);
    res.json({ message: 'Team updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { team_id } = req.params;
    const rows = await query('SELECT * FROM vw_leaderboard WHERE team_id=? LIMIT 20', [team_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { team_id, user_id } = req.params;
    const { role_tag } = req.body;
    await query('UPDATE TeamMembers SET role_tag=? WHERE team_id=? AND user_id=?', [role_tag, team_id, user_id]);
    res.json({ message: 'Role updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.payRegistrationFee = async (req, res) => {
  try {
    const { id } = req.params;
    const [team] = await query('SELECT owner_id, registration_fee FROM Teams WHERE id=?', [id]);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    
    await query('UPDATE Teams SET is_fee_paid = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    
    await query(
      'INSERT INTO ActivityLogs (user_id, team_id, action, entity_type, entity_id, meta) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, id, 'fee_paid', 'Team', id, JSON.stringify({ amount: team.registration_fee })]
    );

    res.json({ message: 'Registration fee paid successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
