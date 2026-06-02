// scripts/populate_rich_analytics.js — SQLite script to generate a massive, high-fidelity dataset for DBMS Analytics
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../syncsphere.db');
const db = new sqlite3.Database(dbPath);

async function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function main() {
  try {
    console.log('🌱 Starting population of rich analytical records...');

    // 1. Get all teams and users dynamically to match IDs
    const teams = await getQuery("SELECT id, name FROM Teams");
    const users = await getQuery("SELECT id, username, email FROM Users");

    const userMap = {};
    users.forEach(u => { userMap[u.email] = u.id; });
    const teamMap = {};
    teams.forEach(t => { teamMap[t.name] = t.id; });

    console.log('Current Teams in database:', teamMap);
    console.log('Total Users in database:', users.length);

    if (teams.length === 0) {
      console.error('❌ No teams found in database. Please run seedDatabase/seedSqlite first.');
      db.close();
      return;
    }

    // 2. Clear old transactional data to avoid duplicates and ensure a clean timeline
    console.log('🧹 Clearing old tasks, attendance, chats, productivity, activity logs...');
    await runQuery("DELETE FROM Tasks");
    await runQuery("DELETE FROM Attendance");
    await runQuery("DELETE FROM Chats");
    await runQuery("DELETE FROM ProductivityScores");
    await runQuery("DELETE FROM ActivityLogs");
    await runQuery("DELETE FROM SOSAlerts");
    await runQuery("DELETE FROM ThreatLogs");
    await runQuery("DELETE FROM IncidentLogs");

    // 3. Seed Incident Logs (Admin Moderation)
    console.log('🛡️ Seeding rich incident and threat logs...');
    const incidentSeeds = [
      ['Spamming', 'User: Eve Hacker', 'Alice Johnson', 'Pending', '1 hour ago'],
      ['Abusive Language', 'Chat: Team Phoenix', 'System Bot', 'Investigating', '4 hours ago'],
      ['Plagiarism Attempt', 'Submission: Nebula DeFi', 'Professor Alan', 'Resolved', '1 day ago'],
      ['Spamming', 'User: Guest User 1', 'Bob Martinez', 'Pending', '2 days ago'],
      ['Inappropriate Content', 'Submission: Web3 Wallet', 'Carol Zhang', 'Resolved', '3 days ago'],
      ['Misconduct', 'User: Dave Smith', 'System Bot', 'Pending', '4 days ago']
    ];
    for (const inc of incidentSeeds) {
      await runQuery(
        "INSERT INTO IncidentLogs (type, target, reportedBy, status, time) VALUES (?, ?, ?, ?, ?)",
        inc
      );
    }

    // Seed Threat Logs (Admin Dashboard Security telemetry)
    const threatSeeds = [
      ['critical', 'SQL Injection Attempt', '103.45.22.112', 'Malicious query input pattern detected on login endpoint'],
      ['high', 'Brute Force Attack', '192.168.1.55', '15 consecutive failed logins detected for admin accounts'],
      ['medium', 'Suspicious Session Replay', '45.72.110.8', 'Rapid page interactions exceeding human speed limit'],
      ['low', 'Port Scanning Activity', '88.200.41.9', 'Scans detected on port 5000 and port 5173'],
      ['high', 'Cross-Site Scripting (XSS)', '184.22.12.98', 'Script tags injected into workspace chat stream'],
      ['critical', 'JWT Secret Forgery Attempt', '201.88.54.12', 'Invalid signature verification on critical admin route']
    ];
    for (const th of threatSeeds) {
      await runQuery(
        "INSERT INTO ThreatLogs (severity, type, source_ip, description) VALUES (?, ?, ?, ?)",
        th
      );
    }

    // 4. Generate data per team
    for (const team of teams) {
      console.log(`\n📦 Generating timeline dataset for team: ${team.name} (ID: ${team.id})`);

      // Get team members
      const members = await getQuery("SELECT user_id, role_tag FROM TeamMembers WHERE team_id = ?", [team.id]);
      if (members.length === 0) {
        console.log(`⚠️ No members found for team ${team.name}. Skipping.`);
        continue;
      }
      const memberIds = members.map(m => m.user_id);
      const leadUserId = members.find(m => m.role_tag === 'lead')?.user_id || memberIds[0];

      // A. Seed 15 Realistic Tasks (Completed, In Progress, Review, To Do, Blocked)
      console.log(`  📋 Inserting 15 tasks...`);
      const taskSpecs = [
        // Completed Tasks (Done)
        { title: 'Project Initialization & Boilerplate setup', status: 'done', priority: 'high', ageDays: 14, compDays: 13 },
        { title: 'Database schema architecture & relational modeling', status: 'done', priority: 'critical', ageDays: 13, compDays: 11 },
        { title: 'User authentication API using JWT and bcrypt', status: 'done', priority: 'high', ageDays: 12, compDays: 9 },
        { title: 'Figma high-fidelity dashboard layouts & theme variables', status: 'done', priority: 'medium', ageDays: 11, compDays: 8 },
        { title: 'Vite build configurations & proxy routing rules', status: 'done', priority: 'medium', ageDays: 10, compDays: 7 },
        { title: 'REST API endpoints for workspace modules', status: 'done', priority: 'high', ageDays: 9, compDays: 6 },
        { title: 'Socket.IO client/server channel bindings', status: 'done', priority: 'critical', ageDays: 8, compDays: 4 },
        
        // In Progress Tasks (In Progress)
        { title: 'Productivity calculation engine implementation', status: 'in_progress', priority: 'high', ageDays: 5 },
        { title: 'Kanban drag-and-drop state reconciliation', status: 'in_progress', priority: 'medium', ageDays: 4 },
        { title: 'Real-time online indicators and heartbeat hooks', status: 'in_progress', priority: 'low', ageDays: 3 },
        
        // Under Review Tasks (Review)
        { title: 'AI burnout risk heuristic testing', status: 'review', priority: 'high', ageDays: 3 },
        { title: 'Stress meter SVG animations', status: 'review', priority: 'medium', ageDays: 2 },
        
        // Blocked Tasks (Blocked)
        { title: 'SSL certificate configuration on staging cluster', status: 'blocked', priority: 'medium', ageDays: 4 },
        
        // Future Tasks (To Do / Not Started)
        { title: 'Write automated integration test cases', status: 'todo', priority: 'low', ageDays: 2 },
        { title: 'Prepare final live presentation slides', status: 'todo', priority: 'high', ageDays: 1 }
      ];

      for (let i = 0; i < taskSpecs.length; i++) {
        const t = taskSpecs[i];
        // Distribute assignments across members
        const assigneeId = memberIds[i % memberIds.length];
        
        const createdVal = `datetime('now', '-${t.ageDays} days')`;
        const dueVal = `datetime('now', '+${14 - t.ageDays} days')`;
        const compVal = t.compDays ? `datetime('now', '-${t.compDays} days')` : 'NULL';

        await runQuery(
          `INSERT INTO Tasks (team_id, title, description, status, priority, assigned_to, created_by, due_date, completed_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ${dueVal}, ${compVal}, ${createdVal}, ${createdVal})`,
          [
            team.id, 
            t.title, 
            `Detailed analysis and implementation details for: ${t.title}`, 
            t.status, 
            t.priority, 
            assigneeId, 
            leadUserId
          ]
        );
      }

      // B. Seed 10 Days of Attendance logs per member
      console.log(`  ⏱️ Seeding 10 days of attendance logs...`);
      for (const uid of memberIds) {
        // Some members are extremely active, some are moderate, some are slacking
        const activityFactor = uid % 3 === 0 ? 0.9 : uid % 3 === 1 ? 0.7 : 0.4;
        
        for (let day = 1; day <= 10; day++) {
          // Add random element to determine if checked in on that day
          if (Math.random() > activityFactor) continue;
          
          const hoursWorked = Math.floor(Math.random() * 5) + 5; // 5 to 9 hours
          const duration = hoursWorked * 60;
          const checkIn = `datetime('now', '-${day} days', '-${hoursWorked + 1} hours')`;
          const checkOut = `datetime('now', '-${day} days', '-1 hour')`;
          
          await runQuery(
            `INSERT INTO Attendance (team_id, user_id, check_in, check_out, session_type, duration_mins)
             VALUES (?, ?, ${checkIn}, ${checkOut}, 'online', ?)`,
            [team.id, uid, duration]
          );
        }
      }

      // C. Seed 15 Chat messages with rich sentiment
      console.log(`  💬 Seeding chat messages with sentiment...`);
      const chatSpecs = [
        { text: 'Auth flow is completed! High security is key for the project.', sentiment: 'positive', offset: 0 },
        { text: 'Wow, database indexing makes response times under 10ms!', sentiment: 'positive', offset: 1 },
        { text: 'I am blocked by the websocket config. Can anyone review my pull request?', sentiment: 'negative', offset: 2 },
        { text: 'I can help you review it after my lunch break.', sentiment: 'neutral', offset: 0 },
        { text: 'The stress meter animations are look amazing on dashboard!', sentiment: 'positive', offset: 1 },
        { text: 'CORS policy is throwing errors on production routes, let us fix it ASAP.', sentiment: 'negative', offset: 2 },
        { text: 'Fixed CORS config, check the staging URL now.', sentiment: 'positive', offset: 0 },
        { text: 'Awesome, it works perfectly now. Good team work.', sentiment: 'positive', offset: 1 },
        { text: 'Should we add the Voice chat component? I think we do not have enough time.', sentiment: 'neutral', offset: 2 },
        { text: 'Agree. Let us defer it and focus on core features.', sentiment: 'neutral', offset: 0 },
        { text: 'Heads up! Only 2 days left to freeze the features.', sentiment: 'neutral', offset: 1 },
        { text: 'ZKP proof times are too slow. We might fail the performance benchmark.', sentiment: 'negative', offset: 2 },
        { text: 'Let us optimize by reducing constraint count or switching curves.', sentiment: 'neutral', offset: 0 },
        { text: 'Morale is high, we will finish everything on time!', sentiment: 'positive', offset: 1 },
        { text: 'Presentation deck is completed, let us do a rehearsal tonight.', sentiment: 'positive', offset: 0 }
      ];

      for (let i = 0; i < chatSpecs.length; i++) {
        const c = chatSpecs[i];
        const senderId = memberIds[c.offset % memberIds.length];
        const ageHours = 48 - i * 3; // spread out over last 2 days
        const createdVal = `datetime('now', '-${ageHours} hours')`;
        await runQuery(
          `INSERT INTO Chats (team_id, sender_id, message, sentiment, created_at)
           VALUES (?, ?, ?, ?, ${createdVal})`,
          [team.id, senderId, c.text, c.sentiment]
        );
      }

      // D. Generate 10 days of historical activity logs per member (Heatmap data)
      console.log(`  🔥 Seeding 10 days of activity logs for heatmaps...`);
      const actions = ['login', 'task_created', 'task_completed', 'chat_sent', 'file_uploaded'];
      for (const uid of memberIds) {
        for (let day = 1; day <= 10; day++) {
          const actionCount = Math.floor(Math.random() * 4) + 1; // 1 to 4 actions daily
          for (let k = 0; k < actionCount; k++) {
            const act = actions[Math.floor(Math.random() * actions.length)];
            const ageHours = day * 24 + Math.floor(Math.random() * 12);
            const createdVal = `datetime('now', '-${ageHours} hours')`;
            await runQuery(
              `INSERT INTO ActivityLogs (user_id, team_id, action, entity_type, meta, created_at)
               VALUES (?, ?, ?, 'system', '{"detail": "Simulated team activity"}', ${createdVal})`,
              [uid, team.id, act]
            );
          }
        }
      }

      // E. Calculate and populate high-fidelity productivity scores
      console.log(`  📈 Calculating premium productivity metrics...`);
      for (const uid of memberIds) {
        // Calculate inline productivity score
        const [taskRow] = await getQuery(
          `SELECT COUNT(*) AS total,
                  SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done
           FROM Tasks
           WHERE assigned_to=? AND team_id=?
           AND created_at >= datetime('now', '-7 days')`, [uid, team.id]);

        const [attRow] = await getQuery(
          `SELECT COALESCE(SUM(duration_mins),0) AS mins
           FROM Attendance
           WHERE user_id=? AND team_id=?
           AND check_in >= datetime('now', '-7 days')`, [uid, team.id]);

        const [chatRow] = await getQuery(
          `SELECT COUNT(*) AS cnt FROM Chats
           WHERE sender_id=? AND team_id=?
           AND created_at >= datetime('now', '-7 days')`, [uid, team.id]);

        const task_score   = taskRow.total > 0 ? Math.round((taskRow.done / taskRow.total) * 100) : 60;
        const att_score    = Math.min(Math.round(((attRow?.mins || 2400) / 60 / 8) * 100), 100);
        const chat_score   = Math.min(chatRow.cnt * 10, 100);
        const overall      = Math.round(task_score * 0.4 + att_score * 0.3 + chat_score * 0.3);
        const burnout_risk = overall < 45 ? 'high' : overall < 70 ? 'medium' : 'low';
        
        await runQuery(
          `INSERT INTO ProductivityScores (user_id, team_id, tasks_score, attendance_score, chat_score, overall_score, burnout_risk)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uid, team.id, task_score, att_score, chat_score, overall, burnout_risk]
        );
      }

      // F. Recalculate team health score
      console.log(`  ❤️ Computing team health index...`);
      const [overdue] = await getQuery(
        `SELECT COUNT(*) AS c FROM Tasks
         WHERE team_id=? AND due_date < datetime('now') AND status != 'done'`, [team.id]);
      const [inactive] = await getQuery(
        `SELECT COUNT(*) AS c FROM TeamMembers tm
         WHERE tm.team_id=?
         AND NOT EXISTS (
           SELECT 1 FROM ActivityLogs al
           WHERE al.user_id=tm.user_id AND al.team_id=?
           AND al.created_at >= datetime('now','-2 days'))`, [team.id, team.id]);
      const [avgProd] = await getQuery(
        'SELECT COALESCE(AVG(overall_score),50) AS avg FROM ProductivityScores WHERE team_id=?', [team.id]);

      const health = Math.max(0, Math.min(100,
        100 - (overdue.c * 4) - (inactive.c * 8) + ((avgProd.avg - 50) * 0.3)));
      
      await runQuery('UPDATE Teams SET health_score=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [Math.round(health), team.id]);

      console.log(`  ✅ Complete: Health index is ${Math.round(health)}%`);
    }

    console.log('\n🎉 Premium DBMS analytical records and high-fidelity timelines seeded successfully!');
    db.close();
  } catch (err) {
    console.error('❌ Data generation failed:', err.message);
    db.close();
  }
}

main();
