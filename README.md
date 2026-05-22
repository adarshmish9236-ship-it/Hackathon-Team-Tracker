# ⚡ SyncSphere – Real-Time Collaborative Hackathon Team Tracker

> **Hackathon-Level DBMS Project** · Full-Stack · MySQL · React · Node.js · Socket.IO

---

## 🚀 Project Overview

SyncSphere is a production-grade real-time collaboration platform built **specifically for hackathon teams**. It combines the best of Notion + Jira + Discord + Trello + GitHub into one unified hackathon operating system.

---

## 🛠️ Tech Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Frontend    | React 19 + Vite + Tailwind CSS + Framer Motion |
| Backend     | Node.js + Express.js                        |
| Database    | MySQL 8.x (fully normalized relational DB)  |
| Real-Time   | Socket.IO (WebSocket)                       |
| Auth        | JWT + bcryptjs                              |
| Charts      | Recharts                                    |
| State       | Zustand                                     |
| HTTP Client | Axios                                       |

---

## 📁 Project Structure

```
DBMS/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── api/axios.js    # Axios client + all API helpers
│   │   ├── store/          # Zustand global state
│   │   ├── hooks/          # Custom hooks (useSocket)
│   │   ├── components/
│   │   │   └── layout/     # AppLayout (sidebar + topnav)
│   │   └── pages/
│   │       ├── LandingPage.jsx
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── DashboardPage.jsx
│   │       ├── AdminDashboardPage.jsx ← Admin command center
│   │       ├── TeamPage.jsx
│   │       ├── KanbanPage.jsx       ← Drag-and-drop
│   │       ├── ChatPage.jsx         ← Real-time Socket.IO
│   │       ├── AnalyticsPage.jsx    ← Recharts
│   │       ├── AIInsightsPage.jsx   ← AI predictions
│   │       ├── WarRoomPage.jsx      ← Live command center
│   │       ├── HackathonModePage.jsx
│   │       ├── WorkspacePage.jsx
│   │       ├── CreateTeamPage.jsx
│   │       └── ProfilePage.jsx
│   └── package.json
│
├── backend/
│   ├── server.js           # Express + Socket.IO server
│   ├── routes/             # Auth, Teams, Tasks, Chat, Analytics, Polls, Admin
│   ├── controllers/        # Business logic
│   ├── middleware/         # JWT auth middleware
│   ├── utils/db.js         # MySQL2 connection pool
│   ├── scripts/
│   │   ├── schema.sql      # Full DB schema (3NF)
│   │   ├── setupDatabase.js
│   │   └── seedDatabase.js
│   └── .env
```

---

## 🗄️ Database Design (DBMS)

### Tables
| Table | Description |
|-------|-------------|
| `Users` | Core user accounts with XP, streak, skills |
| `Teams` | Hackathon teams with invite codes, deadlines |
| `TeamMembers` | Many-to-many: user↔team with role metadata |
| `Tasks` | Kanban tasks with priority, status, XP reward |
| `Chats` | Real-time messages with sentiment analysis |
| `Notifications` | Push-style alerts per user |
| `Resources` | File uploads per team |
| `Attendance` | Hackathon presence tracking |
| `ProductivityScores` | AI-calculated scores per user/team |
| `Polls` | Team voting questions |
| `Votes` | Individual votes (unique per user/poll) |
| `ActivityLogs` | Full audit trail |
| `Achievements` | Gamification badges |
| `Timers` | Pomodoro + countdown timers |
| `SOSAlerts` | Emergency alerts |

### DBMS Features Implemented
- ✅ **Normalization**: 1NF → 2NF → 3NF (all tables)
- ✅ **Foreign Keys** with ON DELETE CASCADE/SET NULL
- ✅ **Indexes**: Compound indexes for query optimization
- ✅ **Views**: `vw_team_analytics`, `vw_leaderboard`, `vw_unread_notifications`, `vw_team_sentiment`
- ✅ **Triggers**: Auto XP award on task completion, SOS notifications, activity logging
- ✅ **Stored Procedures**: `sp_calc_productivity`, `sp_update_team_health`
- ✅ **Transactions**: Via stored procedures and multi-step inserts
- ✅ **Constraints**: UNIQUE, NOT NULL, CHECK via ENUMs

---

## ✨ Key Features

### Core Platform
- 🔐 JWT authentication with bcrypt password hashing
- 👥 Team creation with unique 8-char invite codes
- �️ Admin command center with user/team governance, telemetry, threats, and broadcast tools
- �📋 Drag-and-drop Kanban board (5 columns, real-time sync)
- 💬 Real-time team chat with typing indicators, reactions, replies
- 📊 Analytics dashboard with 6+ chart types (Recharts)

### AI-Powered Features
- 🧠 **Productivity Score Engine** (tasks × attendance × chat × uploads)
- ⚠️ **Burnout Detection** (low score + inactivity pattern)
- 🤖 **AI Meeting Notes** (auto-summary from chat history)
- 🎯 **Deadline Predictor** (completion% vs time remaining)
- 💡 **Smart Role Allocation** (based on scores and skills)

### Real-Time Features (Socket.IO)
- Live presence (who's online)
- Typing indicators
- Kanban drag broadcast
- SOS emergency alerts
- Poll vote updates

### War Room
- ⏱ Live countdown timer to deadline
- 😤 Animated stress meter
- 📡 Real-time activity feed
- 🗳 Team polls and voting
- 🤖 AI completion prediction

### Gamification
- ⚡ XP points (awarded via database trigger)
- 🏆 Achievement badges
- 🔥 Streak tracking
- 📈 Contribution scores

---

## 🚦 Setup & Run

### Prerequisites
- Node.js v18+
- MySQL 8.x running locally

### 1. Database Setup
```bash
# Edit backend/.env with your MySQL credentials
cd backend
node scripts/setupDatabase.js   # Creates all tables, views, triggers, procedures
node scripts/seedDatabase.js    # Inserts demo data
```

### 2. Backend
```bash
cd backend
npm install
npm run dev         # Starts on port 5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev         # Starts on port 5173
```

### 4. Open Browser
```
http://localhost:5173
```

**Demo Credentials:**
- Email: `alice@syncsphere.io`
- Password: `password123`
- Admin dashboard: `/app/admin`
- Seeded sample teams: `Nebula Coders`, `Phoenix Squad`

---

## 🎨 UI Design System

- **Color Palette**: Dark Navy (#050b18) · Electric Blue (#4f8ef7) · Neon Purple (#a855f7) · Cyan (#06b6d4)
- **Glassmorphism**: `backdrop-filter: blur(20px)` + translucent backgrounds
- **Neon Glows**: CSS box-shadow glow effects on interactive elements
- **Animations**: Framer Motion for page transitions, card hovers, loading states
- **Typography**: Inter + Space Grotesk + JetBrains Mono
- **Theme**: Dark/Light toggle (CSS custom properties)
- **Responsive**: Mobile-first, sidebar collapses on small screens

---

## 📡 API Endpoints

```
POST /api/auth/register        Register new user
POST /api/auth/login           Login
GET  /api/auth/me              Get current user + teams + badges

POST /api/teams                Create team
POST /api/teams/join           Join via invite code
GET  /api/teams/my             Get my teams
GET  /api/teams/:id            Get team + members + analytics

GET  /api/teams/:id/tasks      Get all tasks (grouped by status)
POST /api/teams/:id/tasks      Create task
PUT  /api/teams/:id/tasks/:tid Update task
PATCH /api/teams/:id/tasks/:tid/move  Move task (Kanban)

GET  /api/teams/:id/chat       Get messages
POST /api/teams/:id/chat       Send message
POST /api/teams/:id/chat/:mid/react  Add reaction

GET  /api/analytics/:id        Full team analytics
GET  /api/analytics/:id/insights  AI insights + predictions
POST /api/analytics/:id/user/:uid/calc  Recalculate productivity

POST /api/teams/:id/polls      Create poll
POST /api/teams/:id/polls/:pid/vote  Vote on poll
GET  /api/admin/users             Get all users (admin only)
PUT  /api/admin/users/:id/role     Update user role (admin only)
DELETE /api/admin/users/:id        Delete user (admin only)
GET  /api/admin/teams              Get all teams (admin only)
DELETE /api/admin/teams/:id        Delete team (admin only)
GET  /api/admin/telemetry          Get admin telemetry data
GET  /api/admin/threats            Get recent threat log entries
GET  /api/admin/database           Get database statistics
GET  /api/admin/settings           Get admin settings
PUT  /api/admin/settings           Update admin settings
POST /api/admin/broadcast         Send broadcast message```

---

## 🔮 Future Scope

- [ ] Voice/Video chat integration (WebRTC)
- [ ] Collaborative whiteboard (Canvas API)
- [ ] GitHub/GitLab integration (commit tracking)
- [ ] Mobile app (React Native)
- [ ] AI chatbot assistant (OpenAI API)
- [ ] Sponsor management module
- [ ] Offline PWA mode
- [ ] Automated daily standup generator

---

## 👨‍💻 Made For

University DBMS Project · Hackathon Exhibition · Production-Ready Architecture

**License**: MIT
