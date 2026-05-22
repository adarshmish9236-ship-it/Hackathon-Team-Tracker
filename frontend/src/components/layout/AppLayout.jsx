// src/components/layout/AppLayout.jsx — Premium Redesign v2
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState, useRef } from 'react';
import { teamAPI, notifAPI } from '../../api/axios';
import {
  LayoutDashboard, Kanban, MessageCircle, BarChart3,
  TrendingUp, Swords, User, Sun, Moon, Menu, X, Zap,
  ChevronDown, LogOut, Plus, Rocket, Shield, Target,
  Command, Search, ArrowRight, ChevronRight, Activity,
  Bell, Settings, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import SOSAlert from '../ui/SOSAlert';
import XPBurst from '../ui/XPBurst';
import VoiceCommand from '../ui/VoiceCommand';

// ── Command Palette ────────────────────────────────────────────────
function CommandPalette({ open, onClose, currentTeam, navigate }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const teamPath = (sub) => currentTeam ? `/app/teams/${currentTeam.id}/${sub}` : null;

  const allActions = [
    { icon: LayoutDashboard, label: 'Dashboard',      desc: 'Your personal hub',     path: '/app',                    color: '#6366f1' },
    { icon: Kanban,          label: 'Kanban Board',   desc: 'Drag-and-drop tasks',   path: teamPath('kanban'),        color: '#06b6d4' },
    { icon: MessageCircle,   label: 'Team Chat',      desc: 'Real-time messaging',   path: teamPath('chat'),          color: '#8b5cf6' },
    { icon: BarChart3,       label: 'Analytics',      desc: 'Performance metrics',   path: teamPath('analytics'),     color: '#f59e0b' },
    { icon: TrendingUp,       label: 'Insights',       desc: 'Team performance and workload metrics', path: teamPath('insights'), color: '#10b981' },
    { icon: Swords,          label: 'War Room',       desc: 'Mission control',       path: teamPath('warroom'),       color: '#f43f5e' },
    { icon: Rocket,          label: 'Hackathon Mode', desc: 'Sprint milestones',     path: teamPath('hackathon'),     color: '#f97316' },
    { icon: Plus,            label: 'Create Team',    desc: 'Start a new team',      path: '/app/create-team',        color: '#6366f1' },
    { icon: User,            label: 'Profile',        desc: 'Your account & XP',     path: '/app/profile',            color: '#8b5cf6' },
  ].filter(a => a.path);

  const filtered = query.trim()
    ? allActions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.desc.toLowerCase().includes(query.toLowerCase())
      )
    : allActions;

  const go = (path) => { navigate(path); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="command-overlay"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="command-palette"
          >
            {/* Search Input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-sm)',
            }}>
              <Search size={17} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') onClose();
                  if (e.key === 'Enter' && filtered[0]) go(filtered[0].path);
                }}
                placeholder="Search pages, actions..."
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: 15, flex: 1,
                  fontFamily: 'var(--font-sans)',
                }}
              />
              <kbd style={{
                background: 'var(--space-raised)', border: '1px solid var(--border-sm)',
                borderRadius: 6, padding: '2px 8px', fontSize: 11, color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{ padding: '8px', maxHeight: 400, overflowY: 'auto' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No results for "{query}"
                </div>
              )}
              {filtered.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => go(action.path)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--text-primary)', transition: 'background 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${action.color}15`,
                      border: `1px solid ${action.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} style={{ color: action.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 1 }}>{action.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{action.desc}</div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div style={{
              padding: '10px 20px',
              borderTop: '1px solid var(--border-sm)',
              display: 'flex', gap: 16, alignItems: 'center',
            }}>
              {[['↑↓', 'Navigate'], ['↵', 'Open'], ['ESC', 'Close']].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <kbd style={{ background: 'var(--space-raised)', border: '1px solid var(--border-sm)', borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{key}</kbd>
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main AppLayout ─────────────────────────────────────────────────
export default function AppLayout() {
  const {
    user, logout, theme, toggleTheme, myTeams, setMyTeams,
    currentTeam, setCurrentTeam, sidebarOpen, toggleSidebar,
    unreadCount, setUnreadCount, onlineUsers, setSosActive, setActiveSOS,
    hackathonMode, toggleHackathonMode, triggerXPBurst,
  } = useStore();

  const navigate  = useNavigate();
  const location  = useLocation();
  const socket    = useSocket();
  const [teamDropdown, setTeamDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [sysNotifs, setSysNotifs] = useState([]);
  const [sysUnread, setSysUnread] = useState(0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const dropRef = useRef(null);
  const notifRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fetchNotifs = () => {
    notifAPI.getAll().then(r => {
      setSysNotifs(r.data.notifications);
      setSysUnread(r.data.unread_count);
    }).catch(()=>{});
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setTeamDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    teamAPI.getMyTeams().then(r => {
      setMyTeams(r.data);
      if (!currentTeam && r.data.length) setCurrentTeam(r.data[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('sos-alert', (data) => {
      setSosActive(true);
      setActiveSOS(data);
      toast.error(`🆘 SOS: ${data.message || 'Emergency!'}`, { duration: 8000 });
    });
    socket.on('new-message', () => {
      if (!location.pathname.includes('/chat')) setUnreadCount(c => c + 1);
      fetchNotifs();
    });
    socket.on('task-updated', (data) => {
      if (data.xpAwarded) triggerXPBurst(data.xpAwarded);
    });
    return () => {
      socket.off('sos-alert');
      socket.off('new-message');
      socket.off('task-updated');
    };
  }, [socket, location]);

  const handleLogout = () => { logout(); navigate('/'); toast.success('See you soon! 👋'); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const teamPath = (sub) => currentTeam ? `/app/teams/${currentTeam.id}/${sub}` : '#';

  const navLinks = [
    { icon: LayoutDashboard, label: 'Dashboard',      path: '/app',                   group: 'main' },
    { icon: Users,           label: 'My Team',        path: currentTeam ? `/app/teams/${currentTeam.id}` : '#', group: 'main', reqTeam: true },
    ...(user?.role === 'admin' ? [{ icon: Shield, label: 'Admin',  path: '/app/admin', group: 'main' }] : []),
    { icon: Kanban,          label: 'Kanban',         path: teamPath('kanban'),        group: 'team', reqTeam: true },
    { icon: MessageCircle,   label: 'Chat',           path: teamPath('chat'),          group: 'team', badge: unreadCount > 0 ? unreadCount : null, reqTeam: true },
    { icon: BarChart3,       label: 'Analytics',      path: teamPath('analytics'),     group: 'team', reqTeam: true },
    { icon: TrendingUp,       label: 'Insights',       path: teamPath('insights'),      group: 'team', reqTeam: true },
    { icon: Swords,          label: 'War Room',       path: teamPath('warroom'),       group: 'team', reqTeam: true },
    { icon: Rocket,          label: 'Hackathon',      path: teamPath('hackathon'),     group: 'special', special: true, reqTeam: true },
  ];

  const SIDEBAR_W = 248;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--space-deep)' }}>
      {/* Global overlays */}
      <SOSAlert />
      <XPBurst />
      <VoiceCommand />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        currentTeam={currentTeam}
        navigate={navigate}
      />

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -SIDEBAR_W - 20 }}
            animate={{ x: 0 }}
            exit={{ x: -SIDEBAR_W - 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            style={{
              width: SIDEBAR_W,
              minHeight: '100vh',
              position: 'fixed',
              top: 0, left: 0, bottom: 0,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(5,8,15,0.97)',
              borderRight: '1px solid rgba(99,102,241,0.1)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
            }}
          >
            {/* Logo */}
            <div style={{ padding: '20px 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(99,102,241,0.5)',
                  flexShrink: 0,
                }}
              >
                <Zap size={18} color="white" fill="white" />
              </motion.div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800, fontSize: 15,
                  background: 'linear-gradient(135deg, #818cf8, #a78bfa, #22d3ee)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>SyncSphere</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  Mission OS
                </div>
              </div>
            </div>

            {/* Team Selector */}
            <div style={{ padding: '0 10px 12px' }} ref={dropRef}>
              {currentTeam ? (
                <>
                  <button
                    onClick={() => setTeamDropdown(!teamDropdown)}
                    style={{
                      width: '100%', padding: '8px 12px',
                      borderRadius: 10,
                      background: 'rgba(99,102,241,0.07)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      color: 'var(--text-primary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 13, fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, color: 'white', flexShrink: 0,
                    }}>
                      {currentTeam.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                      {currentTeam.name}
                    </span>
                    <div className="dot-online" style={{ width: 6, height: 6 }} />
                    <ChevronDown size={12} style={{
                      transform: teamDropdown ? 'rotate(180deg)' : 'none',
                      transition: '0.2s', flexShrink: 0, color: 'var(--text-muted)',
                    }} />
                  </button>

                  <AnimatePresence>
                    {teamDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          marginTop: 4, borderRadius: 12,
                          background: 'rgba(12,18,32,0.98)',
                          border: '1px solid var(--border-sm)',
                          overflow: 'hidden',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                      >
                        {myTeams.map(t => (
                          <button
                            key={t.id}
                            onClick={() => { setCurrentTeam(t); setTeamDropdown(false); navigate(`/app/teams/${t.id}`); }}
                            style={{
                              width: '100%', padding: '9px 14px',
                              background: t.id === currentTeam?.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                              border: 'none',
                              color: t.id === currentTeam?.id ? 'var(--indigo-light)' : 'var(--text-primary)',
                              cursor: 'pointer', textAlign: 'left',
                              fontSize: 13, fontWeight: t.id === currentTeam?.id ? 600 : 400,
                              display: 'flex', alignItems: 'center', gap: 8,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (t.id !== currentTeam?.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                            onMouseLeave={e => { if (t.id !== currentTeam?.id) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{
                              width: 20, height: 20, borderRadius: 5,
                              background: `linear-gradient(135deg, hsl(${(t.id * 47) % 360}, 70%, 55%), hsl(${(t.id * 47 + 60) % 360}, 70%, 55%))`,
                              flexShrink: 0,
                            }} />
                            {t.name}
                          </button>
                        ))}
                        <div style={{ height: 1, background: 'var(--border-xs)', margin: '0 12px' }} />
                        <button
                          onClick={() => { setTeamDropdown(false); navigate('/app/create-team'); }}
                          style={{
                            width: '100%', padding: '9px 14px',
                            background: 'transparent', border: 'none',
                            color: 'var(--indigo-light)', cursor: 'pointer',
                            textAlign: 'left', fontSize: 13, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}
                        >
                          <Plus size={12} /> Create New Team
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <button
                  onClick={() => navigate('/app/create-team')}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px dashed rgba(99,102,241,0.2)',
                    color: 'var(--indigo-light)', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Plus size={14} /> Create or Join Team
                </button>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-xs)', margin: '0 10px 10px' }} />

            {/* Nav */}
            <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
              {/* Main group */}
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '4px 6px 6px', marginBottom: 2 }}>
                General
              </div>
              {navLinks.filter(l => l.group === 'main').map(({ icon: Icon, label, path, badge }) => (
                <Link
                  key={label}
                  to={path}
                  className={`sidebar-link${isActive(path) ? ' active' : ''}`}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span style={{
                      background: 'var(--indigo)', color: 'white',
                      borderRadius: 99, fontSize: 10, padding: '1px 6px', fontWeight: 700,
                    }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              ))}

              {/* Team group */}
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '12px 6px 6px', marginBottom: 2 }}>
                Team Space
              </div>
              {navLinks.filter(l => l.group === 'team').map(({ icon: Icon, label, path, badge, reqTeam }) => {
                const disabled = reqTeam && !currentTeam;
                return (
                  <Link
                    key={label}
                    to={disabled ? '#' : path}
                    className={`sidebar-link${isActive(path) && !disabled ? ' active' : ''}`}
                    onClick={e => {
                      if (disabled) {
                        e.preventDefault();
                        toast.error('Join or create a team first!', { duration: 3000 });
                      }
                    }}
                    style={{ opacity: disabled ? 0.45 : 1 }}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {!disabled && badge && (
                      <span style={{
                        background: 'var(--indigo)', color: 'white',
                        borderRadius: 99, fontSize: 10, padding: '1px 6px', fontWeight: 700,
                        animation: 'pulse-glow 2s infinite',
                      }}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Special */}
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '12px 6px 6px', marginBottom: 2 }}>
                Power
              </div>
              {navLinks.filter(l => l.group === 'special').map(({ icon: Icon, label, path, reqTeam }) => {
                const disabled = reqTeam && !currentTeam;
                return (
                  <Link
                    key={label}
                    to={disabled ? '#' : path}
                    className={`sidebar-link${isActive(path) && !disabled ? ' active' : ''}`}
                    onClick={e => { if (disabled) { e.preventDefault(); toast.error('Join a team first!'); } }}
                    style={{
                      opacity: disabled ? 0.45 : 1,
                      background: hackathonMode ? 'rgba(245,158,11,0.08)' : undefined,
                      borderColor: hackathonMode ? 'rgba(245,158,11,0.2)' : undefined,
                      color: hackathonMode ? 'var(--amber)' : undefined,
                    }}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {hackathonMode && !disabled && (
                      <span style={{
                        fontSize: 9, background: 'rgba(245,158,11,0.2)',
                        color: 'var(--amber)', borderRadius: 4, padding: '1px 5px', fontWeight: 700,
                      }}>LIVE</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Online Members */}
            {onlineUsers.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-xs)' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                  Online · {onlineUsers.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {onlineUsers.slice(0, 4).map((u, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: `linear-gradient(135deg, hsl(${(i * 73 + 200) % 360},70%,55%), hsl(${(i * 73 + 260) % 360},70%,55%))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 0 6px rgba(16,185,129,0.4)',
                        border: '1.5px solid rgba(16,185,129,0.5)',
                      }}>
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{u.username}</span>
                    </div>
                  ))}
                  {onlineUsers.length > 4 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 30 }}>
                      +{onlineUsers.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Footer */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-xs)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Link to="/app/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--violet), var(--indigo))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0,
                    boxShadow: '0 0 12px rgba(99,102,241,0.4)',
                    border: '2px solid rgba(99,102,241,0.3)',
                  }}
                >
                  {user?.full_name?.[0] || '?'}
                </motion.div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.full_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Zap size={9} fill="var(--amber)" stroke="none" />
                    {user?.xp_points || 0} XP
                  </div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="btn-icon"
                title="Sign out"
                style={{ width: 30, height: 30, flexShrink: 0 }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Area ── */}
      <div style={{
        flex: 1, minWidth: 0,
        marginLeft: sidebarOpen ? SIDEBAR_W : 0,
        transition: 'margin 0.3s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>
        {/* Top Nav */}
        <header style={{
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px',
          background: 'rgba(5,8,15,0.85)',
          borderBottom: '1px solid var(--border-xs)',
          position: 'sticky', top: 0, zIndex: 50,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}>
          {/* Left — Toggle + Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={toggleSidebar}
              className="btn-icon"
              style={{ width: 32, height: 32 }}
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </motion.button>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
              {currentTeam && (
                <>
                  <span
                    style={{ color: 'var(--indigo-light)', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => navigate(`/app/teams/${currentTeam.id}`)}
                  >
                    {currentTeam.name}
                  </span>
                  <ChevronRight size={13} />
                </>
              )}
              <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                {location.pathname.split('/').at(-1)?.replace(/-/g, ' ') || 'dashboard'}
              </span>
            </div>
          </div>

          {/* Right — Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Command Palette Trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-sm)',
                borderRadius: 8, padding: '5px 12px',
                color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: 12, fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-sm)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Search size={13} />
              <span>Search</span>
              <kbd style={{
                background: 'var(--space-raised)', border: '1px solid var(--border-xs)',
                borderRadius: 4, padding: '0 5px', fontSize: 10,
                fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
              }}>⌘K</kbd>
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setNotifDropdown(!notifDropdown);
                  if (!notifDropdown && sysUnread > 0) {
                    notifAPI.markRead().then(() => setSysUnread(0));
                  }
                }}
                className="btn-icon"
                style={{ width: 32, height: 32, position: 'relative' }}
              >
                <Bell size={14} />
                {sysUnread > 0 && (
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid rgba(5,8,15,0.85)' }} />
                )}
              </button>
              
              <AnimatePresence>
                {notifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{ position: 'absolute', top: 40, right: 0, width: 320, background: '#121212', border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100 }}
                  >
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 12px 0' }}>Notifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                      {sysNotifs.length === 0 ? (
                         <div style={{ color: '#888', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>All caught up!</div>
                      ) : sysNotifs.map(n => (
                        <div key={n.id} style={{ padding: 12, background: n.is_read ? 'transparent' : 'rgba(59,130,246,0.1)', borderRadius: 8, border: '1px solid #2a2a2a' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: '#aaa' }}>{n.body}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hackathon Mode */}
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={toggleHackathonMode}
              style={{
                background: hackathonMode
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))'
                  : 'rgba(255,255,255,0.03)',
                border: hackathonMode ? '1px solid rgba(245,158,11,0.35)' : '1px solid var(--border-sm)',
                cursor: 'pointer',
                color: hackathonMode ? 'var(--amber)' : 'var(--text-muted)',
                padding: '5px 10px', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s',
              }}
            >
              <Rocket size={13} />
              {hackathonMode ? 'Hackathon ON' : 'Mode'}
            </motion.button>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="btn-icon"
              style={{ width: 32, height: 32 }}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Avatar */}
            <Link to="/app/profile">
              <motion.div
                whileHover={{ scale: 1.08 }}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--violet), var(--indigo))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: 'white', cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(99,102,241,0.3)',
                  border: '2px solid rgba(99,102,241,0.25)',
                }}
              >
                {user?.full_name?.[0] || '?'}
              </motion.div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main ref={mainRef} style={{
          flex: 1, minWidth: 0,
          padding: '24px',
          overflowY: 'auto',
          position: 'relative',
        }}>
          {/* Ambient bg */}
          <div className="bg-radial" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
