// controllers/analyticsController.js — SQLite compatible + AI Engine
const { query } = require('../utils/db');

// ── Helper: inline productivity calculator (replaces MySQL stored procedure) ──
async function calcProductivityInline(user_id, team_id) {
  const [taskRow] = await query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done
     FROM Tasks
     WHERE assigned_to=? AND team_id=?
     AND created_at >= datetime('now', '-7 days')`, [user_id, team_id]);

  const [attRow] = await query(
    `SELECT COALESCE(SUM(duration_mins),0) AS mins
     FROM Attendance
     WHERE user_id=? AND team_id=?
     AND check_in >= datetime('now', '-7 days')`, [user_id, team_id]).catch(() => [{ mins: 0 }]);

  const [chatRow] = await query(
    `SELECT COUNT(*) AS cnt FROM Chats
     WHERE sender_id=? AND team_id=?
     AND created_at >= datetime('now', '-7 days')`, [user_id, team_id]);

  const task_score   = taskRow.total > 0 ? Math.round((taskRow.done / taskRow.total) * 100) : 0;
  const att_score    = Math.min(Math.round(((attRow?.mins || 0) / 60 / 8) * 100), 100);
  const chat_score   = Math.min(chatRow.cnt, 100);
  const overall      = Math.round(task_score * 0.4 + att_score * 0.3 + chat_score * 0.3);
  const burnout_risk = overall < 30 ? 'high' : overall < 60 ? 'medium' : 'low';

  // Upsert productivity score
  const existing = await query(
    'SELECT id FROM ProductivityScores WHERE user_id=? AND team_id=?', [user_id, team_id]);
  if (existing.length) {
    await query(
      `UPDATE ProductivityScores SET tasks_score=?,attendance_score=?,chat_score=?,
       overall_score=?,burnout_risk=?,calculated_at=CURRENT_TIMESTAMP
       WHERE user_id=? AND team_id=?`,
      [task_score, att_score, chat_score, overall, burnout_risk, user_id, team_id]);
  } else {
    await query(
      `INSERT INTO ProductivityScores (user_id,team_id,tasks_score,attendance_score,chat_score,overall_score,burnout_risk)
       VALUES (?,?,?,?,?,?,?)`,
      [user_id, team_id, task_score, att_score, chat_score, overall, burnout_risk]);
  }
  return { task_score, att_score, chat_score, overall, burnout_risk };
}

// ── Helper: update team health score ─────────────────────────────────────────
async function updateTeamHealth(team_id) {
  const [overdue] = await query(
    `SELECT COUNT(*) AS c FROM Tasks
     WHERE team_id=? AND due_date < datetime('now') AND status != 'done'`, [team_id]);
  const [inactive] = await query(
    `SELECT COUNT(*) AS c FROM TeamMembers tm
     WHERE tm.team_id=?
     AND NOT EXISTS (
       SELECT 1 FROM ActivityLogs al
       WHERE al.user_id=tm.user_id AND al.team_id=?
       AND al.created_at >= datetime('now','-2 days'))`, [team_id, team_id]);
  const [avgProd] = await query(
    'SELECT COALESCE(AVG(overall_score),50) AS avg FROM ProductivityScores WHERE team_id=?', [team_id]);

  const health = Math.max(0, Math.min(100,
    100 - (overdue.c * 5) - (inactive.c * 10) + ((avgProd.avg - 50) * 0.3)));
  await query('UPDATE Teams SET health_score=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [Math.round(health), team_id]);
  return health;
}

// ── Helper: ensure team has high-fidelity dummy data ──────────────────────────
async function ensureTeamDummyData(team_id) {
  try {
    const [taskCount] = await query('SELECT COUNT(*) as c FROM Tasks WHERE team_id = ?', [team_id]);
    if (taskCount.c > 0) return; // Team already has tasks, no need to seed

    console.log(`🌱 Auto-seeding premium dummy data for team ${team_id}...`);

    const members = await query('SELECT user_id, role_tag FROM TeamMembers WHERE team_id = ?', [team_id]);
    if (members.length === 0) return;

    const leadUser = members.find(m => m.role_tag === 'lead') || members[0];
    const leadUserId = leadUser.user_id;

    // 1. Seed Tasks
    const sampleTasks = [
      { title: 'Setup Git Repo & CI/CD pipeline', desc: 'Initialize git repository, configure branching strategy, and setup GitHub Actions workflow for auto-deployment.', status: 'done', priority: 'high', role: 'backend', ageDays: 12, compDays: 10 },
      { title: 'Design Figma Mockups & Wireframes', desc: 'Create high-fidelity mobile and desktop designs with glassmorphic aesthetics.', status: 'done', priority: 'critical', role: 'designer', ageDays: 11, compDays: 9 },
      { title: 'Create Database schema & migrations', desc: 'Design ERD, configure SQLite relations, and write initial seed scripts.', status: 'done', priority: 'high', role: 'backend', ageDays: 10, compDays: 8 },
      { title: 'Implement JWT Authentication & Session', desc: 'Secure backend routes with stateless JSON Web Tokens and refresh system.', status: 'done', priority: 'medium', role: 'backend', ageDays: 8, compDays: 6 },
      { title: 'Develop Landing page & navigation layout', desc: 'Build reactive, premium hero sections and dynamic sidebar layouts.', status: 'done', priority: 'high', role: 'frontend', ageDays: 7, compDays: 5 },
      { title: 'Build Team Collaboration Board (Kanban)', desc: 'Implement drag-and-drop workflow lanes matching task status changes.', status: 'in_progress', priority: 'critical', role: 'frontend', ageDays: 5 },
      { title: 'Integrate Socket.io chat server', desc: 'Provide low-latency workspace chat channels and user typing indicators.', status: 'in_progress', priority: 'medium', role: 'frontend', ageDays: 4 },
      { title: 'Write unit tests for Auth service', desc: 'Achieve 80% coverage on authentication controllers and routing pipelines.', status: 'todo', priority: 'low', role: 'debugger', ageDays: 3 },
      { title: 'Optimize API response payload caching', desc: 'Eliminate duplicate SQL queries using simple Redis or memory caches.', status: 'blocked', priority: 'medium', role: 'debugger', ageDays: 2 },
      { title: 'Prepare presentation slide deck', desc: 'Outline product architecture, value proposition, and live-demo scenarios.', status: 'todo', priority: 'high', role: 'lead', ageDays: 1 }
    ];

    for (const t of sampleTasks) {
      const assigned = members.find(m => m.role_tag === t.role) || members[Math.floor(Math.random() * members.length)];
      const assignedId = assigned.user_id;

      const createdVal = `datetime('now', '-${t.ageDays} days')`;
      const dueVal = `datetime('now', '+${14 - t.ageDays} days')`;
      const compVal = t.compDays ? `datetime('now', '-${t.compDays} days')` : 'NULL';

      await query(
        `INSERT INTO Tasks (team_id, title, description, status, priority, assigned_to, created_by, due_date, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ${dueVal}, ${compVal}, ${createdVal}, ${createdVal})`,
        [team_id, t.title, t.desc, t.status, t.priority, assignedId, leadUserId]
      );
    }

    // 2. Seed Attendance
    for (const m of members) {
      for (let day = 1; day <= 5; day++) {
        const checkIn = `datetime('now', '-${day} days', '-8 hours')`;
        const checkOut = `datetime('now', '-${day} days')`;
        const duration = 480; // 8 hours
        await query(
          `INSERT INTO Attendance (team_id, user_id, check_in, check_out, duration_mins)
           VALUES (?, ?, ${checkIn}, ${checkOut}, ?)`,
          [team_id, m.user_id, duration]
        );
      }
    }

    // 3. Seed Chat Messages
    const sampleChats = [
      { text: 'Hey team! I just pushed the main layout. Let me know what you think!', sentiment: 'positive', ageHours: 48 },
      { text: 'Awesome work, the animations are so smooth!', sentiment: 'positive', ageHours: 46 },
      { text: 'I am currently stuck on the database migration issue. Can anyone help?', sentiment: 'negative', ageHours: 44 },
      { text: 'I can look at it with you in 10 minutes.', sentiment: 'neutral', ageHours: 43 },
      { text: 'Auth is working perfectly now, tested with 50 concurrent sessions', sentiment: 'positive', ageHours: 24 },
      { text: 'We need to focus on completing the Kanban board, deadline is approaching fast!', sentiment: 'neutral', ageHours: 20 },
      { text: 'Is the API deployed? I am getting a CORS error.', sentiment: 'negative', ageHours: 18 },
      { text: 'Yes, just updated the environment variables, try now.', sentiment: 'neutral', ageHours: 17 },
      { text: 'Wow, that solved it! Thanks for the quick fix.', sentiment: 'positive', ageHours: 12 },
      { text: 'Perfect. Presentation deck is also 80% ready.', sentiment: 'positive', ageHours: 2 }
    ];

    for (let idx = 0; idx < sampleChats.length; idx++) {
      const c = sampleChats[idx];
      const sender = members[idx % members.length];
      const createdVal = `datetime('now', '-${c.ageHours} hours')`;
      await query(
        `INSERT INTO Chats (team_id, sender_id, message, sentiment, created_at)
         VALUES (?, ?, ?, ?, ${createdVal})`,
        [team_id, sender.user_id, c.text, c.sentiment]
      );
    }

    // 4. Calculate Productivity for each member
    for (const m of members) {
      await calcProductivityInline(m.user_id, team_id);
    }

    // 5. Update Team Health
    await updateTeamHealth(team_id);

    console.log(`✅ Success: Premium dummy data populated for team ${team_id}`);
  } catch (err) {
    console.error(`❌ Error in ensureTeamDummyData for team ${team_id}:`, err.message);
  }
}

// ── GET /analytics/:team_id ───────────────────────────────────────────────────
exports.getTeamAnalytics = async (req, res) => {
  try {
    const { team_id } = req.params;
    await ensureTeamDummyData(team_id);
    const [overview]    = await query('SELECT * FROM vw_team_analytics WHERE team_id=?', [team_id]);
    const productivity  = await query(
      `SELECT ps.*,u.full_name,u.username,u.avatar_url
       FROM ProductivityScores ps JOIN Users u ON u.id=ps.user_id
       WHERE ps.team_id=? ORDER BY ps.overall_score DESC`, [team_id]);
    const taskTimeline  = await query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS created,
              SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS completed
       FROM Tasks WHERE team_id=? AND created_at >= datetime('now','-14 days')
       GROUP BY DATE(created_at) ORDER BY day`, [team_id]);
    const activityFeed  = await query(
      `SELECT al.*,u.full_name,u.username,u.avatar_url FROM ActivityLogs al
       JOIN Users u ON u.id=al.user_id
       WHERE al.team_id=? ORDER BY al.created_at DESC LIMIT 20`, [team_id]);
    const sentiment     = await query('SELECT * FROM vw_team_sentiment WHERE team_id=?', [team_id]);
    const burnoutRisks  = await query(
      `SELECT u.full_name,u.avatar_url,ps.burnout_risk,ps.overall_score
       FROM ProductivityScores ps JOIN Users u ON u.id=ps.user_id
       WHERE ps.team_id=? AND ps.burnout_risk != 'low'`, [team_id]);
    const tasksByStatus   = await query(
      'SELECT status, COUNT(*) as count FROM Tasks WHERE team_id=? GROUP BY status', [team_id]);
    const tasksByPriority = await query(
      'SELECT priority, COUNT(*) as count FROM Tasks WHERE team_id=? GROUP BY priority', [team_id]);

    // Burndown data: expected vs actual over 14 days
    const [totals] = await query(
      'SELECT COUNT(*) AS total FROM Tasks WHERE team_id=?', [team_id]);
    const [attRow] = await query(
      'SELECT COALESCE(SUM(duration_mins),0) AS total_mins FROM Attendance WHERE team_id=?', [team_id]);
    if (overview) overview.total_active_mins = attRow.total_mins;
    const burndown = taskTimeline.map((row, i, arr) => {
      const cumDone = arr.slice(0, i + 1).reduce((s, r) => s + (r.completed || 0), 0);
      const totalTasks = totals.total || 1;
      const ideal = Math.round(totalTasks * (1 - i / (arr.length || 1)));
      return { day: row.day, remaining: Math.max(0, totalTasks - cumDone), ideal };
    });

    res.json({
      overview: overview || {}, productivity, taskTimeline, activityFeed,
      sentiment: sentiment[0] || {}, burnoutRisks, tasksByStatus, tasksByPriority, burndown
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── GET /analytics/:team_id/user/:user_id ─────────────────────────────────────
exports.getUserActivity = async (req, res) => {
  try {
    const { user_id, team_id } = req.params;
    const heatmap = await query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count
       FROM ActivityLogs WHERE user_id=? AND team_id=?
       AND created_at >= datetime('now','-90 days')
       GROUP BY DATE(created_at)`, [user_id, team_id]);
    const [score] = await query(
      'SELECT * FROM ProductivityScores WHERE user_id=? AND team_id=? ORDER BY calculated_at DESC LIMIT 1',
      [user_id, team_id]);
    res.json({ heatmap, score: score || {} });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── POST /analytics/:team_id/user/:user_id/calc ───────────────────────────────
exports.calcProductivity = async (req, res) => {
  try {
    const { user_id, team_id } = req.params;
    const result = await calcProductivityInline(user_id, team_id);
    await updateTeamHealth(team_id);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── GET /analytics/:team_id/insights (AI Engine) ─────────────────────────────
exports.getAIInsights = async (req, res) => {
  try {
    const { team_id } = req.params;
    await ensureTeamDummyData(team_id);
    const [ana] = await query('SELECT * FROM vw_team_analytics WHERE team_id=?', [team_id]);
    const members = await query(
      `SELECT u.id,u.full_name,u.xp_points,tm.role_tag,
              ps.overall_score,ps.burnout_risk,ps.mood,ps.tasks_score,ps.chat_score
       FROM TeamMembers tm
       JOIN Users u ON u.id=tm.user_id
       LEFT JOIN ProductivityScores ps ON ps.user_id=tm.user_id AND ps.team_id=tm.team_id
       WHERE tm.team_id=? AND tm.is_active=1`, [team_id]);

    const now      = new Date();
    const deadline = ana?.deadline ? new Date(ana.deadline) : null;
    const daysLeft = deadline ? Math.max(0, Math.ceil((deadline - now) / 86400000)) : null;
    const completionPct = parseFloat(ana?.completion_pct || 0);
    const velocity = daysLeft ? (completionPct / Math.max(1, 30 - daysLeft)) : 0; // pct per day

    // Predicted completion status
    const predictedCompletion = daysLeft !== null
      ? completionPct > 80 ? 'On Track 🟢'
      : completionPct > 50 ? 'At Risk 🟡'
      : 'Behind Schedule 🔴'
      : 'No Deadline Set';

    // AI-Simulated sprint health (0-100)
    const sprintHealth = Math.round(
      (completionPct * 0.35) +
      (Math.min(members.reduce((s,m) => s + (m.overall_score || 50), 0) / Math.max(members.length,1), 100) * 0.35) +
      ((100 - Math.min((ana?.health_score || 100), 100)) * -0.3) + 50
    );

    // Workload distribution (detect imbalance)
    const avgScore = members.reduce((s,m) => s + (m.overall_score || 50), 0) / Math.max(members.length, 1);
    const overloaded  = members.filter(m => (m.overall_score || 50) > avgScore * 1.4);
    const underloaded = members.filter(m => (m.overall_score || 50) < avgScore * 0.6);

    // Generate insights
    const insights = [];
    if ((ana?.health_score || 100) < 60)
      insights.push({ type:'risk', severity:'critical', msg:'Team health is critically low. Reassign overdue tasks immediately.' });
    members.filter(m => m.burnout_risk === 'high').forEach(m =>
      insights.push({ type:'burnout', severity:'high', msg:`${m.full_name} shows high burnout risk. Consider reducing task load.` }));
    if (completionPct < 30 && daysLeft !== null && daysLeft < 3)
      insights.push({ type:'deadline', severity:'critical', msg:`⚠️ Only ${daysLeft} day(s) left with ${Math.round(completionPct)}% done — unlikely to meet deadline.` });
    members.filter(m => (m.overall_score || 0) < 30).forEach(m =>
      insights.push({ type:'inactive', severity:'medium', msg:`${m.full_name} has very low activity. Check in with them.` }));
    overloaded.forEach(m =>
      insights.push({ type:'suggest', severity:'low', msg:`${m.full_name} is handling more than their share — redistribute to ${underloaded[0]?.full_name || 'teammates'}.` }));
    if (velocity > 0 && velocity < 2 && daysLeft < 5)
      insights.push({ type:'velocity', severity:'high', msg:`Task velocity is ${velocity.toFixed(1)}% per day — too slow for deadline.` });
    const sorted = [...members].sort((a,b) => (b.overall_score || 0) - (a.overall_score || 0));
    if (sorted[0])
      insights.push({ type:'suggest', severity:'low', msg:`Recommend ${sorted[0].full_name} as Sprint Lead — highest productivity (${Math.round(sorted[0].overall_score || 0)}%).` });

    // Bottleneck detection
    const [blockedCount] = await query(
      "SELECT COUNT(*) AS c FROM Tasks WHERE team_id=? AND status='blocked'", [team_id]);
    if (blockedCount.c > 0)
      insights.push({ type:'bottleneck', severity:'high', msg:`${blockedCount.c} task(s) are BLOCKED. These are slowing the entire sprint.` });

    // Smart task suggestions (unassigned critical tasks)
    const unassigned = await query(
      `SELECT title FROM Tasks WHERE team_id=? AND assigned_to IS NULL
       AND priority IN ('high','critical') AND status != 'done' LIMIT 3`, [team_id]);
    unassigned.forEach(t =>
      insights.push({ type:'suggest', severity:'medium', msg:`Unassigned critical task: "${t.title}" — assign to a member now.` }));

    // Meeting notes from recent chat
    const recentMsgs = await query(
      `SELECT message FROM Chats WHERE team_id=?
       AND created_at >= datetime('now','-1 days') ORDER BY created_at DESC LIMIT 20`, [team_id]);
    const meetingNotes = generateMeetingNotes(recentMsgs, ana, members);

    res.json({
      analytics: ana, members, insights, daysLeft, predictedCompletion, completionPct,
      sprintHealth: Math.min(100, Math.max(0, sprintHealth)),
      velocity: velocity.toFixed(2),
      workload: { overloaded, underloaded, avgScore: Math.round(avgScore) },
      meetingNotes
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── AI Meeting Notes Generator ────────────────────────────────────────────────
function generateMeetingNotes(msgs, ana, members) {
  const msgCount = msgs.length;
  const tasksDone = ana?.tasks_done || 0;
  const tasksTotal = ana?.tasks_total || 0;
  return {
    generated_at: new Date().toISOString(),
    summary: `Team ${ana?.team_name || ''} standup — ${msgCount} messages analyzed`,
    completed: tasksDone > 0 ? [`${tasksDone} tasks completed`] : ['No tasks completed yet'],
    inProgress: [`${tasksTotal - tasksDone} tasks remaining in sprint`],
    blockers: msgs.filter(m => /block|stuck|help|issue|problem/i.test(m.message)).slice(0,2).map(m => m.message.slice(0,80)),
    nextSteps: members.slice(0,3).map(m => `${m.full_name?.split(' ')[0]} continues on assigned tasks`),
    morale: msgCount > 10 ? 'High engagement' : msgCount > 3 ? 'Moderate' : 'Low activity detected',
  };
}
