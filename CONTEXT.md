# ⚡ SyncSphere – Project Context

## 🚀 Overview
**SyncSphere** is a high-end, real-time collaborative platform designed for hackathon teams. It integrates task management (Kanban), real-time communication (Chat), data-driven analytics, and a "War Room" command center to streamline team coordination during intense coding sessions.

## 🛠️ Technology Stack
### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS + Vanilla CSS (for glassmorphism and animations)
- **State Management**: Zustand
- **Real-Time**: Socket.IO Client
- **Charts**: Recharts
- **Animation**: Framer Motion
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (using `syncsphere.db`) — *Note: Switched from MySQL to SQLite to simplify local environment setup.*
- **Real-Time**: Socket.IO
- **Auth**: JWT (JSON Web Tokens) + Bcryptjs for hashing

## 🗄️ Database Schema (SQLite)
The database is fully normalized (3NF) and includes tables, views, and triggers.

### Key Tables
- **Users**: Authentication, XP points, skills, and online status.
- **Teams**: Team metadata, invite codes, and hackathon deadlines.
- **TeamMembers**: Junction table linking users to teams with specific roles.
- **Tasks**: Kanban tasks with priority, status, and XP rewards.
- **Chats**: Real-time messaging history with sentiment metadata.
- **ActivityLogs**: Audit trail of all significant actions (team creation, task updates, etc.).
- **Notifications**: User-specific alerts for mentions, task assignments, and SOS alerts.
- **Polls & Votes**: Team decision-making tools.
- **Achievements**: Gamification badges awarded to users.
- **SOSAlerts**: Emergency assistance requests within a team.

### Views
- `vw_team_analytics`: Aggregated team progress and productivity metrics.
- `vw_leaderboard`: User rankings based on XP and completed tasks.
- `vw_unread_notifications`: Count of pending alerts per user.
- `vw_team_sentiment`: Morale tracking based on chat sentiment.

## 📁 Project Structure
```
DBMS/
├── frontend/               # React Application
│   ├── src/
│   │   ├── api/            # API client configuration
│   │   ├── store/          # Zustand store definitions
│   │   ├── hooks/          # Custom React hooks (e.g., useSocket)
│   │   ├── components/     # UI components
│   │   └── pages/          # Full page views (Kanban, Chat, etc.)
│
├── backend/                # Node.js Server
│   ├── controllers/        # Business logic for all modules
│   ├── routes/             # API endpoint definitions
│   ├── middleware/         # Auth and logging middleware
│   ├── utils/db.js         # SQLite connection and query helper
│   ├── scripts/            # Database initialization and seeding
│   └── syncsphere.db       # Primary database file
```

## 📡 Real-Time Events (Socket.IO)
- `join-team`: Syncs user presence in a team room.
- `send-message` / `new-message`: Instant chat delivery.
- `typing` / `user-typing`: Real-time feedback in chat.
- `task-move`: Instant Kanban updates for all team members.
- `sos`: Broadcasts emergency alerts.
- `online-users`: Maintains a live list of active team members.

## 🔑 Authentication
- Uses JWT stored in local storage/cookies.
- Protected routes on the backend require a valid token.
- User data and team memberships are fetched on app initialization.

## 🎨 UI/UX Philosophy
- **Theme**: Sleek Dark Mode (default).
- **Aesthetics**: Glassmorphism, neon glows, and smooth transitions using Framer Motion.
- **Responsiveness**: Mobile-first design with a retractable sidebar for desktop.
