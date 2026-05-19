// src/components/layout/AppLayout.jsx — Upgraded with HackathonMode, SOS, VoiceCommand
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState } from 'react';
import { teamAPI } from '../../api/axios';
import {
  LayoutDashboard, Kanban, MessageCircle, BarChart3,
  Brain, Swords, User, Bell, Sun, Moon, Menu, X, Zap,
  ChevronDown, LogOut, Plus, Rocket, Shield, Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import SOSAlert from '../ui/SOSAlert';
import XPBurst from '../ui/XPBurst';
import VoiceCommand from '../ui/VoiceCommand';

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
  const [showNotif, setShowNotif]     = useState(false);
  const [teamDropdown, setTeamDropdown] = useState(false);

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
    });
    socket.on('task-updated', (data) => {
      if (data.xpAwarded) triggerXPBurst(data.xpAwarded);
    });
    return () => { socket.off('sos-alert'); socket.off('new-message'); socket.off('task-updated'); };
  }, [socket, location]);

  const handleLogout = () => { logout(); navigate('/'); toast.success('See you soon! 👋'); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const teamPath = (sub) => currentTeam ? `/app/teams/${currentTeam.id}/${sub}` : '#';

  const navLinks = [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/app' },
    { icon: Kanban,          label: 'Kanban',       path: teamPath('kanban') },
    { icon: MessageCircle,   label: 'Chat',         path: teamPath('chat'),     badge: unreadCount > 0 ? unreadCount : null },
    { icon: BarChart3,       label: 'Analytics',    path: teamPath('analytics') },
    { icon: Brain,           label: 'AI Command',   path: teamPath('insights') },
    { icon: Swords,          label: 'War Room',     path: teamPath('warroom') },
    { icon: Rocket,          label: 'Hackathon Mode', path: teamPath('hackathon'), special: true },
  ];



  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Global overlays */}
      <SOSAlert />
      <XPBurst />
      <VoiceCommand />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -270 }} animate={{ x: 0 }} exit={{ x: -270 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              width: 256, minHeight: '100vh', background: 'rgba(8,15,31,0.95)',
              borderRight: '1px solid rgba(79,142,247,0.1)',
              display: 'flex', flexDirection: 'column', padding: '20px 12px',
              position: 'fixed', top: 0, left: 0, zIndex: 100,
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Logo */}
            <div style={{ padding: '4px 4px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: 'linear-gradient(135deg,#4f8ef7,#a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(79,142,247,0.5)',
                }}
              >
                <Zap size={20} color="white" />
              </motion.div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 15 }} className="gradient-text">SyncSphere</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Hackathon OS</div>
              </div>
            </div>

            {/* Team Selector */}
            {currentTeam && (
              <div style={{ marginBottom: 14 }}>
                <button onClick={() => setTeamDropdown(!teamDropdown)} style={{
                  width: '100%', padding: '9px 12px', borderRadius: 10,
                  background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.15)',
                  color: 'var(--text-primary)', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="dot-online" />
                    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTeam.name}</span>
                  </div>
                  <ChevronDown size={13} style={{ transform: teamDropdown ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0 }} />
                </button>
                <AnimatePresence>
                  {teamDropdown && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      style={{ marginTop: 4, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
                      {myTeams.map(t => (
                        <button key={t.id} onClick={() => { setCurrentTeam(t); setTeamDropdown(false); navigate(`/app/teams/${t.id}`); }}
                          style={{ width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', color: t.id === currentTeam?.id ? 'var(--accent-blue)' : 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, transition: 'background 0.15s', fontWeight: t.id === currentTeam?.id ? 600 : 400 }}
                          onMouseEnter={e => e.target.style.background = 'var(--bg-glass)'}
                          onMouseLeave={e => e.target.style.background = 'transparent'}>
                          {t.name}
                        </button>
                      ))}
                      <button onClick={() => { setTeamDropdown(false); navigate('/app/create-team'); }}
                        style={{ width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', borderTop: '1px solid var(--border-glass)', color: 'var(--accent-blue)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={12} /> New Team
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Nav Links */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {navLinks.map(({ icon: Icon, label, path, badge, special }) => (
                <Link key={label} to={path} className={`sidebar-link${isActive(path) ? ' active' : ''}${special ? ' special' : ''}`}
                  style={special ? { background: hackathonMode ? 'rgba(245,158,11,0.12)' : undefined, borderColor: hackathonMode ? 'rgba(245,158,11,0.25)' : undefined, color: hackathonMode ? 'var(--accent-yellow)' : undefined } : {}}>
                  <Icon size={17} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && <span style={{ background: 'var(--accent-blue)', color: 'white', borderRadius: '99px', fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{badge > 9 ? '9+' : badge}</span>}
                  {special && hackathonMode && <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.2)', color: 'var(--accent-yellow)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>ON</span>}
                </Link>
              ))}
            </nav>

            {/* Online Members */}
            {onlineUsers.length > 0 && (
              <div style={{ padding: '10px 4px', borderTop: '1px solid var(--border-glass)', marginTop: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Online · {onlineUsers.length}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {onlineUsers.slice(0, 4).map((u, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="dot-online" />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Footer */}
            <div style={{ padding: '12px 4px', borderTop: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.div whileHover={{ scale: 1.1 }} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--accent-purple),var(--accent-blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
                boxShadow: '0 0 12px rgba(168,85,247,0.4)',
              }}>
                {user?.full_name?.[0] || '?'}
              </motion.div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Zap size={9} fill="var(--accent-yellow)" stroke="none" /> {user?.xp_points || 0} XP
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <Link to="/app/profile" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <User size={15} />
                </Link>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 5, borderRadius: 6 }}>
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div style={{ flex: 1, minWidth: 0, marginLeft: sidebarOpen ? 256 : 0, transition: 'margin 0.3s', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top Nav */}
        <header style={{
          height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', background: 'rgba(8,15,31,0.8)',
          borderBottom: '1px solid rgba(79,142,247,0.08)',
          position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(24px)',
        }}>
          <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 6, borderRadius: 8 }}>
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          {/* Breadcrumb */}
          <div style={{ flex: 1, paddingLeft: 12, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {currentTeam && <><span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{currentTeam.name}</span><span>/</span></>}
            <span style={{ textTransform: 'capitalize' }}>{location.pathname.split('/').at(-1) || 'dashboard'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hackathon Mode Toggle */}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={toggleHackathonMode}
              style={{
                background: hackathonMode ? 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.1))' : 'var(--bg-glass)',
                border: hackathonMode ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border-glass)',
                cursor: 'pointer', color: hackathonMode ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                padding: '5px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600,
              }}>
              <Rocket size={14} />
              {hackathonMode ? 'Hackathon ON' : 'Hackathon'}
            </motion.button>

            {/* Theme */}
            <button onClick={toggleTheme} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', cursor: 'pointer', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Profile */}
            <Link to="/app/profile">
              <motion.div whileHover={{ scale: 1.1 }} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--accent-purple),var(--accent-blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer',
                boxShadow: '0 0 10px rgba(168,85,247,0.3)',
              }}>
                {user?.full_name?.[0] || '?'}
              </motion.div>
            </Link>
          </div>
        </header>

        {/* Page */}
        <main style={{ flex: 1, minWidth: 0, padding: '28px 28px', overflowY: 'auto', position: 'relative' }}>
          {/* Ambient background */}
          <div className="bg-radial" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>


    </div>
  );
}
