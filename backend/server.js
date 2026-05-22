// server.js — SyncSphere Backend Entry Point
require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const path      = require('path');
const { query } = require('./utils/db');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET','POST'] },
  pingTimeout:  Number(process.env.SOCKET_PING_TIMEOUT)  || 60000,
  pingInterval: Number(process.env.SOCKET_PING_INTERVAL) || 25000,
});

// Expose io to Express app so controllers can access it
app.set('io', io);

// ── Middleware ──────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/teams',     require('./routes/teams'));
app.use('/api/teams/:team_id/tasks',      require('./routes/tasks'));
app.use('/api/teams/:team_id/chat',       require('./routes/chat'));
app.use('/api/teams/:team_id/polls',      require('./routes/polls'));
app.use('/api/teams/:team_id/milestones', require('./routes/milestones'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin',     require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Socket.IO Real-Time ─────────────────────────────────────
const onlineUsers = new Map(); // socketId → { userId, teamId, username }

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join team room
  socket.on('join-team', async ({ teamId, userId, username }) => {
    socket.join(`team:${teamId}`);
    onlineUsers.set(socket.id, { userId, teamId, username });
    await query("UPDATE Users SET is_online=1, last_seen=datetime('now') WHERE id=?", [userId]).catch(()=>{});
    socket.to(`team:${teamId}`).emit('user-online', { userId, username });
    const online = [...onlineUsers.values()].filter(u => u.teamId == teamId);
    io.to(`team:${teamId}`).emit('online-users', online);
  });

  // Chat message broadcast
  socket.on('send-message', (data) => {
    io.to(`team:${data.teamId}`).emit('new-message', data);
  });

  // Typing indicator
  socket.on('typing', ({ teamId, username }) => {
    socket.to(`team:${teamId}`).emit('user-typing', { username });
  });
  socket.on('stop-typing', ({ teamId }) => {
    socket.to(`team:${teamId}`).emit('user-stop-typing');
  });

  // Task update broadcast
  socket.on('task-update', (data) => {
    io.to(`team:${data.teamId}`).emit('task-updated', data);
  });

  // Kanban drag
  socket.on('task-move', (data) => {
    io.to(`team:${data.teamId}`).emit('task-moved', data);
  });

  // SOS Alert
  socket.on('sos', (data) => {
    io.to(`team:${data.teamId}`).emit('sos-alert', data);
  });

  // Poll vote
  socket.on('poll-vote', (data) => {
    io.to(`team:${data.teamId}`).emit('poll-updated', data);
  });

  // Cursor position (whiteboard collab)
  socket.on('cursor-move', (data) => {
    socket.to(`team:${data.teamId}`).emit('cursor-moved', { ...data, socketId: socket.id });
  });

  // Disconnect
  socket.on('disconnect', async () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      await query("UPDATE Users SET is_online=0, last_seen=datetime('now') WHERE id=?", [user.userId]).catch(()=>{});
      socket.to(`team:${user.teamId}`).emit('user-offline', { userId: user.userId });
      onlineUsers.delete(socket.id);
      const online = [...onlineUsers.values()].filter(u => u.teamId == user.teamId);
      io.to(`team:${user.teamId}`).emit('online-users', online);
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 SyncSphere Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO active`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL}`);
});

module.exports = { app, io };
