// src/pages/WarRoomPage.jsx — Cinematic Hackathon Command Center
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsAPI, pollAPI, teamAPI, sosAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import { Swords, AlertTriangle, Plus, Shield, Zap } from 'lucide-react';
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
  const stressColor = stress > 70 ? '#ef4444' : stress > 45 ? '#f59e0b' : '#10b981';

  const statCards = [
    { icon: '✅', label: 'Tasks Done',   value: `${ov.tasks_done || 0}/${ov.tasks_total || 0}`, color: 'var(--accent-green)' },
    { icon: '👥', label: 'Online Now',  value: onlineUsers.length,    color: 'var(--accent-cyan)' },
    { icon: '📈', label: 'Completion',  value: `${Math.round(pct)}%`, color: 'var(--accent-blue)' },
    { icon: '💪', label: 'Team Health', value: `${Math.round(ov.health_score || 0)}%`, color: 'var(--accent-purple)' },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
          <Swords size={28} color="var(--accent-blue)" style={{ filter: 'drop-shadow(0 0 8px rgba(79,142,247,0.7))' }} />
        </motion.div>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.7rem', fontWeight: 900 }} className="gradient-text">
            War Room
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Live command center — all systems monitored</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: 'var(--accent-green)' }}>
            <div className="dot-online pulse" /> LIVE
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowSOS(true)} className="btn-sos" style={{ fontSize: 13 }}>
            <AlertTriangle size={15} /> SOS Alert
          </motion.button>
        </div>
      </div>

      {/* Row 1: Countdown + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 16 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-hud hud-corner" style={{ padding: 28, textAlign: 'center', background: 'linear-gradient(135deg,rgba(79,142,247,0.06),rgba(168,85,247,0.06))' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Time Remaining</div>
          <div className="countdown-digit">{fmtTime(countdown)}</div>
          {countdown === 0 && <div style={{ color: '#ef4444', fontWeight: 700, marginTop: 8, fontSize: 14 }}>⏰ Time's Up!</div>}
          {data?.team?.name && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>📍 {data.team.name}</div>}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass-hud" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: s.color, textShadow: `0 0 12px ${s.color}60` }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Row 2: Stress + Online + Prediction + Velocity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 16, marginBottom: 16 }}>
        {/* Stress Meter */}
        <div className="glass-hud" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>😤 Team Stress</div>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <motion.div animate={{ scale: stress > 70 ? [1, 1.05, 1] : 1 }} transition={{ repeat: Infinity, duration: 1 }}
              style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '2.2rem', fontWeight: 800, color: stressColor, textShadow: `0 0 16px ${stressColor}60` }}>
              {Math.round(stress)}%
            </motion.div>
            <div style={{ fontSize: 12, color: stressColor, marginTop: 2 }}>
              {stress > 70 ? '🔴 Critical' : stress > 45 ? '🟡 Moderate' : '🟢 Calm'}
            </div>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <motion.div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,#10b981,${stressColor})`, transition: 'all 1s ease' }}
              animate={{ width: `${stress}%` }} />
          </div>
        </div>

        {/* Online Members */}
        <div className="glass-hud" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>🟢 Online</div>
          {onlineUsers.length === 0
            ? <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No members online</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {onlineUsers.map((u, i) => (
                  <motion.div key={u.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="dot-online" />
                    <span style={{ fontSize: 12 }}>{u.username}</span>
                  </motion.div>
                ))}
              </div>
          }
        </div>

        {/* AI Prediction */}
        <div className="glass-hud" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>🤖 AI Status</div>
          <div style={{ fontSize: 42, marginBottom: 4 }}>
            {pct > 80 ? '🟢' : pct > 50 ? '🟡' : '🔴'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            {pct > 80 ? 'On Track' : pct > 50 ? 'At Risk' : 'Behind'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {pct > 80 ? '🚀 Keep the pace!' : pct > 50 ? '⚡ Push harder' : '⚠️ Reassign tasks'}
          </div>
        </div>

        {/* Velocity Chart */}
        <div className="glass-hud" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>⚡ Task Velocity</div>
          {velocityData.length > 0
            ? <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={velocityData}>
                  <defs>
                    <linearGradient id="vel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="completed" stroke="var(--accent-blue)" fill="url(#vel)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            : <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 20 }}>No data yet</p>
          }
        </div>
      </div>

      {/* Row 3: Activity Feed + Polls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Activity Feed */}
        <div className="glass-hud" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>⚡ Live Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            <AnimatePresence>
              {activityFeed.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {(a.full_name || '?')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{a.full_name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> · {a.action.replace(/_/g, ' ')}</span>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{new Date(a.created_at).toLocaleTimeString()}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {activityFeed.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No activity yet</p>}
          </div>
        </div>

        {/* Polls */}
        <div className="glass-hud" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>🗳 Team Polls</h3>
            <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setShowPoll(true)}>
              <Plus size={12} /> Poll
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 280, overflowY: 'auto' }}>
            {polls.slice(0, 3).map(poll => {
              const options = JSON.parse(poll.options || '[]');
              const votes   = poll.votes_data ? JSON.parse(poll.votes_data) : [];
              const total   = votes.length;
              return (
                <div key={poll.id} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>{poll.question}</p>
                  {options.map((opt, idx) => {
                    const cnt = votes.filter(v => v.option_idx === idx).length;
                    const p = total > 0 ? Math.round(cnt / total * 100) : 0;
                    return (
                      <div key={idx} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span>{opt}</span><span style={{ color: 'var(--text-muted)' }}>{p}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: 4 }}>
                          <motion.div className="progress-fill" style={{ height: '100%', width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.8 }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {options.map((opt, idx) => (
                      <button key={idx} onClick={() => votePoll(poll.id, idx)}
                        style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', color: 'var(--accent-blue)', cursor: 'pointer', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {polls.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No polls. Create one!</p>}
          </div>
        </div>
      </div>

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showPoll && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && setShowPoll(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>🗳 Create Poll</h2>
              <input className="input" style={{ marginBottom: 10 }} placeholder="What's the question?" value={pollForm.question} onChange={e => setPollForm({ ...pollForm, question: e.target.value })} autoFocus />
              {pollForm.options.map((opt, i) => (
                <input key={i} className="input" style={{ marginBottom: 8 }} placeholder={`Option ${i + 1}`}
                  value={opt} onChange={e => { const o = [...pollForm.options]; o[i] = e.target.value; setPollForm({ ...pollForm, options: o }); }} />
              ))}
              <button onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ''] })}
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>+ Add option</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowPoll(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={createPoll}>Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOS && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && setShowSOS(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card" style={{ width: '100%', maxWidth: 440, padding: 32, border: '1px solid rgba(239,68,68,0.3)' }}>
              <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={22} /> SOS Emergency Alert
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>This will immediately alert ALL team members.</p>
              <textarea className="input" style={{ marginBottom: 12, minHeight: 80, resize: 'vertical' }}
                placeholder="Describe the emergency..." value={sosForm.message}
                onChange={e => setSosForm({ ...sosForm, message: e.target.value })} autoFocus />
              <select className="input" style={{ marginBottom: 16 }} value={sosForm.severity}
                onChange={e => setSosForm({ ...sosForm, severity: e.target.value })}>
                <option value="low">🟡 Low Priority</option>
                <option value="medium">🟠 Medium Priority</option>
                <option value="high">🔴 Critical Emergency</option>
              </select>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowSOS(false)}>Cancel</button>
                <button onClick={triggerSOS} className="btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Shield size={15} /> Send SOS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
