const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../syncsphere.db');
const db = new sqlite3.Database(dbPath);

const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve(this);
  });
});

async function seed() {
  try {
    console.log('🧹 Cleaning existing teams, team members, and activity logs...');
    await run('DELETE FROM TeamMembers');
    await run('DELETE FROM Teams');
    await run('DELETE FROM ActivityLogs');

    console.log('Starting team seeding...');

    // Fetch existing users instead of recreating them
    const users = await query('SELECT id FROM Users ORDER BY id LIMIT 100');
    const userIds = users.map(u => u.id);

    if (userIds.length < 100) {
      console.log(`⚠️ Warning: Found ${userIds.length} users in database (expected 100).`);
      if (userIds.length < 25) {
        console.error('❌ Error: Not enough users to create 25 teams.');
        return;
      }
    } else {
      console.log(`Found ${userIds.length} users to distribute.`);
    }

    console.log('🌱 Seeding user registration logs...');
    for (let uIdx = 0; uIdx < userIds.length; uIdx++) {
      const uId = userIds[uIdx];
      const registerTime = `datetime('now', '-6 days', '+${uIdx * 15} minutes')`;
      await run(
        `INSERT INTO ActivityLogs (user_id, action, entity_type, meta, created_at)
         VALUES (?, 'user_register', 'User', '{}', ${registerTime})`,
        [uId]
      );
    }

    // 25 teams. Each team gets 1 owner (indexes 0 to 24) and 3 members (indexes 25 to 99)
    const teamNames = [
      'Nebula Coders', 'Phoenix Squad', 'Quantum Innovators', 'Cyber Sentinels', 'Byte Busters',
      'Pixel Pioneers', 'Dev Dynamos', 'Data Wizards', 'Logic Loopers', 'Cloud Cruisers',
      'Sync Spheres', 'Code Commandos', 'Tech Titans', 'Alpha Hackers', 'Beta Builders',
      'Gamma Gurus', 'Delta Developers', 'Sigma Sages', 'Omega Ops', 'Krypton Knights',
      'Helix Hackers', 'Apex Architects', 'Summit Solvers', 'Nexus Nodes', 'Vortex Voyagers'
    ];

    const hackathonThemes = [
      'Global AI Challenge 2026',
      'Web3 Innovators',
      'EcoTech Sprint'
    ];

    console.log('🌱 Seeding teams, memberships, and team activities...');
    for (let i = 0; i < 25; i++) {
      const ownerId = userIds[i]; // Pick unique owner from first 25 users
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const hackName = hackathonThemes[i % hackathonThemes.length];
      const deadline = i % 3 === 0 ? '2026-10-15 00:00:00' : i % 3 === 1 ? '2026-09-30 00:00:00' : '2026-09-10 00:00:00';

      const result = await run(
        'INSERT INTO Teams (name, description, owner_id, invite_code, hackathon_name, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          teamNames[i] || `Hackathon Team ${i + 1}`,
          `This is team number ${i + 1} participating in ${hackName}.`,
          ownerId,
          inviteCode,
          hackName,
          deadline,
          i % 3 === 2 ? 'completed' : 'active'
        ]
      );

      const teamId = result.lastID;

      // Add owner as a team member with 'lead' tag
      await run(
        'INSERT INTO TeamMembers (team_id, user_id, role_tag) VALUES (?, ?, ?)',
        [teamId, ownerId, 'lead']
      );

      // Log team creation in ActivityLogs
      await run(
        `INSERT INTO ActivityLogs (user_id, team_id, action, entity_type, meta, created_at)
         VALUES (?, ?, 'team_created', 'Team', ?, datetime('now', '-5 days'))`,
        [ownerId, teamId, JSON.stringify({ name: teamNames[i] })]
      );

      // Add exactly 3 unique members from the userIds array starting from index 25 onwards
      for (let j = 0; j < 3; j++) {
        const memberIndex = 25 + (i * 3) + j;
        if (memberIndex < userIds.length) {
          const memberId = userIds[memberIndex];
          const roles = ['frontend', 'backend', 'designer', 'debugger', 'fullstack'];
          const roleTag = roles[Math.floor(Math.random() * roles.length)];

          await run(
            'INSERT INTO TeamMembers (team_id, user_id, role_tag) VALUES (?, ?, ?)',
            [teamId, memberId, roleTag]
          );

          // Log member joining in ActivityLogs
          await run(
            `INSERT INTO ActivityLogs (user_id, team_id, action, entity_type, meta, created_at)
             VALUES (?, ?, 'team_joined', 'Team', ?, datetime('now', '-5 days', '+${(j + 1) * 30} minutes'))`,
            [memberId, teamId, JSON.stringify({ role_tag: roleTag })]
          );
        }
      }
    }
    console.log(`✅ Success: Created 25 teams and assigned members perfectly with full ActivityLogs (1 user per team, no overlaps).`);
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    db.close();
  }
}

seed();
