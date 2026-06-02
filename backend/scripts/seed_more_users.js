// scripts/seed_more_users.js — SQLite script to insert more diverse sample users, teams, and productivity scores
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../syncsphere.db');
const db = new sqlite3.Database(dbPath);

async function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('❌ SQLite Error:', err.message);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

async function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('❌ SQLite Error:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function main() {
  try {
    console.log('🌱 Starting additional data seed...');
    const hash = await bcrypt.hash('password123', 10);

    // 1. Clean up previously inserted users and teams if any to ensure clean re-run
    await runQuery(`
      DELETE FROM Users WHERE email IN (
        'liam@syncsphere.io', 'sophia@syncsphere.io', 'noah@syncsphere.io',
        'emma@syncsphere.io', 'ethan@syncsphere.io', 'olivia@syncsphere.io',
        'marcus@syncsphere.io', 'isabella@syncsphere.io', 'lucas@syncsphere.io',
        'maya@syncsphere.io'
      )
    `);
    await runQuery("DELETE FROM Teams WHERE invite_code = 'QCRYPTO7'");

    // 2. Insert 10 New Users
    const newUsers = [
      ['liam_codes', 'liam@syncsphere.io', hash, 'Liam Patel', 'member', 2100, 11, '["React","Node.js","GraphQL","Web3"]'],
      ['sophia_design', 'sophia@syncsphere.io', hash, 'Sophia Vance', 'member', 1750, 6, '["Figma","Tailwind CSS","UI/UX","CSS"]'],
      ['noah_ml', 'noah@syncsphere.io', hash, 'Noah Kim', 'member', 2320, 14, '["PyTorch","Python","Computer Vision","SciPy"]'],
      ['emma_sec', 'emma@syncsphere.io', hash, 'Emma Watson', 'member', 1450, 4, '["Penetration Testing","Security","Go","Rust"]'],
      ['ethan_devops', 'ethan@syncsphere.io', hash, 'Ethan Hunt', 'member', 1980, 9, '["Docker","Kubernetes","AWS","CI/CD"]'],
      ['olivia_analytics', 'olivia@syncsphere.io', hash, 'Olivia Chen', 'member', 1150, 3, '["Python","Pandas","Tableau","SQL"]'],
      ['marcus_lead', 'marcus@syncsphere.io', hash, 'Marcus Aurelius', 'member', 2800, 15, '["System Design","Go","Redis","Kafka"]'],
      ['isabella_front', 'isabella@syncsphere.io', hash, 'Isabella Ross', 'member', 850, 2, '["Vue.js","TypeScript","CSS","Sass"]'],
      ['lucas_data', 'lucas@syncsphere.io', hash, 'Lucas Perez', 'member', 1550, 7, '["PostgreSQL","Prisma","Node.js","Express"]'],
      ['maya_doc', 'maya@syncsphere.io', hash, 'Maya Lin', 'member', 620, 1, '["Technical Writing","Markdown","Jira","Agile"]']
    ];

    console.log('👤 Inserting 10 new users...');
    for (const u of newUsers) {
      await runQuery(
        `INSERT INTO Users (username, email, password_hash, full_name, role, xp_points, streak_days, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        u
      );
    }

    // Get IDs of newly inserted users
    const userRows = await getQuery("SELECT id, username FROM Users ORDER BY id DESC LIMIT 10");
    const userMap = {};
    userRows.forEach(row => {
      userMap[row.username] = row.id;
    });

    console.log('Mapped User IDs:', userMap);

    // 3. Create a New Team: "Quantum Crypto"
    console.log('👥 Creating new team: Quantum Crypto...');
    const liamId = userMap['liam_codes'];
    const teamResult = await runQuery(
      `INSERT INTO Teams (name, description, invite_code, hackathon_name, deadline, owner_id, status, health_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Quantum Crypto', 'Securing the decentralized future with zero-knowledge cryptography', 'QCRYPTO7', 'Web3 Innovators', '2026-10-30 23:59:59', liamId, 'active', 94.0]
    );
    const newTeamId = teamResult.lastID;

    // 4. Assign Team Members
    console.log('🔗 Assigning users to teams...');
    // Team 3 (Quantum Crypto) members: Liam (lead), Sophia (designer), Noah (backend/ML), Emma (debugger)
    const team3Members = [
      [newTeamId, userMap['liam_codes'], 'lead', 92.5],
      [newTeamId, userMap['sophia_design'], 'designer', 88.0],
      [newTeamId, userMap['noah_ml'], 'backend', 95.0],
      [newTeamId, userMap['emma_sec'], 'debugger', 45.0]
    ];
    for (const m of team3Members) {
      await runQuery(`INSERT INTO TeamMembers (team_id, user_id, role_tag, contribution_score) VALUES (?, ?, ?, ?)`, m);
    }

    // Team 1 (Nebula Coders) members: Ethan (backend), Olivia (presenter), Marcus (lead)
    const team1Members = [
      [1, userMap['ethan_devops'], 'backend', 78.5],
      [1, userMap['olivia_analytics'], 'presenter', 62.0],
      [1, userMap['marcus_lead'], 'lead', 96.0]
    ];
    for (const m of team1Members) {
      await runQuery(`INSERT INTO TeamMembers (team_id, user_id, role_tag, contribution_score) VALUES (?, ?, ?, ?)`, m);
    }

    // Team 2 (Phoenix Squad) members: Isabella (frontend), Lucas (backend), Maya (presenter)
    const team2Members = [
      [2, userMap['isabella_front'], 'frontend', 55.0],
      [2, userMap['lucas_data'], 'backend', 70.0],
      [2, userMap['maya_doc'], 'presenter', 40.0]
    ];
    for (const m of team2Members) {
      await runQuery(`INSERT INTO TeamMembers (team_id, user_id, role_tag, contribution_score) VALUES (?, ?, ?, ?)`, m);
    }

    // 5. Insert Tasks for Team 3 (Quantum Crypto)
    console.log('📋 Creating tasks for Quantum Crypto...');
    const tasks = [
      [newTeamId, 'Research zero-knowledge proofs (ZKP)', 'done', 'critical', userMap['liam_codes'], userMap['liam_codes'], '2026-06-15 12:00:00', 40, 5],
      [newTeamId, 'Design ZK-Rollups landing page', 'done', 'high', userMap['sophia_design'], userMap['liam_codes'], '2026-06-18 18:00:00', 25, 3],
      [newTeamId, 'Implement smart contracts for verification', 'in_progress', 'critical', userMap['noah_ml'], userMap['liam_codes'], '2026-06-22 12:00:00', 35, 5],
      [newTeamId, 'Conduct contract vulnerability audit', 'todo', 'high', userMap['emma_sec'], userMap['liam_codes'], '2026-06-25 12:00:00', 30, 4],
      [newTeamId, 'Write documentation and deployment guides', 'todo', 'low', userMap['sophia_design'], userMap['liam_codes'], '2026-06-28 12:00:00', 15, 2]
    ];
    for (const t of tasks) {
      await runQuery(`INSERT INTO Tasks (team_id, title, status, priority, assigned_to, created_by, due_date, xp_reward, story_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, t);
    }

    // 6. Insert Chat Messages for Team 3
    console.log('💬 Seeding chat messages for Quantum Crypto...');
    const chatMsgs = [
      [newTeamId, userMap['liam_codes'], 'Welcome to the Quantum Crypto war room! Zero-Knowledge is the goal. 🔒', 'positive'],
      [newTeamId, userMap['sophia_design'], 'Already working on the wireframes. They look super sleek! ✨', 'positive'],
      [newTeamId, userMap['noah_ml'], 'The proof generation script works, but latency is about 2.1s. Working to optimize.', 'neutral'],
      [newTeamId, userMap['emma_sec'], 'I checked the libraries, we have a minor security notice on one dependency.', 'negative'],
      [newTeamId, userMap['liam_codes'], 'Great catch Emma, let us swap it out or patch it ASAP.', 'positive']
    ];
    for (const msg of chatMsgs) {
      await runQuery(`INSERT INTO Chats (team_id, sender_id, message, sentiment) VALUES (?, ?, ?, ?)`, msg);
    }

    // 7. Seed Productivity Scores
    console.log('📈 Seeding productivity scores...');
    const prodScores = [
      // Team 3 members
      [userMap['liam_codes'], newTeamId, 92.0, 95.0, 90.0, 85.0, 92.5, 'low'],
      [userMap['sophia_design'], newTeamId, 88.0, 90.0, 85.0, 80.0, 88.0, 'low'],
      [userMap['noah_ml'], newTeamId, 95.0, 98.0, 92.0, 90.0, 95.5, 'low'],
      [userMap['emma_sec'], newTeamId, 45.0, 50.0, 40.0, 30.0, 43.5, 'medium'],

      // Team 1 members
      [userMap['ethan_devops'], 1, 80.0, 85.0, 70.0, 75.0, 78.5, 'low'],
      [userMap['olivia_analytics'], 1, 65.0, 70.0, 60.0, 50.0, 62.5, 'low'],
      [userMap['marcus_lead'], 1, 98.0, 95.0, 95.0, 90.0, 96.0, 'low'],

      // Team 2 members
      [userMap['isabella_front'], 2, 50.0, 60.0, 55.0, 50.0, 54.5, 'medium'],
      [userMap['lucas_data'], 2, 72.0, 75.0, 68.0, 65.0, 70.0, 'low'],
      [userMap['maya_doc'], 2, 35.0, 45.0, 40.0, 30.0, 38.5, 'high']
    ];
    for (const ps of prodScores) {
      await runQuery(
        `INSERT INTO ProductivityScores (user_id, team_id, tasks_score, attendance_score, chat_score, upload_score, overall_score, burnout_risk) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ps
      );
    }

    console.log('🎉 Additional sample users, teams, tasks, and productivity scores seeded successfully!');
    db.close();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    db.close();
  }
}

main();
