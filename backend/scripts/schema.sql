-- ============================================================
-- SyncSphere DBMS - Complete Relational Schema
-- Normalized to 3NF with indexes, triggers, views, procedures
-- ============================================================

CREATE DATABASE IF NOT EXISTS syncsphere_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE syncsphere_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABLE: Users (1NF, 2NF, 3NF compliant)
-- ============================================================
CREATE TABLE IF NOT EXISTS Users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    avatar_url  VARCHAR(500) DEFAULT NULL,
    role        ENUM('admin','member','guest') DEFAULT 'member',
    bio         TEXT DEFAULT NULL,
    skills      JSON DEFAULT NULL,
    xp_points   INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    is_online   BOOLEAN DEFAULT FALSE,
    last_seen   DATETIME DEFAULT NULL,
    theme_pref  ENUM('dark','light','system') DEFAULT 'dark',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email   (email),
    INDEX idx_users_username(username),
    INDEX idx_users_online  (is_online)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Teams
-- ============================================================
CREATE TABLE IF NOT EXISTS Teams (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  TEXT DEFAULT NULL,
    invite_code  VARCHAR(10)  NOT NULL UNIQUE,
    logo_url     VARCHAR(500) DEFAULT NULL,
    hackathon_name VARCHAR(150) DEFAULT NULL,
    deadline     DATETIME DEFAULT NULL,
    status       ENUM('forming','active','completed','archived') DEFAULT 'active',
    health_score DECIMAL(5,2) DEFAULT 100.00,
    owner_id     INT NOT NULL,
    max_members  INT DEFAULT 10,
    tags         JSON DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_teams_invite  (invite_code),
    INDEX idx_teams_owner   (owner_id),
    INDEX idx_teams_status  (status)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: TeamMembers (junction + role metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS TeamMembers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    team_id     INT NOT NULL,
    user_id     INT NOT NULL,
    role_tag    ENUM('frontend','backend','designer','presenter','debugger','fullstack','lead','member') DEFAULT 'member',
    joined_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active   BOOLEAN DEFAULT TRUE,
    contribution_score DECIMAL(6,2) DEFAULT 0.00,
    UNIQUE KEY uq_team_user (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES Teams(id)  ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id)   ON DELETE CASCADE,
    INDEX idx_tm_team (team_id),
    INDEX idx_tm_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Tasks (Kanban)
-- ============================================================
CREATE TABLE IF NOT EXISTS Tasks (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    team_id      INT NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT DEFAULT NULL,
    status       ENUM('todo','in_progress','review','done','blocked') DEFAULT 'todo',
    priority     ENUM('low','medium','high','critical') DEFAULT 'medium',
    assigned_to  INT DEFAULT NULL,
    created_by   INT NOT NULL,
    due_date     DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    tags         JSON DEFAULT NULL,
    xp_reward    INT DEFAULT 10,
    story_points INT DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id)     REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by)  REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_tasks_team   (team_id),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_assigned(assigned_to),
    INDEX idx_tasks_due    (due_date)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Chats (messages per team/DM)
-- ============================================================
CREATE TABLE IF NOT EXISTS Chats (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    team_id     INT NOT NULL,
    sender_id   INT NOT NULL,
    message     TEXT NOT NULL,
    message_type ENUM('text','file','image','code','system') DEFAULT 'text',
    file_url    VARCHAR(500) DEFAULT NULL,
    reply_to    INT DEFAULT NULL,
    reactions   JSON DEFAULT NULL,
    sentiment   ENUM('positive','neutral','negative') DEFAULT 'neutral',
    is_pinned   BOOLEAN DEFAULT FALSE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id)   REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to)  REFERENCES Chats(id) ON DELETE SET NULL,
    INDEX idx_chats_team   (team_id),
    INDEX idx_chats_sender (sender_id),
    INDEX idx_chats_created(created_at)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS Notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    team_id     INT DEFAULT NULL,
    type        ENUM('task','chat','sos','achievement','mention','deadline','system') DEFAULT 'system',
    title       VARCHAR(200) NOT NULL,
    body        TEXT DEFAULT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    action_url  VARCHAR(300) DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE SET NULL,
    INDEX idx_notif_user  (user_id),
    INDEX idx_notif_read  (is_read),
    INDEX idx_notif_type  (type)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Resources (file uploads)
-- ============================================================
CREATE TABLE IF NOT EXISTS Resources (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    team_id      INT NOT NULL,
    uploaded_by  INT NOT NULL,
    file_name    VARCHAR(200) NOT NULL,
    file_url     VARCHAR(500) NOT NULL,
    file_type    VARCHAR(50)  DEFAULT NULL,
    file_size    BIGINT DEFAULT 0,
    category     ENUM('doc','image','code','design','presentation','other') DEFAULT 'other',
    description  TEXT DEFAULT NULL,
    download_count INT DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id)     REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_res_team (team_id),
    INDEX idx_res_type (file_type)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Attendance (track hackathon presence)
-- ============================================================
CREATE TABLE IF NOT EXISTS Attendance (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    team_id     INT NOT NULL,
    user_id     INT NOT NULL,
    check_in    DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_out   DATETIME DEFAULT NULL,
    session_type ENUM('online','offline','hybrid') DEFAULT 'online',
    duration_mins INT DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_att_team (team_id),
    INDEX idx_att_user (user_id),
    INDEX idx_att_checkin(check_in)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: ProductivityScores (AI-generated scores)
-- ============================================================
CREATE TABLE IF NOT EXISTS ProductivityScores (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    team_id        INT NOT NULL,
    tasks_score    DECIMAL(5,2) DEFAULT 0,
    attendance_score DECIMAL(5,2) DEFAULT 0,
    chat_score     DECIMAL(5,2) DEFAULT 0,
    upload_score   DECIMAL(5,2) DEFAULT 0,
    overall_score  DECIMAL(5,2) DEFAULT 0,
    burnout_risk   ENUM('low','medium','high') DEFAULT 'low',
    mood           ENUM('great','good','neutral','stressed','burned_out') DEFAULT 'neutral',
    calculated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE,
    INDEX idx_ps_user (user_id),
    INDEX idx_ps_team (team_id),
    INDEX idx_ps_date (calculated_at)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Polls
-- ============================================================
CREATE TABLE IF NOT EXISTS Polls (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    team_id      INT NOT NULL,
    created_by   INT NOT NULL,
    question     VARCHAR(300) NOT NULL,
    options      JSON NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    expires_at   DATETIME DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id)    REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_polls_team (team_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Votes
-- ============================================================
CREATE TABLE IF NOT EXISTS Votes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    poll_id    INT NOT NULL,
    user_id    INT NOT NULL,
    option_idx INT NOT NULL,
    voted_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_poll_user (poll_id, user_id),
    FOREIGN KEY (poll_id) REFERENCES Polls(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: ActivityLogs (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS ActivityLogs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    team_id     INT DEFAULT NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50)  DEFAULT NULL,
    entity_id   INT DEFAULT NULL,
    meta        JSON DEFAULT NULL,
    ip_address  VARCHAR(45)  DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_al_user   (user_id),
    INDEX idx_al_team   (team_id),
    INDEX idx_al_action (action),
    INDEX idx_al_date   (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Achievements
-- ============================================================
CREATE TABLE IF NOT EXISTS Achievements (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    badge_name  VARCHAR(100) NOT NULL,
    badge_icon  VARCHAR(10)  DEFAULT '🏆',
    badge_color VARCHAR(20)  DEFAULT '#FFD700',
    description VARCHAR(200) DEFAULT NULL,
    xp_bonus    INT DEFAULT 50,
    earned_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_ach_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: SOSAlerts
-- ============================================================
CREATE TABLE IF NOT EXISTS SOSAlerts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    team_id     INT NOT NULL,
    triggered_by INT NOT NULL,
    message     TEXT DEFAULT NULL,
    severity    ENUM('low','medium','high','critical') DEFAULT 'high',
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT DEFAULT NULL,
    resolved_at DATETIME DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id)      REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (triggered_by) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by)  REFERENCES Users(id) ON DELETE SET NULL,
    INDEX idx_sos_team (team_id),
    INDEX idx_sos_active (is_resolved)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: Timers (Pomodoro / hackathon countdown)
-- ============================================================
CREATE TABLE IF NOT EXISTS Timers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    team_id     INT NOT NULL,
    created_by  INT NOT NULL,
    timer_type  ENUM('pomodoro','countdown','stopwatch') DEFAULT 'countdown',
    duration_secs INT NOT NULL,
    label       VARCHAR(100) DEFAULT NULL,
    started_at  DATETIME DEFAULT NULL,
    ended_at    DATETIME DEFAULT NULL,
    is_running  BOOLEAN DEFAULT FALSE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id)    REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- VIEWS
-- ============================================================

-- View: Team analytics overview
CREATE OR REPLACE VIEW vw_team_analytics AS
SELECT
    t.id          AS team_id,
    t.name        AS team_name,
    COUNT(DISTINCT tm.user_id) AS member_count,
    COUNT(DISTINCT CASE WHEN tk.status='done' THEN tk.id END)         AS tasks_done,
    COUNT(DISTINCT tk.id)                                              AS tasks_total,
    ROUND(COUNT(DISTINCT CASE WHEN tk.status='done' THEN tk.id END)
          / NULLIF(COUNT(DISTINCT tk.id),0) * 100, 2)                 AS completion_pct,
    AVG(ps.overall_score)     AS avg_productivity,
    t.health_score,
    t.deadline
FROM Teams t
LEFT JOIN TeamMembers  tm ON tm.team_id = t.id
LEFT JOIN Tasks        tk ON tk.team_id = t.id
LEFT JOIN ProductivityScores ps ON ps.team_id = t.id
GROUP BY t.id;

-- View: Member leaderboard
CREATE OR REPLACE VIEW vw_leaderboard AS
SELECT
    u.id, u.username, u.full_name, u.avatar_url, u.xp_points, u.streak_days,
    COUNT(DISTINCT a.id)  AS badge_count,
    COUNT(DISTINCT tk.id) AS tasks_completed,
    tm.team_id
FROM Users u
JOIN TeamMembers tm ON tm.user_id = u.id
LEFT JOIN Achievements a  ON a.user_id = u.id
LEFT JOIN Tasks       tk  ON tk.assigned_to = u.id AND tk.status = 'done'
GROUP BY u.id, tm.team_id
ORDER BY u.xp_points DESC;

-- View: Unread notifications per user
CREATE OR REPLACE VIEW vw_unread_notifications AS
SELECT user_id, COUNT(*) AS unread_count
FROM Notifications
WHERE is_read = FALSE
GROUP BY user_id;

-- View: Chat sentiment per team
CREATE OR REPLACE VIEW vw_team_sentiment AS
SELECT
    team_id,
    COUNT(*) AS total_messages,
    SUM(CASE WHEN sentiment='positive' THEN 1 ELSE 0 END) AS positive,
    SUM(CASE WHEN sentiment='neutral'  THEN 1 ELSE 0 END) AS neutral,
    SUM(CASE WHEN sentiment='negative' THEN 1 ELSE 0 END) AS negative,
    ROUND(SUM(CASE WHEN sentiment='positive' THEN 1 ELSE 0 END)/COUNT(*)*100,1) AS morale_score
FROM Chats
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY team_id;

-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER $$

-- Trigger: Award XP when task is completed
CREATE TRIGGER trg_task_complete_xp
AFTER UPDATE ON Tasks
FOR EACH ROW
BEGIN
    IF NEW.status = 'done' AND OLD.status != 'done' AND NEW.assigned_to IS NOT NULL THEN
        UPDATE Users SET xp_points = xp_points + NEW.xp_reward WHERE id = NEW.assigned_to;
        UPDATE TeamMembers
            SET contribution_score = contribution_score + 1
            WHERE user_id = NEW.assigned_to AND team_id = NEW.team_id;
        SET NEW.completed_at = NOW();
        INSERT INTO Notifications (user_id, team_id, type, title, body)
        VALUES (NEW.assigned_to, NEW.team_id, 'achievement',
                'Task Completed! 🎉', CONCAT('You earned +', NEW.xp_reward, ' XP'));
    END IF;
END$$

-- Trigger: Log task creation in ActivityLogs
CREATE TRIGGER trg_task_created_log
AFTER INSERT ON Tasks
FOR EACH ROW
BEGIN
    INSERT INTO ActivityLogs (user_id, team_id, action, entity_type, entity_id)
    VALUES (NEW.created_by, NEW.team_id, 'task_created', 'Task', NEW.id);
END$$

-- Trigger: Auto-notify SOS
CREATE TRIGGER trg_sos_notify
AFTER INSERT ON SOSAlerts
FOR EACH ROW
BEGIN
    INSERT INTO Notifications (user_id, team_id, type, title, body)
    SELECT tm.user_id, NEW.team_id, 'sos',
           '🆘 SOS Alert Triggered!',
           COALESCE(NEW.message, 'Team member needs urgent help!')
    FROM TeamMembers tm
    WHERE tm.team_id = NEW.team_id AND tm.user_id != NEW.triggered_by;
END$$

-- Trigger: Set completed_at on task done
CREATE TRIGGER trg_task_done_timestamp
BEFORE UPDATE ON Tasks
FOR EACH ROW
BEGIN
    IF NEW.status = 'done' AND OLD.status != 'done' THEN
        SET NEW.completed_at = NOW();
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- Procedure: Calculate productivity score for a user in a team
CREATE PROCEDURE sp_calc_productivity(IN p_user_id INT, IN p_team_id INT)
BEGIN
    DECLARE v_task_score   DECIMAL(5,2) DEFAULT 0;
    DECLARE v_att_score    DECIMAL(5,2) DEFAULT 0;
    DECLARE v_chat_score   DECIMAL(5,2) DEFAULT 0;
    DECLARE v_upload_score DECIMAL(5,2) DEFAULT 0;
    DECLARE v_overall      DECIMAL(5,2) DEFAULT 0;
    DECLARE v_burnout      ENUM('low','medium','high') DEFAULT 'low';

    -- Task score: % of assigned tasks completed in last 7 days
    SELECT ROUND(
        COUNT(CASE WHEN status='done' THEN 1 END) / NULLIF(COUNT(*),0) * 100, 2
    ) INTO v_task_score
    FROM Tasks
    WHERE assigned_to = p_user_id AND team_id = p_team_id
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

    -- Attendance score: total hours checked in last 7 days (max 100)
    SELECT LEAST(ROUND(COALESCE(SUM(duration_mins)/60,0) / 8 * 100, 2), 100)
    INTO v_att_score
    FROM Attendance
    WHERE user_id = p_user_id AND team_id = p_team_id
      AND check_in >= DATE_SUB(NOW(), INTERVAL 7 DAY);

    -- Chat score: messages in last 7 days (max 100 msgs = 100pts)
    SELECT LEAST(COUNT(*), 100) INTO v_chat_score
    FROM Chats
    WHERE sender_id = p_user_id AND team_id = p_team_id
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

    -- Upload score: resources uploaded
    SELECT LEAST(COUNT(*) * 10, 100) INTO v_upload_score
    FROM Resources
    WHERE uploaded_by = p_user_id AND team_id = p_team_id
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

    -- Weighted overall score
    SET v_overall = (v_task_score*0.4 + v_att_score*0.3 + v_chat_score*0.2 + v_upload_score*0.1);

    -- Burnout risk
    IF v_overall < 30 THEN SET v_burnout = 'high';
    ELSEIF v_overall < 60 THEN SET v_burnout = 'medium';
    END IF;

    INSERT INTO ProductivityScores
        (user_id, team_id, tasks_score, attendance_score, chat_score, upload_score, overall_score, burnout_risk)
    VALUES
        (p_user_id, p_team_id, v_task_score, v_att_score, v_chat_score, v_upload_score, v_overall, v_burnout)
    ON DUPLICATE KEY UPDATE
        tasks_score=v_task_score, attendance_score=v_att_score,
        chat_score=v_chat_score, upload_score=v_upload_score,
        overall_score=v_overall, burnout_risk=v_burnout, calculated_at=NOW();
END$$

-- Procedure: Update team health score
CREATE PROCEDURE sp_update_team_health(IN p_team_id INT)
BEGIN
    DECLARE v_health DECIMAL(5,2) DEFAULT 100;
    DECLARE v_overdue INT DEFAULT 0;
    DECLARE v_inactive INT DEFAULT 0;
    DECLARE v_avg_prod DECIMAL(5,2) DEFAULT 0;

    SELECT COUNT(*) INTO v_overdue FROM Tasks
    WHERE team_id = p_team_id AND due_date < NOW() AND status != 'done';

    SELECT COUNT(*) INTO v_inactive FROM TeamMembers tm
    WHERE tm.team_id = p_team_id
      AND NOT EXISTS (
        SELECT 1 FROM ActivityLogs al
        WHERE al.user_id = tm.user_id AND al.team_id = p_team_id
          AND al.created_at >= DATE_SUB(NOW(), INTERVAL 2 DAY));

    SELECT COALESCE(AVG(overall_score),50) INTO v_avg_prod
    FROM ProductivityScores WHERE team_id = p_team_id;

    SET v_health = GREATEST(0,
        100 - (v_overdue * 5) - (v_inactive * 10) + (v_avg_prod - 50) * 0.3);

    UPDATE Teams SET health_score = v_health WHERE id = p_team_id;
END$$

DELIMITER ;

-- ============================================================
-- INDEXES (extra compound for query optimization)
-- ============================================================
CREATE INDEX idx_tasks_team_status ON Tasks(team_id, status);
CREATE INDEX idx_chats_team_date   ON Chats(team_id, created_at DESC);
CREATE INDEX idx_al_team_date      ON ActivityLogs(team_id, created_at DESC);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'SyncSphere schema created successfully!' AS status;
