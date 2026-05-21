// src/pages/ProfilePage.jsx — Premium Redesign
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { authAPI, analyticsAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import { Zap, Award, TrendingUp, Save, User, Code2, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

const SKILL_OPTIONS = ['React','Node.js','Python','MySQL','MongoDB','Docker','Figma','TypeScript','Go','Machine Learning','DevOps','UI/UX'];

const STATIC_BADGES = [
  { id: 1, badge_icon: '🏆', badge_name: 'Team Captain',  description: 'Led a team to victory', color: '#f59e0b' },
  { id: 2, badge_icon: '⚡', badge_name: 'Speed Coder',   description: 'Completed 10 tasks in a sprint', color: '#6366f1' },
  { id: 3, badge_icon: '🧠', badge_name: 'ML Wizard',     description: 'AI Insights power user', color: '#8b5cf6' },
  { id: 4, badge_icon: '🎨', badge_name: 'Design Guru',   description: 'Figma master contributor', color: '#ec4899' },
];

export default function ProfilePage() {
  const { user, setUser, currentTeam, toggleTheme, theme } = useStore();
  const [form, setForm] = useState({ full_name: '', bio: '', skills: [], theme_pref: 'dark' });
  const [heatmap, setHeatmap] = useState([]);
  const [badges, setBadges]   = useState([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || '', bio: user.bio || '', skills: user.skills || [], theme_pref: user.theme_pref || 'dark' });
    }
    authAPI.me().then(r => {
      setBadges(r.data.badges?.length ? r.data.badges : STATIC_BADGES);
      setUser(r.data.user);
    });
    if (currentTeam) {
      analyticsAPI.userActivity(currentTeam.id, user?.id).then(r => setHeatmap(r.data.heatmap || []));
    }
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.update(form);
      const r = await authAPI.me();
      setUser(r.data.user);
      toast.success('Profile updated! ✅');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const toggleSkill = (s) => {
    const skills = form.skills.includes(s) ? form.skills.filter(x => x !== s) : [...form.skills, s];
    setForm({ ...form, skills });
  };

  // Generate 90-day heatmap grid
  const today = new Date();
  const days = Array.from({ length: 91 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (90 - i));
    const key = d.toISOString().slice(0, 10);
    const found = heatmap.find(h => h.day === key);
    return { date: key, count: found?.count || 0 };
  });

  const getHeatColor = (count) => {
    if (count === 0)  return 'rgba(99,102,241,0.05)';
    if (count < 3)   return 'rgba(99,102,241,0.22)';
    if (count < 6)   return 'rgba(99,102,241,0.48)';
    if (count < 10)  return 'rgba(99,102,241,0.75)';
    return 'rgba(99,102,241,1)';
  };

  const level = Math.floor((user?.xp_points || 0) / 500) + 1;
  const levelProgress = ((user?.xp_points || 0) % 500) / 500;
  const R = 44; const circ = 2 * Math.PI * R;

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-mission"
        style={{
          marginBottom: 28,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08), rgba(6,182,212,0.06))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20,
          padding: '36px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient blob */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', pointerEvents: 'none' }} />

        {/* Avatar with XP ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={100} height={100} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: -6, left: -6 }}>
            <circle cx={50} cy={50} r={R} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth={6} />
            <motion.circle
              cx={50} cy={50} r={R} fill="none"
              stroke="url(#profileGrad)" strokeWidth={6} strokeLinecap="round"
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - levelProgress) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeDasharray={circ}
              style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.6))' }}
            />
            <defs>
              <linearGradient id="profileGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--violet), var(--indigo))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 900, color: 'white',
            boxShadow: '0 0 30px rgba(99,102,241,0.5)',
            border: '3px solid rgba(99,102,241,0.3)',
          }}>
            {user?.full_name?.[0] || '?'}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.9rem', marginBottom: 4 }}>
            {user?.full_name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
            @{user?.username} · Level {level} Member
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'XP Points', value: `⚡ ${user?.xp_points || 0}`, color: 'var(--amber)' },
              { label: 'Day Streak', value: `🔥 ${user?.streak_days || 0}`, color: 'var(--rose)' },
              { label: 'Level', value: `🏆 ${level}`, color: 'var(--indigo-light)' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '8px 18px', borderRadius: 99,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-sm)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit hint */}
        <div style={{ flexShrink: 0 }}>
          <div className="badge badge-indigo">Level {level}</div>
        </div>
      </motion.div>

      {/* ── Two Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>

        {/* Left — Edit Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: 28 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="var(--indigo-light)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Edit Profile</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Full Name</label>
              <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Bio</label>
              <textarea className="input" rows={3} style={{ resize: 'none', minHeight: 80 }}
                placeholder="Tell your team about yourself..."
                value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>

            {/* Skills */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Code2 size={14} color="var(--cyan)" />
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Skills</label>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SKILL_OPTIONS.map(s => {
                  const active = form.skills.includes(s);
                  return (
                    <button key={s} onClick={() => toggleSkill(s)}
                      style={{
                        padding: '6px 14px', borderRadius: 99,
                        border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'var(--border-sm)'}`,
                        background: active ? 'rgba(99,102,241,0.14)' : 'transparent',
                        color: active ? 'var(--indigo-light)' : 'var(--text-muted)',
                        cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
                        transition: 'all 0.15s',
                        boxShadow: active ? '0 0 8px rgba(99,102,241,0.15)' : 'none',
                      }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Palette size={14} color="var(--violet)" />
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Theme</label>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['dark', 'light'].map(t => (
                  <button key={t} onClick={() => setForm({ ...form, theme_pref: t })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10,
                      border: `1px solid ${form.theme_pref === t ? 'rgba(99,102,241,0.5)' : 'var(--border-sm)'}`,
                      background: form.theme_pref === t ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: form.theme_pref === t ? 'var(--indigo-light)' : 'var(--text-muted)',
                      cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                    }}>
                    {t === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary"
              style={{ justifyContent: 'center', padding: '12px', marginTop: 4 }}
              onClick={saveProfile} disabled={saving}>
              {saving
                ? <><span className="spin-slow" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', marginRight: 8 }} />Saving...</>
                : <><Save size={15} /> Save Profile</>}
            </button>
          </div>
        </motion.div>

        {/* Right — Badges + Heatmap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Badges */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="glass-hud hud-corner" style={{ padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Award size={16} color="var(--amber)" style={{ filter: 'drop-shadow(0 0 6px var(--amber))' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Achievements</h3>
              <span className="badge badge-yellow" style={{ marginLeft: 'auto' }}>{badges.length}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {badges.map((b, i) => (
                <motion.div key={b.id || i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.04, rotateY: 5 }}
                  title={b.description}
                  style={{
                    padding: '14px 12px', borderRadius: 12, textAlign: 'center',
                    background: `${b.color || 'var(--amber)'}10`,
                    border: `1px solid ${b.color || 'var(--amber)'}25`,
                    cursor: 'default',
                    transition: 'all 0.2s',
                  }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{b.badge_icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{b.badge_name}</div>
                </motion.div>
              ))}
              {badges.length === 0 && (
                <div style={{ gridColumn: '1/-1', padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Complete tasks to earn badges! 🎯
                </div>
              )}
            </div>
          </motion.div>

          {/* Heatmap */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="glass-card" style={{ padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={16} color="var(--emerald)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Activity (90 days)</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 3 }}>
              {days.map((d, i) => (
                <div key={i} className="heatmap-cell"
                  title={`${d.date}: ${d.count} actions`}
                  style={{ background: getHeatColor(d.count), border: '1px solid rgba(255,255,255,0.04)' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Less</span>
              {[0, 2, 5, 8, 12].map(n => (
                <div key={n} className="heatmap-cell" style={{ background: getHeatColor(n) }} />
              ))}
              <span>More</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
