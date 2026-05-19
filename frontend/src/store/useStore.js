// src/store/useStore.js — Upgraded Zustand global state
import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('ss_token') || null,
  setUser: (user) => set({ user }),
  setToken: (token) => { localStorage.setItem('ss_token', token); set({ token }); },
  logout: () => { localStorage.removeItem('ss_token'); set({ user: null, token: null, currentTeam: null, myTeams: [] }); },

  // Theme
  theme: localStorage.getItem('ss_theme') || 'dark',
  toggleTheme: () => {
    const t = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('ss_theme', t);
    document.documentElement.setAttribute('data-theme', t);
    set({ theme: t });
  },

  // Team
  currentTeam: null,
  setCurrentTeam: (team) => set({ currentTeam: team }),
  myTeams: [],
  setMyTeams: (teams) => set({ myTeams: teams }),

  // Notifications
  notifications: [],
  unreadCount: 0,
  setNotifications: (n) => set({ notifications: n }),
  setUnreadCount: (c) => set({ unreadCount: c }),
  addNotification: (n) => set(s => ({ notifications: [n, ...s.notifications], unreadCount: s.unreadCount + 1 })),

  // Online users (socket)
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  // SOS
  sosActive: false,
  activeSOS: null,
  setSosActive: (v) => set({ sosActive: v }),
  setActiveSOS: (sos) => set({ activeSOS: sos, sosActive: !!sos }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  // AI Insights cache
  aiInsights: null,
  setAIInsights: (d) => set({ aiInsights: d }),

  // Hackathon Mode
  hackathonMode: false,
  presentationMode: false,
  toggleHackathonMode: () => set(s => ({ hackathonMode: !s.hackathonMode })),
  setPresentationMode: (v) => set({ presentationMode: v }),

  // Voice Command
  voiceActive: false,
  setVoiceActive: (v) => set({ voiceActive: v }),

  // XP Burst animation queue
  xpBurst: null,
  triggerXPBurst: (amount) => { set({ xpBurst: { amount, id: Date.now() } }); setTimeout(() => set({ xpBurst: null }), 2000); },
}));
