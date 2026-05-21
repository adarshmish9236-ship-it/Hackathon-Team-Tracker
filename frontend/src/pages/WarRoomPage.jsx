// FILE: e:\PROJECTS\DBMS\frontend\src\pages\WarRoomPage.jsx
// src/pages/WarRoomPage.jsx — Cinematic Hackathon Command Center (Premium Redesign)
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsAPI, pollAPI, teamAPI, sosAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import { Swords, AlertTriangle, Plus, Shield, MapPin, Activity } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';

const fmtTime = (secs) => {
  if (secs === null) return '--:--:--';
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export default function WarRoomPage() {
  const { id: teamId }        = useParams();
  const [data, setData]       = useState(null);
  const [polls, setPolls]     = useState([]);
  const [countdown, setCd]    = useState(null);
  const [stress, setStress]   = useState(38);
  const [showPoll, setShowPoll] = useState(false);
  const [showSOS, setShowSOS]   = useState(false);
  const [pollForm, setPollForm] = useState({ question: '', options: ['', '', ''] });
  const [sosForm, setSosForm]   = useState({ message: '', severity: 'high' });
  const [activityFeed, setFeed] = useState([]);
  const [velocityData, setVel]  = useState([]);
  const { onlineUsers, user, setSosActive, setActiveSOS } = useStore();
  const socket   = useSocket();
  const iRef     = useRef(null);

  const load = useCallback(async () => {
    const [ana, p, team] = await Promise.all([
      analyticsAPI.getAll(teamId),
      pollAPI.getAll(teamId),
      teamAPI.getTeam(teamId),
    ]);
    setData({ ...ana.data, team: team.data.team });
    setPolls(p.data);
    setFeed(ana.data.activityFeed || []);
    if (team.data.team?.deadline) {
      const diff = new Date(team.data.team.deadline) - new Date();
      setCd(Math.max(0, Math.floor(diff / 1000)));
    }
    // Build velocity chart from task timeline
    const tl = ana.data.taskTimeline || [];
    setVel(tl.slice(-7).map((d, i) => ({
      day: new Date(d.day).toLocaleDateString('en', { weekday: 'short' }),
      completed: d.completed || 0,
      created: d.created || 0,
    })));
  }, [teamId]);

  useEffect(() => { load(); }, [load]);

  // Countdown
  useEffect(() => {
    if (countdown === null) return;
    iRef.current = setInterval(() => setCd(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(iRef.current);
  }, [countdown !== null]);

  // Stress simulation
  useEffect(() => {
    const t = setInterval(() => setStress(s => Math.min(100, Math.max(0, s + (Math.random() * 6 - 3)))), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('poll-updated', ({ pollId }) => {
      pollAPI.getAll(teamId).then(r => setPolls(r.data));
    });
    socket.on('sos-alert', (data) => { setSosActive(true); setActiveSOS(data); });
    return () => { socket.off('poll-updated'); socket.off('sos-alert'); };
  }, [socket]);

  const votePoll = async (pollId, idx) => {
    await pollAPI.vote(teamId, pollId, idx);
    socket?.emit('poll-vote', { teamId, pollId });
    const r = await pollAPI.getAll(teamId);
    setPolls(r.data);
  };

  const createPoll = async () => {
    const opts = pollForm.options.filter(o => o.trim());
    if (!pollForm.question || opts.length < 2) return toast.error('Need a question and 2+ options');
    await pollAPI.create(teamId, { question: pollForm.question, options: opts });
    const r = await pollAPI.getAll(teamId);
    setPolls(r.data);
    setShowPoll(false);
    setPollForm({ question: '', options: ['', '', ''] });
    toast.success('Poll created!');
  };

  const triggerSOS = async () => {
    if (!sosForm.message.trim()) return toast.error('Describe the emergency');
    try {
      await sosAPI.trigger(teamId, sosForm);
      socket?.emit('sos', { teamId, ...sosForm, triggered_by_name: user?.full_name });
      setSosActive(true);
      setActiveSOS({ ...sosForm, triggered_by_name: user?.full_name });
      setShowSOS(false);
      setSosForm({ message: '', severity: 'high' });
      toast.error('🆘 SOS Alert sent to all members!', { duration: 5000 });
    } catch { toast.error('Failed to send SOS'); }
  };

  const ov  = data?.overview || {};
  const pct = parseFloat(ov.completion_pct || 0);
  const stressColor = stress > 70 ? '#f43f5e' : stress > 45 ? '#f59e0b' : '#10b981';

  const statCards = [
    { icon: '✅', label: 'Tasks Done',   value: `${ov.tasks_done || 0}/${ov.tasks_total || 0}`, color: 'var(--emerald)',      glow: 'rgba(16,185,129,0.3)' },
    { icon: '👥', label: 'Online Now',  value: onlineUsers.length,                              color: 'var(--cyan)',         glow: 'rgba(6,182,212,0.3)' },
    { icon: '📈', label: 'Completion',  value: `${Math.round(pct)}%`,                           color: 'var(--indigo-light)', glow: 'rgba(99,102,241,0.3)' },
    { icon: '💪', label: 'Team Health', value: `${Math.round(ov.health_score || 0)}%`,          color: 'var(--violet-light)', glow: 'rgba(139,92,246,0.3)' },
  ];

  // SVG Stress Arc
  const r = 60;
  const circ = Math.PI * r;
  const stressArc = circ * (stress / 100);

  return (
    <div style={{ position:'relative', overflow:'hidden', maxWidth:1200 }}>

      {/* ── Background effects ── */}
      <div className="bg-dot-grid" style={{ position:'fixed', inset:0, opacity:0.4, pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', top:'-10%', left:'-5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)', filter:'blur(80px)', pointerEvents:'none', animation:'float-particle 8s ease-in-out infinite', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'5%', right:'-8%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(6,182,212,0.1),transparent 70%)', filter:'blur(80px)', pointerEvents:'none', animation:'float-particle 11s ease-in-out infinite reverse', zIndex:0 }} />
      <div className="scan-line" style={{ zIndex:1 }} />

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, position:'relative', zIndex:2 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <motion.div animate={{ rotate:[0,-8,8,0] }} transition={{ repeat:Infinity, duration:4, ease:'easeInOut' }}>
            <Swords size={30} color="var(--indigo-light)" style={{ filter:'drop-shadow(0 0 10px rgba(99,102,241,0.8))' }} />
          </motion.div>
          <div>
            <h1
              className="gradient-text"
              style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:900, lineHeight:1.1, letterSpacing:'-0.02em' }}
            >
              WAR ROOM
            </h1>
            <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:2, letterSpacing:'0.05em' }}>
              Mission Control · All Systems Monitored
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="live-badge">
            <span className="dot-online pulse" />
            LIVE
          </div>
          <motion.button
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            className="btn-sos" style={{ fontSize:13 }}
            onClick={() => setShowSOS(true)}
          >
            <AlertTriangle size={15} /> SOS Alert
          </motion.button>
        </div>
      </div>

      <div className="divider-glow" style={{ marginBottom:20, position:'relative', zIndex:2 }} />

      {/* ── Row 1: Countdown + Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16, marginBottom:16, position:'relative', zIndex:2 }}>

        {/* Countdown Panel */}
        <motion.div
          initial={{ opacity:0, x:-20 }}
          animate={{ opacity:1, x:0 }}
          className="card-mission hud-corner"
          style={{ padding:28, textAlign:'center', position:'relative', overflow:'hidden' }}
        >
          {/* Inner glow ring */}
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center 30%, rgba(99,102,241,0.08), transparent 70%)', pointerEvents:'none' }} />
          <div className="section-label" style={{ marginBottom:12 }}>⏱ Time Remaining</div>

          {/* Pulsing ring around time */}
          <div style={{ position:'relative', display:'inline-block', marginBottom:10 }}>
            <motion.div
              animate={{ opacity:[0.3,0.7,0.3], scale:[0.97,1.03,0.97] }}
              transition={{ repeat:Infinity, duration:2.5 }}
              style={{ position:'absolute', inset:-8, borderRadius:'var(--r-lg)', border:'1px solid rgba(99,102,241,0.3)', pointerEvents:'none' }}
            />
            <div className="countdown-digit">{fmtTime(countdown)}</div>
          </div>

          {countdown === 0 && (
            <motion.div animate={{ scale:[1,1.05,1] }} transition={{ repeat:Infinity, duration:0.8 }}
              style={{ color:'var(--rose)', fontWeight:800, fontSize:14, marginTop:4 }}>
              ⏰ Time's Up!
            </motion.div>
          )}
          {data?.team?.name && (
            <div style={{ marginTop:14, fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
              <MapPin size={11} color="var(--cyan)" />
              <span style={{ color:'var(--text-secondary)' }}>{data.team.name}</span>
            </div>
          )}
        </motion.div>

        {/* 4 Stat Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity:0, y:14 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-hud hud-corner"
              style={{ padding:20, textAlign:'center', position:'relative', overflow:'hidden' }}
            >
              {/* Bottom glow accent */}
              <div style={{ position:'absolute', bottom:0, left:'10%', right:'10%', height:2, borderRadius:'99px 99px 0 0', background:`linear-gradient(90deg,transparent,${s.glow},transparent)`, filter:'blur(2px)' }} />

              <div style={{ width:40, height:40, borderRadius:'var(--r-md)', background:`rgba(${s.color === 'var(--emerald)' ? '16,185,129' : s.color === 'var(--cyan)' ? '6,182,212' : s.color === 'var(--indigo-light)' ? '99,102,241' : '139,92,246'},0.12)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', fontSize:18, border:`1px solid ${s.glow}` }}>
                {s.icon}
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:s.color, textShadow:`0 0 20px ${s.glow}`, lineHeight:1 }}>
                {s.value}
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Row 2: Stress Arc + Online + AI + Velocity ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1.5fr', gap:16, marginBottom:16, position:'relative', zIndex:2 }}>

        {/* Stress Arc Gauge */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }} className="glass-hud" style={{ padding:20 }}>
          <div className="section-label" style={{ marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
            <span>{stress > 70 ? '😤' : stress > 45 ? '😓' : '😌'}</span> TEAM STRESS
          </div>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'flex-end', position:'relative' }}>
            <svg viewBox="0 0 160 90" width={160} height={90} style={{ overflow:'visible' }}>
              {/* Track arc */}
              <path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={10}
                strokeLinecap="round"
              />
              {/* Value arc */}
              <motion.path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke={stressColor}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${circ}`}
                animate={{ strokeDashoffset: circ - stressArc }}
                transition={{ duration:1, ease:'easeOut' }}
                style={{ filter:`drop-shadow(0 0 6px ${stressColor})` }}
              />
              {/* Center % */}
              <text x="80" y="72" textAnchor="middle" fill={stressColor} fontSize="22" fontFamily="'Space Grotesk',sans-serif" fontWeight="800">
                {Math.round(stress)}%
              </text>
            </svg>
          </div>
          <div style={{ textAlign:'center', fontSize:12, color:stressColor, fontWeight:600, marginTop:2 }}>
            {stress > 70 ? '🔴 Critical' : stress > 45 ? '🟡 Moderate' : '🟢 Calm'}
          </div>
        </motion.div>

        {/* Online Members */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15 }} className="glass-hud" style={{ padding:20 }}>
          <div className="section-label" style={{ marginBottom:12 }}>🟢 Online Now</div>
          {onlineUsers.length === 0
            ? <p style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'16px 0' }}>No members online</p>
            : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {onlineUsers.map((u, i) => (
                  <motion.div key={u.userId} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.07 }}
                    style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ position:'relative' }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,var(--indigo),var(--violet))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white', border:'2px solid var(--emerald)', boxShadow:'0 0 10px rgba(16,185,129,0.4)' }}>
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{u.username}</div>
                      <div className="dot-online" style={{ width:6, height:6 }} />
                    </div>
                  </motion.div>
                ))}
              </div>
          }
        </motion.div>

        {/* AI Status */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
          className="glass-hud hud-corner"
          style={{ padding:20, textAlign:'center', position:'relative', overflow:'hidden', border:`1px solid ${pct > 80 ? 'rgba(16,185,129,0.3)' : pct > 50 ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)'}` }}
        >
          {/* Animated pulsing border */}
          <motion.div
            animate={{ opacity:[0.3,0.8,0.3] }}
            transition={{ repeat:Infinity, duration:2.5 }}
            style={{ position:'absolute', inset:0, borderRadius:'var(--r-xl)', border:`1px solid ${pct > 80 ? 'rgba(16,185,129,0.3)' : pct > 50 ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)'}`, pointerEvents:'none' }}
          />
          <div className="section-label" style={{ marginBottom:12 }}>🤖 AI STATUS</div>
          <motion.div
            animate={{ scale:[1,1.08,1] }}
            transition={{ repeat:Infinity, duration:3 }}
            className="ai-orb-glow"
            style={{ fontSize:48, marginBottom:8, display:'inline-block', borderRadius:'50%', width:64, height:64, lineHeight:'64px' }}
          >
            {pct > 80 ? '🟢' : pct > 50 ? '🟡' : '🔴'}
          </motion.div>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:4, color: pct > 80 ? 'var(--emerald)' : pct > 50 ? 'var(--amber)' : 'var(--rose)' }}>
            {pct > 80 ? 'On Track' : pct > 50 ? 'At Risk' : 'Behind'}
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>
            {pct > 80 ? '🚀 Keep the pace!' : pct > 50 ? '⚡ Push harder' : '⚠️ Reassign tasks'}
          </div>
        </motion.div>

        {/* Velocity Chart */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.25 }} className="glass-hud" style={{ padding:20 }}>
          <div className="section-label" style={{ marginBottom:12 }}>⚡ TASK VELOCITY</div>
          {velocityData.length > 0
            ? <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={velocityData}>
                  <defs>
                    <linearGradient id="vel-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--indigo)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize:9, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background:'var(--space-raised)', border:'1px solid var(--border-sm)', borderRadius:8, fontSize:11 }} />
                  <Area type="monotone" dataKey="completed" stroke="var(--indigo-light)" fill="url(#vel-grad)" strokeWidth={2} dot={false} style={{ filter:'drop-shadow(0 0 4px rgba(99,102,241,0.6))' }} />
                </AreaChart>
              </ResponsiveContainer>
            : <p style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', paddingTop:24 }}>No data yet</p>
          }
        </motion.div>
      </div>

      {/* ── Row 3: Activity Feed + Polls ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, position:'relative', zIndex:2 }}>

        {/* Activity Feed */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="card-mission hud-corner" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <Activity size={13} color="var(--cyan)" />
            <h3 className="section-label">⚡ Live Activity</h3>
            <span className="live-badge" style={{ marginLeft:'auto', fontSize:9, padding:'2px 8px' }}>
              <span className="dot-online" style={{ width:5, height:5 }} /> FEED
            </span>
          </div>
          <div className="terminal" style={{ maxHeight:280, overflowY:'auto' }}>
            <AnimatePresence>
              {activityFeed.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity:0, x:-14 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ marginBottom:8, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.03)', lineHeight:1.5 }}
                >
                  <span className="t-muted">[{new Date(a.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}] </span>
                  <span className="t-indigo" style={{ fontWeight:700 }}>{a.full_name}</span>
                  <span className="t-muted"> › </span>
                  <span className="t-cyan">{a.action.replace(/_/g, ' ')}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {activityFeed.length === 0 && (
              <div style={{ color:'var(--text-muted)', textAlign:'center', padding:'16px 0' }}>
                No activity yet…
              </div>
            )}
            {/* Blinking cursor */}
            <span className="t-indigo cursor-blink" style={{ fontFamily:'var(--font-mono)' }}>█</span>
          </div>
        </motion.div>

        {/* Polls */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
          className="glass-hud" style={{ padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 className="section-label">🗳 Team Polls</h3>
            <motion.button
              whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              className="btn-ghost" style={{ padding:'5px 12px', fontSize:12 }}
              onClick={() => setShowPoll(true)}
            >
              <Plus size={12} /> New Poll
            </motion.button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14, maxHeight:280, overflowY:'auto' }}>
            {polls.slice(0, 3).map(poll => {
              const options = JSON.parse(poll.options || '[]');
              const votes   = poll.votes_data ? JSON.parse(poll.votes_data) : [];
              const total   = votes.length;
              return (
                <div key={poll.id} style={{ padding:14, background:'rgba(99,102,241,0.04)', borderRadius:'var(--r-md)', border:'1px solid rgba(99,102,241,0.12)' }}>
                  <p style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'var(--text-primary)' }}>{poll.question}</p>
                  {options.map((opt, idx) => {
                    const cnt = votes.filter(v => v.option_idx === idx).length;
                    const p = total > 0 ? Math.round(cnt / total * 100) : 0;
                    return (
                      <div key={idx} style={{ marginBottom:7 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4, color:'var(--text-secondary)' }}>
                          <span>{opt}</span>
                          <span style={{ color:'var(--indigo-light)', fontWeight:600 }}>{p}%</span>
                        </div>
                        <div className="progress-bar" style={{ height:5 }}>
                          <motion.div
                            className="progress-fill"
                            style={{ height:'100%', width:0 }}
                            animate={{ width:`${p}%` }}
                            transition={{ duration:0.8, ease:'easeOut' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                    {options.map((opt, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => votePoll(poll.id, idx)}
                        style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', color:'var(--indigo-light)', cursor:'pointer', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, fontFamily:'var(--font-sans)' }}
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })}
            {polls.length === 0 && (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🗳</div>
                <p style={{ fontSize:12, color:'var(--text-muted)' }}>No polls yet. Create one!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Create Poll Modal ── */}
      <AnimatePresence>
        {showPoll && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, backdropFilter:'blur(12px)' }}
            onClick={e => e.target === e.currentTarget && setShowPoll(false)}
          >
            <motion.div
              initial={{ scale:0.88, opacity:0, y:20 }}
              animate={{ scale:1, opacity:1, y:0 }}
              exit={{ scale:0.88, opacity:0, y:20 }}
              transition={{ type:'spring', damping:22, stiffness:320 }}
              className="glass-card"
              style={{ width:'100%', maxWidth:420, padding:32, border:'1px solid rgba(99,102,241,0.25)' }}
            >
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                🗳 Create Poll
              </h2>
              <input
                className="input" style={{ marginBottom:10 }}
                placeholder="What's the question?"
                value={pollForm.question}
                onChange={e => setPollForm({ ...pollForm, question: e.target.value })}
                autoFocus
              />
              {pollForm.options.map((opt, i) => (
                <input key={i} className="input" style={{ marginBottom:8 }}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={e => { const o = [...pollForm.options]; o[i] = e.target.value; setPollForm({ ...pollForm, options: o }); }}
                />
              ))}
              <button
                onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ''] })}
                style={{ background:'none', border:'none', color:'var(--indigo-light)', cursor:'pointer', fontSize:13, marginBottom:16, fontFamily:'var(--font-sans)', display:'flex', alignItems:'center', gap:4 }}
              >
                <Plus size={12} /> Add option
              </button>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={() => setShowPoll(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={createPoll}>Create Poll</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SOS Modal ── */}
      <AnimatePresence>
        {showSOS && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, backdropFilter:'blur(16px)' }}
            onClick={e => e.target === e.currentTarget && setShowSOS(false)}
          >
            <motion.div
              initial={{ scale:0.85, opacity:0, y:20 }}
              animate={{ scale:1, opacity:1, y:0 }}
              exit={{ scale:0.85, opacity:0, y:20 }}
              transition={{ type:'spring', damping:22, stiffness:320 }}
              className="glass-card"
              style={{ width:'100%', maxWidth:440, padding:32, border:'1px solid rgba(244,63,94,0.35)', boxShadow:'0 0 60px rgba(244,63,94,0.15)' }}
            >
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:20, marginBottom:6, color:'var(--rose)', display:'flex', alignItems:'center', gap:10 }}>
                <AlertTriangle size={22} /> SOS Emergency Alert
              </h2>
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:20, lineHeight:1.6 }}>
                This will immediately alert <strong style={{ color:'var(--text-primary)' }}>ALL team members</strong>.
              </p>
              <textarea
                className="input"
                style={{ marginBottom:12, minHeight:80, resize:'vertical', border:'1px solid rgba(244,63,94,0.3)' }}
                placeholder="Describe the emergency…"
                value={sosForm.message}
                onChange={e => setSosForm({ ...sosForm, message: e.target.value })}
                autoFocus
              />
              <select
                className="input" style={{ marginBottom:16 }}
                value={sosForm.severity}
                onChange={e => setSosForm({ ...sosForm, severity: e.target.value })}
              >
                <option value="low">🟡 Low Priority</option>
                <option value="medium">🟠 Medium Priority</option>
                <option value="high">🔴 Critical Emergency</option>
              </select>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={() => setShowSOS(false)}>Cancel</button>
                <button className="btn-sos" style={{ flex:1, justifyContent:'center' }} onClick={triggerSOS}>
                  <Shield size={14} /> Send SOS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
