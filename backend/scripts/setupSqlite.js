const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../syncsphere.db');

const db = new sqlite3.Database(dbPath);

const schema = `
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT NULL,
    role TEXT DEFAULT 'member',
    bio TEXT DEFAULT NULL,
    skills TEXT DEFAULT NULL,
    xp_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    is_online INTEGER DEFAULT 0,
    last_seen DATETIME DEFAULT NULL,
    theme_pref TEXT DEFAULT 'dark',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    logo_url TEXT DEFAULT NULL,
    hackathon_name TEXT DEFAULT NULL,
    deadline DATETIME DEFAULT NULL,
    status TEXT DEFAULT 'active',
    health_score REAL DEFAULT 100.00,
    owner_id INTEGER NOT NULL,
    max_members INTEGER DEFAULT 10,
    tags TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS TeamMembers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role_tag TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    contribution_score REAL DEFAULT 0.00,
    UNIQUE(team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT NULL,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    assigned_to INTEGER DEFAULT NULL,
    created_by INTEGER NOT NULL,
    due_date DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    tags TEXT DEFAULT NULL,
    xp_reward INTEGER DEFAULT 10,
    story_points INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT DEFAULT '🏆',
    badge_color TEXT DEFAULT '#FFD700',
    description TEXT DEFAULT NULL,
    xp_bonus INTEGER DEFAULT 50,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    file_url TEXT DEFAULT NULL,
    reply_to INTEGER DEFAULT NULL,
    reactions TEXT DEFAULT NULL,
    sentiment TEXT DEFAULT 'neutral',
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS Notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    team_id INTEGER DEFAULT NULL,
    type TEXT DEFAULT 'system',
    title TEXT NOT NULL,
    body TEXT DEFAULT NULL,
    is_read INTEGER DEFAULT 0,
    action_url TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ActivityLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    team_id INTEGER DEFAULT NULL,
    action TEXT NOT NULL,
    entity_type TEXT DEFAULT NULL,
    entity_id INTEGER DEFAULT NULL,
    meta TEXT DEFAULT NULL,
    ip_address TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    expires_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    option_idx INTEGER NOT NULL,
    voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id),
    FOREIGN KEY (poll_id) REFERENCES Polls(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE VIEW IF NOT EXISTS vw_team_analytics AS
SELECT
    t.id AS team_id,
    t.name AS team_name,
    (SELECT COUNT(DISTINCT user_id) FROM TeamMembers WHERE team_id = t.id) AS member_count,
    (SELECT COUNT(*) FROM Tasks WHERE team_id = t.id AND status = 'done') AS tasks_done,
    (SELECT COUNT(*) FROM Tasks WHERE team_id = t.id) AS tasks_total,
    t.health_score,
    t.deadline
FROM Teams t;

CREATE VIEW IF NOT EXISTS vw_leaderboard AS
SELECT
    u.id, u.username, u.full_name, u.avatar_url, u.xp_points, u.streak_days,
    (SELECT COUNT(*) FROM Achievements WHERE user_id = u.id) AS badge_count,
    (SELECT COUNT(*) FROM Tasks WHERE assigned_to = u.id AND status = 'done') AS tasks_completed,
    tm.team_id
FROM Users u
JOIN TeamMembers tm ON tm.user_id = u.id
ORDER BY u.xp_points DESC;

CREATE TABLE IF NOT EXISTS SOSAlerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    triggered_by INTEGER NOT NULL,
    message TEXT DEFAULT NULL,
    severity TEXT DEFAULT 'high',
    is_resolved INTEGER DEFAULT 0,
    resolved_by INTEGER DEFAULT NULL,
    resolved_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (triggered_by) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ProductivityScores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    tasks_score REAL DEFAULT 0,
    attendance_score REAL DEFAULT 0,
    chat_score REAL DEFAULT 0,
    upload_score REAL DEFAULT 0,
    overall_score REAL DEFAULT 0,
    burnout_risk TEXT DEFAULT 'low',
    mood TEXT DEFAULT 'neutral',
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    check_in DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_out DATETIME DEFAULT NULL,
    session_type TEXT DEFAULT 'online',
    duration_mins INTEGER DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HackathonMilestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT NULL,
    category TEXT DEFAULT 'general',
    is_done INTEGER DEFAULT 0,
    due_date DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE
);

CREATE VIEW IF NOT EXISTS vw_unread_notifications AS
SELECT user_id, COUNT(*) AS unread_count
FROM Notifications
WHERE is_read = 0
GROUP BY user_id;

CREATE VIEW IF NOT EXISTS vw_team_sentiment AS
SELECT
    team_id,
    COUNT(*) AS total_messages,
    SUM(CASE WHEN sentiment='positive' THEN 1 ELSE 0 END) AS positive,
    SUM(CASE WHEN sentiment='neutral'  THEN 1 ELSE 0 END) AS neutral,
    SUM(CASE WHEN sentiment='negative' THEN 1 ELSE 0 END) AS negative,
    ROUND(SUM(CASE WHEN sentiment='positive' THEN 1 ELSE 0 END)*100.0/COUNT(*), 1) AS morale_score
FROM Chats
WHERE created_at >= datetime('now', '-7 days')
GROUP BY team_id;
`;

db.serialize(() => {
    console.log('🔧 Creating SQLite tables...');
    db.exec(schema, (err) => {
        if (err) {
            console.error('❌ Setup failed:', err.message);
        } else {
            console.log('✅ SQLite database set up successfully!');
        }
        db.close();
    });
});
