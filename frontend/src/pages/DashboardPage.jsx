// FILE: e:\PROJECTS\DBMS\frontend\src\pages\DashboardPage.jsx
// src/pages/DashboardPage.jsx — Pure User Dashboard
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { teamAPI, authAPI, taskAPI } from '../api/axios';
import {
  Plus, Users, CheckSquare, Zap, TrendingUp, ArrowRight, Shield, Clock,
  Award, Activity, Bell, Terminal, CheckCircle2, ChevronRight, AlertTriangle, AlertCircle, RefreshCw, Send,
  Trash2, UserCog, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, setUser, myTeams, setMyTeams, setCurrentTeam, triggerXPBurst } = useStore();
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  // User Space Data
  const [myTasks, setMyTasks] = useState([]);
  const [fetchingTasks, setFetchingTasks] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
    fetchUserTasks();
  }, [user]);

  const fetchTeams = () => teamAPI.getMyTeams().then(r => setMyTeams(r.data)).catch(() => {});

  const fetchUserTasks = async () => {
    if (!user) return;
    setFetchingTasks(true);
    try {
      const res = await authAPI.myTasks();
      setMyTasks(res.data || []);
    } catch (err) { console.error('Failed to fetch tasks', err); }
    finally { setFetchingTasks(false); }
  };

  const joinTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await teamAPI.join(inviteCode.trim().toUpperCase());
      const updated = await teamAPI.getMyTeams();
      setMyTeams(updated.data);
      setCurrentTeam(r.data.team);
      toast.success(`Joined ${r.data.team.name}! 🚀`);
      setShowJoin(false);
      navigate(`/app/teams/${r.data.team.id}`);
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid code'); }
    finally { setLoading(false); }
  };

  const completeTask = async (task) => {
    try {
      toast.loading('Saving progress...', { id: 'complete-task' });
      await taskAPI.update(task.team_id, task.id, { ...task, status: 'done' });
      triggerXPBurst(task.xp_reward || 15);
      toast.success(`Task completed! +${task.xp_reward || 15} XP Awarded! ⚡`, { id: 'complete-task' });
      setMyTasks(prev => prev.filter(t => t.id !== task.id));
      const uRes = await authAPI.me();
      setUser(uRes.data.user);
      fetchTeams();
    } catch (err) { toast.error('Failed to complete task', { id: 'complete-task' }); }
  };

  const greetTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const xpPoints = user?.xp_points || 0;
  const userLevel = Math.floor(xpPoints / 500) + 1;
  const nextLevelXP = userLevel * 500;
  const prevLevelXP = (userLevel - 1) * 500;
  const levelProgress = Math.min(100, Math.round(((xpPoints - prevLevelXP) / 500) * 100));

  const BADGES = [
    { name: 'Team Captain', emoji: '👑', desc: 'First to form a developer team.', bonus: '+100 XP', color: '#FFD700' },
    { name: 'Speed Coder',  emoji: '⚡', desc: 'Solved 5 Kanban tickets in 24h.',  bonus: '+75 XP',  color: '#6366f1' },
    { name: 'ML Wizard',    emoji: '🧠', desc: 'Integrated intelligence scripts.',  bonus: '+80 XP',  color: '#a855f7' },
    { name: 'Design Guru',  emoji: '🎨', desc: 'Created premium glassmorphism layouts.', bonus: '+60 XP', color: '#ec4899' },
  ];

  const STATS = [
    { label: 'XP Points', value: xpPoints.toLocaleString(), icon: <Zap size={20} />, iconBg: 'linear-gradient(135deg,#6366f1,#818cf8)', gradient: 'gradient-text', suffix: 'pts' },
    { label: 'Level',     value: userLevel, icon: <Award size={20} />, iconBg: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', gradient: 'gradient-text-indigo', suffix: '' },
    { label: 'Streak',    value: `${user?.streak_days || 0}`, icon: <TrendingUp size={20} />, iconBg: 'linear-gradient(135deg,#10b981,#34d399)', gradient: 'gradient-text-2', suffix: 'd 🔥' },
    { label: 'Teams',     value: myTeams.length, icon: <Users size={20} />, iconBg: 'linear-gradient(135deg,#06b6d4,#67e8f9)', gradient: 'gradient-text', suffix: '' },
  ];

  const getPriorityColor = (priority) => {
    if (priority === 'critical') return '#f43f5e';
    if (priority === 'high')     return '#f97316';
    if (priority === 'medium')   return '#f59e0b';
    return '#10b981';
  };

  const circumference = 2 * Math.PI * 52; // ≈ 326.73

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Hero Greeting Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="glass-card"
        style={{
          marginBottom: 28,
          padding: '36px 40px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
          flexWrap: 'wrap',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow blobs */}
        <div style={{ position:'absolute', top:-40, left:-40, width:200, height:200, background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, right:120, width:240, height:240, background:'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

        {/* Left: Greeting */}
        <div style={{ flex: 1, minWidth: 260, position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span className="live-badge" style={{ fontSize:10 }}>LIVE DASHBOARD</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.45 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.4rem',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: 12,
              letterSpacing: '-0.5px',
            }}
          >
            {greetTime()},{' '}
            <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'Explorer'} 🚀</span>
          </motion.h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, maxWidth: 420 }}>
            Let's check your productivity streak and tackle some tickets today. You're{' '}
            <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{nextLevelXP - xpPoints} XP</span> away from Level {userLevel + 1}.
          </p>
          <div style={{ display:'flex', gap:10, marginTop:20, flexWrap:'wrap' }}>
            <button className="btn-primary" style={{ gap:6, fontSize:13 }} onClick={() => navigate('/app/create-team')}>
              <Plus size={15}/> New Team
            </button>
            <button className="btn-ghost" style={{ gap:6, fontSize:13 }} onClick={() => setShowJoin(true)}>
              <Users size={15}/> Join Team
            </button>
          </div>
        </div>

        {/* Right: XP Ring */}
        <div style={{ position:'relative', zIndex:1, flexShrink:0 }}>
          <div style={{ position:'relative', width:148, height:148 }}>
            <svg viewBox="0 0 120 120" width={148} height={148} style={{ transform:'rotate(0deg)' }}>
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#6366f1"/>
                  <stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
                <filter id="glow-ring">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {/* Track */}
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="8"/>
              {/* Progress arc */}
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="url(#xpGrad)"
                strokeWidth="8"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={circumference * (1 - levelProgress / 100)}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                filter="url(#glow-ring)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              {/* Inner ring decoration */}
              <circle cx="60" cy="60" r="43" fill="none" stroke="rgba(99,102,241,0.06)" strokeWidth="1"/>
            </svg>
            {/* Center text */}
            <div style={{
              position:'absolute', inset:0, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'2.2rem', fontWeight:900, background:'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                {userLevel}
              </span>
              <span style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>LEVEL</span>
            </div>
          </div>
          <div style={{ textAlign:'center', marginTop:8 }}>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>{levelProgress}% to next level</span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.08 }}
            className="glass-card"
            style={{ padding:'22px 24px', display:'flex', alignItems:'center', gap:18 }}
          >
            <div style={{ width:44, height:44, borderRadius:12, background: stat.iconBg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, boxShadow:`0 4px 14px rgba(99,102,241,0.3)` }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, lineHeight:1 }}>
                <span className={stat.gradient}>{stat.value}</span>
                {stat.suffix && <span style={{ fontSize:15, marginLeft:3, color:'var(--text-muted)', fontWeight:600 }}>{stat.suffix}</span>}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4, fontWeight:600, textTransform:'uppercase', letterSpacing:0.8 }}>{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Earned Badges ── */}
      <motion.div
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.32 }}
        className="glass-card"
        style={{ padding:'24px 28px', marginBottom:28 }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#f59e0b,#fbbf24)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Award size={17} color="white"/>
          </div>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800 }}>Earned Badges &amp; Credentials</h3>
          <span className="badge badge-yellow" style={{ marginLeft:'auto', fontSize:10 }}>4 Unlocked</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:14 }}>
          {BADGES.map((badge, i) => (
            <motion.div
              key={badge.name}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.36 + i * 0.07 }}
              style={{
                background: `${badge.color}08`,
                border: `1px solid ${badge.color}20`,
                borderRadius: 'var(--r-lg)',
                padding: '18px 16px',
                textAlign: 'center',
                cursor: 'default',
                transition: 'all 0.3s',
              }}
              whileHover={{ scale: 1.03, rotateY: 4, boxShadow: `0 8px 32px ${badge.color}18` }}
            >
              <div style={{ fontSize: 32, marginBottom: 10, lineHeight: 1 }}>{badge.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: badge.color, marginBottom: 6 }}>{badge.name}</div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>{badge.desc}</p>
              <span style={{
                fontSize: 10, background: `${badge.color}18`, color: badge.color,
                padding: '3px 10px', borderRadius: 99, fontWeight: 800, letterSpacing: 0.5,
              }}>
                {badge.bonus}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Two-Column: Tasks + Teams ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 0.6fr', gap:24 }}>

        {/* Tasks Column */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
              <CheckSquare size={18} color="var(--indigo)"/>
              Assigned Tasks
              <span className="badge badge-indigo" style={{ fontSize:10 }}>{myTasks.length}</span>
            </h2>
            <button
              onClick={fetchUserTasks}
              disabled={fetchingTasks}
              className="btn-ghost"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', fontSize:12 }}
            >
              <RefreshCw size={12} className={fetchingTasks ? 'spin-slow' : ''}/>
              Sync Tickets
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {fetchingTasks && [1,2,3].map(k => (
              <div key={k} className="skeleton" style={{ height:80, borderRadius:'var(--r-lg)' }}/>
            ))}

            {!fetchingTasks && myTasks.map((task, idx) => {
              const prioColor = getPriorityColor(task.priority);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.08 }}
                  className="glass-card"
                  style={{
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    borderLeft: `3px solid ${prioColor}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                      <span style={{
                        fontSize: 10, textTransform:'uppercase', fontWeight:800,
                        color: prioColor, background:`${prioColor}15`,
                        padding:'2px 8px', borderRadius:6, letterSpacing:0.5,
                      }}>
                        {task.priority}
                      </span>
                      <span style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}>
                        📍 {task.team_name}
                      </span>
                    </div>
                    <h4 style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {task.title}
                    </h4>
                    {task.due_date && (
                      <span style={{ fontSize:11, color:'var(--amber)', display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
                        <Clock size={11}/> Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => completeTask(task)}
                    style={{
                      display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12,
                      borderRadius:8, border:'1px solid rgba(16,185,129,0.35)',
                      color:'#10b981', background:'rgba(16,185,129,0.06)',
                      cursor:'pointer', fontWeight:700, flexShrink:0,
                      transition:'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(16,185,129,0.16)'; e.currentTarget.style.boxShadow='0 0 14px rgba(16,185,129,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(16,185,129,0.06)'; e.currentTarget.style.boxShadow='none'; }}
                  >
                    <CheckCircle2 size={14}/> Complete
                  </button>
                </motion.div>
              );
            })}

            {myTasks.length === 0 && !fetchingTasks && (
              <div style={{
                textAlign:'center', padding:'52px 20px', color:'var(--text-muted)',
                border:'1px dashed var(--border-glass)', borderRadius:'var(--r-xl)',
              }}>
                <CheckCircle2 size={36} style={{ marginBottom:12, color:'#10b981', opacity:0.5 }}/>
                <h4 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>No Pending Tickets!</h4>
                <p style={{ fontSize:12 }}>You've resolved all assigned cards. Take a breather! 🎉</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Teams Column */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.44 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
              <Users size={18} color="var(--cyan)"/>
              My Teams
              <span className="badge badge-cyan" style={{ fontSize:10 }}>{myTeams.length}</span>
            </h2>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn-ghost" style={{ padding:'5px 11px', fontSize:11 }} onClick={() => setShowJoin(true)}>Join</button>
              <button className="btn-primary" style={{ padding:'5px 11px', fontSize:11, gap:4 }} onClick={() => navigate('/app/create-team')}>
                <Plus size={11}/> Create
              </button>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {myTeams.length === 0 && (
              <div className="glass-card" style={{ padding:28, textAlign:'center' }}>
                <Users size={32} style={{ color:'var(--text-muted)', opacity:0.4, marginBottom:10 }}/>
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>No teams yet. Join or create one!</p>
              </div>
            )}
            {myTeams.map((team, idx) => {
              const pct = team.tasks_total > 0 ? Math.round((team.tasks_done / team.tasks_total) * 100) : 0;
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.44 + idx * 0.08 }}
                  className="glass-card"
                  style={{ padding:'18px 20px', cursor:'pointer' }}
                  onClick={() => { setCurrentTeam(team); navigate(`/app/teams/${team.id}`); }}
                  whileHover={{ y: -2 }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                    <h4 style={{ fontWeight:800, fontSize:14, fontFamily:'var(--font-display)' }}>{team.name}</h4>
                    <span className={`badge badge-${team.status === 'active' ? 'cyan' : 'green'}`} style={{ fontSize:9 }}>
                      {team.status}
                    </span>
                  </div>
                  <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {team.description || 'No description yet.'}
                  </p>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>
                      <span>Sprint Completion</span>
                      <span style={{ color:'var(--cyan)', fontWeight:700 }}>{pct}%</span>
                    </div>
                    <div className="progress-bar" style={{ height:5 }}>
                      <div className="progress-fill" style={{ width:`${pct}%` }}/>
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:'var(--text-muted)' }}>
                    <span>👥 {team.member_count} Developers</span>
                    <ArrowRight size={14} color="var(--indigo)"/>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Join Team Modal ── */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{
              position:'fixed', inset:0,
              background:'rgba(2,4,10,0.75)',
              backdropFilter:'blur(16px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              zIndex:200, padding:24,
            }}
            onClick={e => e.target === e.currentTarget && setShowJoin(false)}
          >
            <motion.div
              initial={{ opacity:0, scale:0.93, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93, y:20 }}
              transition={{ type:'spring', stiffness:320, damping:26 }}
              className="glass-card"
              style={{ width:'100%', maxWidth:420, padding:36, position:'relative' }}
            >
              {/* Close */}
              <button
                onClick={() => setShowJoin(false)}
                style={{ position:'absolute', top:16, right:16, background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4 }}
              >
                <AlertCircle size={18}/>
              </button>

              <div style={{ textAlign:'center', marginBottom:24 }}>
                <div style={{ width:52, height:52, borderRadius:'var(--r-lg)', background:'linear-gradient(135deg,#6366f1,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <Users size={24} color="white"/>
                </div>
                <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:20, marginBottom:6 }}>Join a Team</h2>
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>Enter your invite code to join a team instantly</p>
              </div>

              <form onSubmit={joinTeam} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <input
                  className="input"
                  placeholder="e.g. NEBULA01"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  style={{
                    textTransform:'uppercase', fontSize:22, fontFamily:'var(--font-mono)',
                    textAlign:'center', letterSpacing:6, padding:'14px 18px', fontWeight:800,
                  }}
                  required
                />
                <div style={{ display:'flex', gap:10 }}>
                  <button type="button" className="btn-ghost" style={{ flex:1, justifyContent:'center' }} onClick={() => setShowJoin(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex:1, justifyContent:'center' }} disabled={loading}>
                    {loading ? 'Joining...' : 'Join Team 🚀'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
