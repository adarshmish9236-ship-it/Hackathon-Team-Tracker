// controllers/adminController.js — God-Level Admin Management Controls
const { query } = require('../utils/db');
const os = require('os'); // For simulated system telemetry

// ── AUTO-TABLE INITIALIZATION FOR SQLITE ──
const initTables = async () => {
  try {
    // 1. Create Hackathons Table
    await query(`
      CREATE TABLE IF NOT EXISTS Hackathons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        theme TEXT,
        status TEXT DEFAULT 'Registration Open',
        deadline DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Hackathons if empty
    const hackCount = await query('SELECT COUNT(*) as c FROM Hackathons');
    if (hackCount[0].c === 0) {
      await query(`
        INSERT INTO Hackathons (name, theme, status, deadline) VALUES
        ('Global AI Challenge 2026', 'Artificial Intelligence', 'Registration Open', '2026-10-15 00:00:00'),
        ('Web3 Innovators', 'Blockchain & Web3', 'Ongoing', '2026-09-30 00:00:00'),
        ('EcoTech Sprint', 'Sustainability', 'Evaluating', '2026-09-10 00:00:00')
      `);
      console.log('✅ Seeded Hackathons table with defaults.');
    }

    // 2. Create Submissions Table
    await query(`
      CREATE TABLE IF NOT EXISTS Submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL UNIQUE,
        project_name TEXT NOT NULL,
        description TEXT,
        repo_url TEXT,
        demo_url TEXT,
        status TEXT DEFAULT 'Submitted',
        judge_assigned TEXT DEFAULT NULL,
        score REAL DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE
      )
    `);

    // Seed Submissions if empty
    const subCount = await query('SELECT COUNT(*) as c FROM Submissions');
    if (subCount[0].c === 0) {
      const teams = await query('SELECT id FROM Teams ORDER BY id LIMIT 5');
      if (teams.length >= 5) {
        const dummySubmissions = [
          [teams[0].id, 'AI Health Companion', 'An intelligent companion for remote diagnostic mapping.', 'github.com/nebula/ai-health', 'demo.nebula.io', 'Submitted', null, null],
          [teams[1].id, 'DeFi Yield Optimizer', 'Automatic cross-chain yield farming strategy aggregator.', 'github.com/phoenix/yield-opt', 'phoenix.finance', 'Under Review', 'Dr. Sarah Jenkins', null],
          [teams[2].id, 'Carbon Tracker IoT', 'IoT mesh networks measuring soil greenhouse gas emissions.', 'github.com/quantum/carbon-track', 'green.quantum.io', 'Evaluated', 'Prof. Alan Turing', 94.8],
          [teams[3].id, 'Cyber Shield DNS', 'Zero-trust decentralized DNS verification framework.', 'github.com/cyber/dns-shield', 'shield.cyber.net', 'Submitted', null, null],
          [teams[4].id, 'NFT Ticket Master', 'Decentralized event verification using proof-of-ownership.', 'github.com/byte/nft-tickets', 'tickets.byte.com', 'Under Review', 'Vitalik Buterin', null]
        ];

        for (const sub of dummySubmissions) {
          await query(`
            INSERT INTO Submissions (team_id, project_name, description, repo_url, demo_url, status, judge_assigned, score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, sub);
        }
        console.log('✅ Seeded Submissions table with defaults.');
      }
    }

    // 3. Create IncidentLogs Table
    await query('DROP TABLE IF EXISTS IncidentLogs');
    await query(`
      CREATE TABLE IF NOT EXISTS IncidentLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        target TEXT NOT NULL,
        reportedBy TEXT,
        status TEXT DEFAULT 'Pending',
        time TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed IncidentLogs if empty
    const incCount = await query('SELECT COUNT(*) as c FROM IncidentLogs');
    if (incCount[0].c === 0) {
      await query(`
        INSERT INTO IncidentLogs (type, target, reportedBy, status, time) VALUES
        ('Spam', 'User: Eve Hacker', 'Alice Wong', 'Pending', '1 hour ago'),
        ('Misconduct', 'Team: Null Pointers', 'System', 'Investigating', '5 hours ago'),
        ('Inappropriate Content', 'Submission: Crypto Analyzer', 'Charlie Day', 'Resolved', '1 day ago')
      `);
      console.log('✅ Seeded IncidentLogs table with defaults.');
    }
  } catch (err) {
    console.error('❌ Failed to initialize Admin Tables:', err.message);
  }
};

// Run initialization immediately on import
initTables();

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

// ── TELEMETRY & SYSTEM UTILITIES ──

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
    const threats = await query('SELECT * FROM ThreatLogs ORDER BY created_at DESC LIMIT 50').catch(() => []);
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
    const settings = await query('SELECT * FROM SystemSettings').catch(() => []);
    const config = {};
    settings.forEach(s => config[s.setting_key] = s.setting_value);
    res.json(config);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    await query('UPDATE SystemSettings SET setting_value = ? WHERE setting_key = ?', [value, key]).catch(() => {});
    res.json({ message: 'Setting updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── BROADCASTS & NOTIFICATIONS ──

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

exports.notify = async (req, res) => {
  try {
    const { target, team_id, user_id, message } = req.body;
    const io = req.app.get('io');
    
    if (target === 'global') {
      const users = await query('SELECT id FROM Users');
      if (users.length > 0) {
        // Construct SQLite-compliant batch insert
        const placeholders = users.map(() => '(?, NULL, "system", "Admin Announcement", ?)').join(', ');
        const flatParams = [];
        users.forEach(u => {
          flatParams.push(u.id, message);
        });
        await query(`INSERT INTO Notifications (user_id, team_id, type, title, body) VALUES ${placeholders}`, flatParams);
      }
      if (io) io.emit('new-message'); // trigger UI refresh everywhere
    } else if (target === 'teams' && team_id) {
      const users = await query('SELECT user_id FROM TeamMembers WHERE team_id = ?', [team_id]);
      if (users.length > 0) {
        // Construct SQLite-compliant batch insert
        const placeholders = users.map(() => '(?, ?, "system", "Admin Announcement", ?)').join(', ');
        const flatParams = [];
        users.forEach(u => {
          flatParams.push(u.user_id, team_id, message);
        });
        await query(`INSERT INTO Notifications (user_id, team_id, type, title, body) VALUES ${placeholders}`, flatParams);
      }
      if (io) io.to(`team:${team_id}`).emit('new-message'); // Correct Socket.IO room syntax
    } else if (target === 'user' && user_id) {
      await query(
        'INSERT INTO Notifications (user_id, team_id, type, title, body) VALUES (?, NULL, "system", "Admin Announcement", ?)',
        [user_id, message]
      );
      if (io) io.emit('new-message'); // trigger UI refresh
    }
    
    await query('INSERT INTO ActivityLogs (user_id, action, meta) VALUES (?, ?, ?)', [req.user.id, 'admin_notify', JSON.stringify({ target, team_id, user_id, message })]);
    
    res.json({ success: true, message: 'Notification dispatched' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── NEW HACKATHON CRUD ENDPOINTS ──

exports.getAllHackathons = async (req, res) => {
  try {
    const h = await query(`
      SELECT h.*, 
        (SELECT COUNT(*) FROM Teams WHERE hackathon_name = h.name) as team_count
      FROM Hackathons h
      ORDER BY h.created_at DESC
    `);
    res.json(h);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createHackathon = async (req, res) => {
  try {
    const { name, theme, status, deadline } = req.body;
    const result = await query(
      'INSERT INTO Hackathons (name, theme, status, deadline) VALUES (?, ?, ?, ?)',
      [name, theme || null, status || 'Registration Open', deadline || null]
    );
    res.json({ message: 'Hackathon created successfully', id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, theme, status, deadline } = req.body;
    await query(
      'UPDATE Hackathons SET name = ?, theme = ?, status = ?, deadline = ? WHERE id = ?',
      [name, theme, status, deadline, id]
    );
    res.json({ message: 'Hackathon updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Hackathons WHERE id = ?', [id]);
    res.json({ message: 'Hackathon deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── NEW SUBMISSIONS & EVALUATION ENDPOINTS ──

exports.getAllSubmissions = async (req, res) => {
  try {
    const s = await query(`
      SELECT 
        t.id as id,
        t.name as team_name,
        t.hackathon_name as track,
        s.id as submission_id,
        s.project_name,
        s.repo_url,
        COALESCE(s.status, 'Missing') as status,
        s.judge_assigned,
        s.score,
        s.created_at as time
      FROM Teams t
      LEFT JOIN Submissions s ON s.team_id = t.id
      ORDER BY s.created_at DESC, t.id ASC
    `);
    res.json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.assignJudge = async (req, res) => {
  try {
    const { id } = req.params; // team_id
    const { judge_assigned } = req.body;
    
    const existing = await query('SELECT id FROM Submissions WHERE team_id = ?', [id]);
    
    if (existing.length > 0) {
      await query(
        "UPDATE Submissions SET judge_assigned = ?, status = 'Under Review' WHERE team_id = ?",
        [judge_assigned, id]
      );
    } else {
      await query(
        "INSERT INTO Submissions (team_id, project_name, repo_url, status, judge_assigned) VALUES (?, ?, ?, ?, ?)",
        [id, 'SyncSphere Hackathon Project', 'github.com/syncsphere/submission', 'Under Review', judge_assigned]
      );
    }
    
    res.json({ message: 'Judge assigned successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── NEW PAGINATED ACTIVITY LOGS ENDPOINT ──

exports.getAllActivities = async (req, res) => {
  try {
    const search = req.query.search || '';
    const type = req.query.type || 'all';
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    let sql = `
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.meta,
        al.created_at as time,
        u.full_name as user,
        COALESCE(t.name, 'Platform Global') as team
      FROM ActivityLogs al
      JOIN Users u ON al.user_id = u.id
      LEFT JOIN Teams t ON al.team_id = t.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (search) {
      conditions.push('(u.full_name LIKE ? OR t.name LIKE ? OR al.action LIKE ? OR al.meta LIKE ?)');
      const likeVal = `%${search}%`;
      params.push(likeVal, likeVal, likeVal, likeVal);
    }
    
    if (type !== 'all') {
      conditions.push('al.action = ?');
      params.push(type);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const logs = await query(sql, params);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, hackathon_name, deadline, status } = req.body;
    await query(
      'UPDATE Teams SET name = ?, description = ?, hackathon_name = ?, deadline = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, hackathon_name, deadline, status, id]
    );
    res.json({ message: 'Team updated successfully by Admin' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.toggleFreezeTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const [team] = await query('SELECT status FROM Teams WHERE id = ?', [id]);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const newStatus = team.status === 'archived' ? 'active' : 'archived';
    await query('UPDATE Teams SET status = ? WHERE id = ?', [newStatus, id]);
    res.json({ message: `Team status set to ${newStatus}`, status: newStatus });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllIncidents = async (req, res) => {
  try {
    const incidents = await query('SELECT * FROM IncidentLogs ORDER BY created_at DESC');
    res.json(incidents);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await query('UPDATE IncidentLogs SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Incident status updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM IncidentLogs WHERE id = ?', [id]);
    res.json({ message: 'Incident deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

