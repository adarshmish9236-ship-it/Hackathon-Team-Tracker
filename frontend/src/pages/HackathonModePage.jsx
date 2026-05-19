// src/pages/HackathonModePage.jsx — Hackathon OS Submission Tracker
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { milestonesAPI, teamAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import { Rocket, CheckSquare, Clock, Monitor, X, Plus, Zap, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_META = {
  planning:     { label: 'Planning',     color: 'var(--accent-blue)',   icon: '📋' },
  dev:          { label: 'Development',  color: 'var(--accent-purple)', icon: '💻' },
  presentation: { label: 'Presentation', color: 'var(--accent-cyan)',   icon: '🎤' },
  deployment:   { label: 'Deployment',   color: 'var(--accent-green)',  icon: '🚀' },
  documentation:{ label: 'Docs',         color: 'var(--accent-yellow)', icon: '📄' },
  submission:   { label: 'Submission',   color: '#ef4444',              icon: '🏁' },
  general:      { label: 'General',      color: 'var(--text-muted)',    icon: '📌' },
};

function CountdownTimer({ deadline }) {
  const [secs, setSecs] = useState(null);
  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const diff = new Date(deadline) - new Date();
      setSecs(Math.max(0, Math.floor(diff / 1000)));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  if (secs === null) return <span style={{ color: 'var(--text-muted)' }}>No deadline set</span>;
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  const days = Math.floor(secs / 86400);
  const urgency = secs < 3600 ? '#ef4444' : secs < 86400 ? '#f59e0b' : 'var(--accent-cyan)';
  return (
    <div style={{ textAlign: 'center' }}>
      {days > 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{days}d remaining</div>}
      <div className="countdown-digit" style={{ fontSize: days > 0 ? '2rem' : '3rem', color: urgency, WebkitTextFillColor: urgency }}>
        {h}:{m}:{s}
      </div>
      {secs === 0 && <div style={{ color: '#ef4444', fontWeight: 800, marginTop: 8 }}>⏰ TIME'S UP!</div>}
    </div>
  );
}

export default function HackathonModePage() {
  const { id: teamId } = useParams();
  const [milestones, setMilestones]   = useState([]);
  const [team, setTeam]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [presentation, setPresentation] = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [newMs, setNewMs]             = useState({ title: '', category: 'general' });
  const { setPresentationMode }       = useStore();

  useEffect(() => {
    Promise.all([milestonesAPI.getAll(teamId), teamAPI.getTeam(teamId)])
      .then(([ms, t]) => { setMilestones(ms.data); setTeam(t.data.team); })
      .finally(() => setLoading(false));
  }, [teamId]);

  const toggle = async (id) => {
    try {
      const r = await milestonesAPI.toggle(teamId, id);
      setMilestones(prev => prev.map(m => m.id === id ? { ...m, is_done: r.data.is_done } : m));
      if (r.data.is_done) toast.success('Milestone complete! 🎉');
    } catch { toast.error('Failed to update'); }
  };

  const addMilestone = async (e) => {
    e.preventDefault();
    if (!newMs.title.trim()) return;
    try {
      const r = await milestonesAPI.create(teamId, newMs);
      setMilestones(prev => [...prev, r.data]);
      setNewMs({ title: '', category: 'general' });
      setShowAdd(false);
      toast.success('Milestone added!');
    } catch { toast.error('Failed'); }
  };

  const enterPresentation = () => {
    setPresentation(true);
    setPresentationMode(true);
    toast.success('🎬 Presentation Mode — Press ESC to exit');
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setPresentation(false); setPresentationMode(false); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const done  = milestones.filter(m => m.is_done).length;
  const total = milestones.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const grouped = Object.entries(CATEGORY_META).map(([key, meta]) => ({
    key, meta, items: milestones.filter(m => m.category === key),
  })).filter(g => g.items.length > 0);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
    </div>
  );

  // ── Presentation Mode ────────────────────────────────────────────────────
  if (presentation) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div className="bg-grid bg-radial" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <button onClick={() => { setPresentation(false); setPresentationMode(false); }}
        style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: '1px solid var(--border-glass)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <X size={14} /> Exit (ESC)
      </button>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', position: 'relative' }}>
        <div className="gradient-text" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '4rem', fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
          {team?.hackathon_name || 'Hackathon'}
        </div>
        <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: 48 }}>{team?.name}</div>
        {/* Big progress ring */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          <svg width={220} height={220} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={110} cy={110} r={90} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={16} />
            <motion.circle cx={110} cy={110} r={90} fill="none" stroke="url(#grad)" strokeWidth={16} strokeLinecap="round"
              initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - pct / 100) }}
              transition={{ duration: 2, ease: 'easeOut' }}
              strokeDasharray={2 * Math.PI * 90} />
            <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4f8ef7" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '3rem', fontWeight: 900 }} className="gradient-text">{pct}%</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{done}/{total} done</div>
          </div>
        </div>
        <CountdownTimer deadline={team?.deadline} />
        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {milestones.filter(m => m.is_done).slice(-6).map(m => (
            <span key={m.id} style={{ fontSize: 13, color: 'var(--accent-green)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 14px' }}>✓ {m.title}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // ── Normal Mode ──────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Rocket size={24} color="var(--accent-yellow)" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))' }} />
            <span style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Hackathon Mode
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track every milestone to the finish line</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Milestone
          </button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn-primary" style={{ fontSize: 13 }} onClick={enterPresentation}>
            <Monitor size={14} /> Presentation Mode
          </motion.button>
        </div>
      </div>

      {/* Hero: Countdown + Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-hud hud-corner" style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Time Remaining</div>
          <CountdownTimer deadline={team?.deadline} />
          {team?.hackathon_name && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600 }}>🏆 {team.hackathon_name}</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-hud" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>Submission Readiness</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '2.2rem', fontWeight: 800 }} className="gradient-text">{pct}%</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right' }}>
              <div><strong style={{ color: 'var(--accent-green)' }}>{done}</strong> completed</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>{total - done}</strong> remaining</div>
            </div>
          </div>
          <div className="progress-bar" style={{ height: 12, borderRadius: 99, marginBottom: 16 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 99, background: pct > 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : pct > 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)', boxShadow: pct > 80 ? '0 0 16px rgba(16,185,129,0.5)' : '0 0 16px rgba(245,158,11,0.4)' }} />
          </div>
          {/* Category bars */}
          <div style={{ display: 'flex', gap: 4, height: 6, borderRadius: 99, overflow: 'hidden' }}>
            {grouped.map(g => {
              const catDone = g.items.filter(m => m.is_done).length;
              const catPct = g.items.length > 0 ? (catDone / g.items.length) * 100 : 0;
              return (
                <div key={g.key} style={{ flex: g.items.length, background: catPct > 0 ? g.meta.color : 'rgba(255,255,255,0.04)', borderRadius: 99, opacity: catPct > 0 ? 1 : 0.3, transition: 'all 0.5s', title: g.meta.label }} title={`${g.meta.label}: ${Math.round(catPct)}%`} />
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Milestone Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {grouped.map((group, gi) => {
          const groupDone = group.items.filter(m => m.is_done).length;
          return (
            <motion.div key={group.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}
              className="glass-hud" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>{group.meta.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: group.meta.color }}>{group.meta.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{groupDone}/{group.items.length}</span>
                {groupDone === group.items.length && <span style={{ fontSize: 11, color: 'var(--accent-green)', marginLeft: 4, fontWeight: 700 }}>✓ COMPLETE</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.items.map((m, i) => (
                  <motion.div key={m.id} layout className="milestone-item"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: m.is_done ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m.is_done ? 'rgba(16,185,129,0.2)' : 'var(--border-glass)'}`, cursor: 'pointer', transition: 'all 0.25s' }}
                    onClick={() => toggle(m.id)}
                    whileHover={{ x: 4 }}>
                    <motion.div className={`milestone-checkbox ${m.is_done ? 'checked' : ''}`}
                      whileTap={{ scale: 0.8 }}>
                      {m.is_done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: 'white', fontSize: 12 }}>✓</motion.span>}
                    </motion.div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, textDecoration: m.is_done ? 'line-through' : 'none', color: m.is_done ? 'var(--text-muted)' : 'var(--text-primary)' }}>{m.title}</span>
                    {m.description && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.description}</span>}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Milestone Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 28 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>➕ Add Milestone</h3>
              <form onSubmit={addMilestone} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="input" placeholder="Milestone title *" value={newMs.title} onChange={e => setNewMs({ ...newMs, title: e.target.value })} required autoFocus />
                <select className="input" value={newMs.category} onChange={e => setNewMs({ ...newMs, category: e.target.value })}>
                  {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Add</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
