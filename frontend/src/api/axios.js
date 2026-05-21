// src/api/axios.js — Upgraded API client
import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ss_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ss_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login:    (d) => api.post('/auth/login', d),
  me:       ()  => api.get('/auth/me'),
  myTasks:  ()  => api.get('/auth/my-tasks'),
  auditLogs: () => api.get('/auth/audit-logs'),
  logout:   ()  => api.post('/auth/logout'),
  update:   (d) => api.put('/auth/profile', d),
};

export const teamAPI = {
  create:      (d)        => api.post('/teams', d),
  join:        (code)     => api.post('/teams/join', { invite_code: code }),
  getMyTeams:  ()         => api.get('/teams/my'),
  getTeam:     (id)       => api.get(`/teams/${id}`),
  updateTeam:  (id, d)    => api.put(`/teams/${id}`, d),
  leaderboard: (id)       => api.get(`/teams/${id}/leaderboard`),
  setRole:     (tid,uid,role) => api.put(`/teams/${tid}/members/${uid}/role`, { role_tag: role }),
};

export const taskAPI = {
  getAll:  (tid)         => api.get(`/teams/${tid}/tasks`),
  create:  (tid, d)      => api.post(`/teams/${tid}/tasks`, d),
  update:  (tid, id, d)  => api.put(`/teams/${tid}/tasks/${id}`, d),
  delete:  (tid, id)     => api.delete(`/teams/${tid}/tasks/${id}`),
  move:    (tid, id, status) => api.patch(`/teams/${tid}/tasks/${id}/move`, { status }),
};

export const chatAPI = {
  getMessages: (tid, p={})      => api.get(`/teams/${tid}/chat`, { params: p }),
  send:        (tid, d)         => api.post(`/teams/${tid}/chat`, d),
  react:       (tid, id, emoji) => api.post(`/teams/${tid}/chat/${id}/react`, { emoji }),
  sentiment:   (tid)            => api.get(`/teams/${tid}/chat/sentiment`),
};

export const analyticsAPI = {
  getAll:       (tid)      => api.get(`/analytics/${tid}`),
  getInsights:  (tid)      => api.get(`/analytics/${tid}/insights`),
  userActivity: (tid, uid) => api.get(`/analytics/${tid}/user/${uid}`),
  calcScore:    (tid, uid) => api.post(`/analytics/${tid}/user/${uid}/calc`),
};

export const pollAPI = {
  getAll:  (tid)           => api.get(`/teams/${tid}/polls`),
  create:  (tid, d)        => api.post(`/teams/${tid}/polls`, d),
  vote:    (tid, pid, idx) => api.post(`/teams/${tid}/polls/${pid}/vote`, { option_idx: idx }),
};

export const sosAPI = {
  trigger:  (tid, d)  => api.post(`/teams/${tid}/polls/sos`, d),
  getAlerts:(tid)     => api.get(`/teams/${tid}/polls/sos`),
  resolve:  (tid, id) => api.patch(`/teams/${tid}/polls/sos/${id}/resolve`),
};

export const notifAPI = {
  getAll:   () => api.get('/teams/1/polls/notifications'),
  markRead: () => api.post('/teams/1/polls/notifications/read'),
};

export const milestonesAPI = {
  getAll:   (tid)    => api.get(`/teams/${tid}/milestones`),
  create:   (tid, d) => api.post(`/teams/${tid}/milestones`, d),
  toggle:   (tid, id) => api.patch(`/teams/${tid}/milestones/${id}/toggle`),
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getTeams: () => api.get('/admin/teams'),
  deleteTeam: (id) => api.delete(`/admin/teams/${id}`),
  getTelemetry: () => api.get('/admin/telemetry'),
  getThreats: () => api.get('/admin/threats'),
  getDatabaseStats: () => api.get('/admin/database'),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, value) => api.put('/admin/settings', { key, value }),
  broadcast: (message, severity) => api.post('/admin/broadcast', { message, severity }),
};
