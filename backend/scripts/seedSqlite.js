const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
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

async function seed() {
  const hash = await bcrypt.hash('password123', 10);

  // Check if Users table has any entries
  const existingUsers = await getQuery("SELECT id FROM Users LIMIT 1");
  if (existingUsers.length > 0) {
    console.log('🌱 Database already has data. Skipping seed.');
    db.close();
    return;
  }

  console.log('🌱 Seeding database...');

  // 1. Users
  const users = [
    ['alice_dev', 'alice@syncsphere.io', hash, 'Alice Johnson', 'admin', 2450, 12, '["React","Node.js","UI/UX"]'],
    ['bob_build', 'bob@syncsphere.io', hash, 'Bob Martinez', 'member', 1890, 8, '["Python","ML","FastAPI"]'],
    ['carol_ui', 'carol@syncsphere.io', hash, 'Carol Zhang', 'member', 1650, 5, '["Figma","CSS","Animations"]'],
    ['dave_back', 'dave@syncsphere.io', hash, 'Dave Smith', 'member', 1230, 3, '["MySQL","Express","DevOps"]'],
    ['eve_test', 'eve@syncsphere.io', hash, 'Eve Kumar', 'member', 980, 7, '["Testing","QA","Documentation"]']
  ];

  for (const user of users) {
    await runQuery(`INSERT INTO Users (username, email, password_hash, full_name, role, xp_points, streak_days, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, user);
  }

  // 2. Teams
  const teams = [
    ['Nebula Coders', 'Building the future of hackathon collaboration', 'NEBULA01', 'HackFest 2024', '2024-12-15 18:00:00', 1, 'active', 87.5],
    ['Phoenix Squad', 'Rising from code to glory', 'PHNX2024', 'CodeStorm 2024', '2024-12-20 20:00:00', 2, 'active', 72.0]
  ];

  for (const team of teams) {
    await runQuery(`INSERT INTO Teams (name, description, invite_code, hackathon_name, deadline, owner_id, status, health_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, team);
  }

  // 3. TeamMembers
  const members = [
    [1, 1, 'lead', 85.0], [1, 2, 'backend', 72.0], [1, 3, 'designer', 68.0], [1, 4, 'backend', 55.0], [1, 5, 'debugger', 60.0],
    [2, 2, 'lead', 78.0], [2, 3, 'frontend', 65.0]
  ];

  for (const member of members) {
    await runQuery(`INSERT INTO TeamMembers (team_id, user_id, role_tag, contribution_score) VALUES (?, ?, ?, ?)`, member);
  }

  // 4. Tasks
  const tasks = [
    [1, 'Design landing page hero section', 'done', 'high', 3, 1, '2024-12-10 12:00:00', 25, 3],
    [1, 'Implement JWT authentication', 'done', 'critical', 4, 1, '2024-12-11 12:00:00', 30, 5],
    [1, 'Set up MySQL database schema', 'done', 'high', 4, 1, '2024-12-09 12:00:00', 20, 3],
    [1, 'Build Kanban board component', 'in_progress', 'high', 3, 1, '2024-12-13 12:00:00', 20, 3],
    [1, 'Integrate Socket.IO real-time chat', 'in_progress', 'critical', 2, 1, '2024-12-12 12:00:00', 35, 5],
    [1, 'Create analytics dashboard', 'todo', 'medium', 1, 1, '2024-12-14 12:00:00', 25, 4],
    [1, 'Add SOS emergency feature', 'todo', 'high', 5, 1, '2024-12-13 12:00:00', 20, 3],
    [1, 'Write API documentation', 'todo', 'low', 5, 1, '2024-12-15 12:00:00', 15, 2],
    [1, 'Performance optimization', 'review', 'medium', 2, 1, '2024-12-14 12:00:00', 20, 3],
    [1, 'Deploy to production', 'blocked', 'critical', 1, 1, '2024-12-15 12:00:00', 40, 5]
  ];

  for (const task of tasks) {
    await runQuery(`INSERT INTO Tasks (team_id, title, status, priority, assigned_to, created_by, due_date, xp_reward, story_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, task);
  }

  // 5. Chats
  const chats = [
    [1, 1, 'Hey team! Just pushed the auth module 🚀', 'positive'],
    [1, 2, 'Great work Alice! ML sentiment engine is ready too', 'positive'],
    [1, 3, 'UI components look amazing with the glassmorphism effect ✨', 'positive'],
    [1, 4, 'DB triggers are working perfectly', 'neutral'],
    [1, 5, 'Running final tests, found 2 minor bugs', 'neutral'],
    [1, 1, 'No worries, we still have time. Team morale looking great!', 'positive'],
    [1, 2, 'Socket.IO latency is under 50ms 🔥', 'positive'],
    [1, 3, 'Dark mode toggle is super smooth', 'positive']
  ];

  for (const chat of chats) {
    await runQuery(`INSERT INTO Chats (team_id, sender_id, message, sentiment) VALUES (?, ?, ?, ?)`, chat);
  }

  // 6. Achievements
  const achievements = [
    [1, 'Team Captain', '👑', 100, 'First to create a team'],
    [1, 'Speed Coder', '⚡', 75, 'Completed 5 tasks in one day'],
    [2, 'ML Wizard', '🧠', 80, 'Integrated AI features'],
    [3, 'Design Guru', '🎨', 60, 'Created stunning UI components'],
    [4, 'Database Master', '🗄️', 70, 'Designed normalized schema']
  ];

  for (const achievement of achievements) {
    await runQuery(`INSERT INTO Achievements (user_id, badge_name, badge_icon, xp_bonus, description) VALUES (?, ?, ?, ?, ?)`, achievement);
  }

  // 7. Polls
  const polls = [
    [1, 1, 'What should we build next?', '["AI chatbot","Voice chat","Whiteboard","Leaderboard"]'],
    [1, 1, 'When should we present?', '["Friday 2pm","Saturday 10am","Saturday 3pm","Sunday"]']
  ];

  for (const poll of polls) {
    await runQuery(`INSERT INTO Polls (team_id, created_by, question, options) VALUES (?, ?, ?, ?)`, poll);
  }

  // 8. Productivity Scores
  const scores = [
    [1, 1, 90, 95, 80, 70, 87.5, 'low'],
    [2, 1, 75, 80, 85, 60, 77.5, 'low'],
    [3, 1, 70, 75, 90, 80, 76.5, 'low'],
    [4, 1, 60, 70, 50, 90, 64.0, 'medium'],
    [5, 1, 65, 85, 55, 40, 65.5, 'low']
  ];

  for (const score of scores) {
    await runQuery(`INSERT INTO ProductivityScores (user_id, team_id, tasks_score, attendance_score, chat_score, upload_score, overall_score, burnout_risk) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, score);
  }

  console.log('🌱 Seed data inserted into SQLite successfully!');
  db.close();
}

seed().catch(e => {
  console.error('❌ SQLite Seed error:', e.message);
  db.close();
  process.exit(1);
});
