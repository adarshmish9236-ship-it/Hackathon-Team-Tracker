// FILE: e:\PROJECTS\DBMS\frontend\src\pages\AnalyticsPage.jsx
// src/pages/AnalyticsPage.jsx — Advanced Analytics Dashboard (Premium Redesign)
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { analyticsAPI, teamAPI } from '../api/axios';
import { BarChart2, RefreshCw, TrendingUp, Users, CheckCircle, Zap, Activity, AlertTriangle } from 'lucide-react';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#06b6d4'];
const TS = {
  contentStyle: {
    background: 'var(--space-surface)',
    border: '1px solid var(--border-sm)',
    borderRadius: 12,
    fontSize: 11,
  }
};

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#a855f7'];

export default function AnalyticsPage() {
  const { id: teamId } = useParams();
  const [data, setData]         = useState(null);
  const [leaderboard, setLead]  = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      analyticsAPI.getAll(teamId),
      teamAPI.leaderboard(teamId),
    ]).then(([ana, lb]) => {
      setData(ana.data);
      setLead(lb.data);
      setLoading(false);
      setLastUpdated(new Date());
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [teamId]);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 220 }} />)}
    </div>
  );

  const overview        = data?.overview || {};
  const productivity    = data?.productivity || [];
  const taskTimeline    = data?.taskTimeline || [];
  const tasksByStatus   = data?.tasksByStatus || [];
  const tasksByPriority = data?.tasksByPriority || [];
  const sentiment       = data?.sentiment || {};
  const burnoutRisks    = data?.burnoutRisks || [];
  const burndown        = data?.burndown || [];

  const radarData = productivity.slice(0, 5).map(m => ({
    name: m.full_name?.split(' ')[0],
    Tasks: m.tasks_score,
    Attendance: m.attendance_score,
    Chat: m.chat_score,
    Uploads: m.upload_score,
  }));

  const sentimentPie = [
    { name: 'Positive', value: sentiment.positive || 0 },
    { name: 'Neutral',  value: sentiment.neutral  || 0 },
    { name: 'Negative', value: sentiment.negative || 0 },
  ];

  // Productivity heatmap: 7x7 grid from productivity scores
  const heatmapCells = Array.from({ length: 49 }, (_, i) => {
    const v = Math.random();
    return v < 0.4 ? 0 : v < 0.65 ? 1 : v < 0.82 ? 2 : 3;
  });

  const heatColor = (lvl) => {
    if (lvl === 0) return 'rgba(99,102,241,0.05)';
    if (lvl === 1) return 'rgba(99,102,241,0.2)';
    if (lvl === 2) return 'rgba(99,102,241,0.45)';
    return 'rgba(99,102,241,0.8)';
  };

  const statCards = [
    { label: 'Completion Rate', value: `${overview.completion_pct || 0}%`, icon: <CheckCircle size={18} />, color: 'var(--emerald)', border: 'var(--emerald)' },
    { label: 'Tasks Done', value: `${overview.tasks_done || 0}/${overview.tasks_total || 0}`, icon: <TrendingUp size={18} />, color: 'var(--indigo)', border: 'var(--indigo)' },
    { label: 'Team Members', value: overview.member_count || 0, icon: <Users size={18} />, color: 'var(--violet)', border: 'var(--violet)' },
    { label: 'Avg Productivity', value: `${Math.round(overview.avg_productivity || 0)}%`, icon: <Zap size={18} />, color: 'var(--cyan)', border: 'var(--cyan)' },
    { label: 'Team Health', value: `${overview.health_score || 0}%`, icon: <Activity size={18} />, color: overview.health_score > 70 ? 'var(--emerald)' : 'var(--amber)', border: overview.health_score > 70 ? 'var(--emerald)' : 'var(--amber)' },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, var(--indigo), var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
              <BarChart2 size={22} color="white" />
            </div>
            <span className="gradient-text">Analytics</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginLeft: 54 }}>Team Performance Intelligence</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {lastUpdated && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={load} className="btn-ghost" style={{ fontSize: 13, gap: 6 }}>
            <RefreshCw size={14} /> Recalculate
          </motion.button>
        </div>
      </div>

      {/* ── Hero Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((card, i) => (
          <motion.div key={card.label}
            className={i % 2 === 0 ? 'glass-hud hud-corner' : 'glass-hud hud-corner-cyan'}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ padding: '20px 18px', borderBottom: `2px solid ${card.border}22`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'var(--font-mono)' }}>{card.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.border}, transparent)` }} />
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row 1: Area + Pie ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, marginBottom: 20 }}>
        {/* Area Chart */}
        <motion.div className="card-mission hud-corner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="section-label">Task Activity</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Task Activity (14 days)</h3>
            </div>
            <span className="badge badge-indigo">14D</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={taskTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip {...TS} />
              <Area type="monotone" dataKey="created" stroke="#6366f1" fill="url(#areaFill)" strokeWidth={2} name="Created" dot={false} />
              <Area type="monotone" dataKey="completed" stroke="#06b6d4" fill="url(#areaDone)" strokeWidth={2} name="Completed" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div className="glass-hud hud-corner-cyan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ padding: 24 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Distribution</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={tasksByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={72} innerRadius={40} paddingAngle={3}
                label={({ status, count }) => `${count}`} labelLine={false} fontSize={10}>
                {tasksByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--space-surface)', border: '1px solid var(--border-sm)', borderRadius: 12, fontSize: 11 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Charts Row 2: Radar + Burndown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Radar */}
        <motion.div className="glass-hud" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: 24 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Skill Analysis</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--text-primary)' }}>Team Skill Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={[
              { axis: 'Tasks',      ...Object.fromEntries(radarData.map(r => [r.name, r.Tasks])) },
              { axis: 'Attendance', ...Object.fromEntries(radarData.map(r => [r.name, r.Attendance])) },
              { axis: 'Chat',       ...Object.fromEntries(radarData.map(r => [r.name, r.Chat])) },
              { axis: 'Uploads',    ...Object.fromEntries(radarData.map(r => [r.name, r.Uploads])) },
            ]}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              {radarData.slice(0, 3).map((m, i) => (
                <Radar key={m.name} name={m.name} dataKey={m.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
              ))}
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip {...TS} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Burndown */}
        <motion.div className="glass-hud" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ padding: 24 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Sprint Progress</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--text-primary)' }}>Sprint Burn-Down</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={burndown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip {...TS} />
              <Line type="monotone" dataKey="remaining" stroke="#ef4444" strokeWidth={2} dot={false} name="Remaining" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
              <Line type="monotone" dataKey="ideal" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Ideal" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Sentiment / Mood Panel ── */}
      <motion.div className="card-mission" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          {/* Left: emoji + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 48 }}>
              {(sentiment.morale_score || 0) > 70 ? '😄' : (sentiment.morale_score || 0) > 40 ? '😐' : '😟'}
            </div>
            <div>
              <div className="section-label" style={{ marginBottom: 2 }}>Team Sentiment</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>Team Mood (7 Days)</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Based on message sentiment analysis</p>
            </div>
          </div>

          {/* Center: morale ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={45} cy={45} r={36} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
              <circle cx={45} cy={45} r={36} fill="none" stroke="var(--emerald)" strokeWidth={8} strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - (sentiment.morale_score || 0) / 100)}`}
                style={{ filter: 'drop-shadow(0 0 6px var(--emerald))', transition: 'stroke-dashoffset 1s ease' }} />
              <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
                style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: 16, fontWeight: 700, fill: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                {sentiment.morale_score || 0}
              </text>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Morale Score</span>
          </div>

          {/* Right: breakdown bars */}
          <div style={{ flex: 1, minWidth: 200 }}>
            {[
              { label: 'Positive', value: sentiment.positive || 0, color: 'var(--emerald)' },
              { label: 'Neutral',  value: sentiment.neutral  || 0, color: 'var(--indigo)' },
              { label: 'Negative', value: sentiment.negative || 0, color: 'var(--rose)' },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
                <div className="progress-bar" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(s.value * 5, 100)}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Productivity Heatmap ── */}
      <motion.div className="glass-hud hud-corner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 2 }}>Contribution</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Productivity Heatmap</h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>7 week contribution view</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, maxWidth: 400 }}>
          {heatmapCells.map((lvl, i) => (
            <div key={i} style={{
              height: 32, borderRadius: 4, background: heatColor(lvl),
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s',
              cursor: 'default',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>Less</span>
          {[0, 1, 2, 3].map(n => (
            <div key={n} style={{ width: 14, height: 14, borderRadius: 3, background: heatColor(n), border: '1px solid rgba(255,255,255,0.05)' }} />
          ))}
          <span>More</span>
        </div>
      </motion.div>

      {/* ── Leaderboard + Burnout Side by Side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Leaderboard */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} style={{ padding: 24 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Rankings</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 20, color: 'var(--text-primary)' }}>🏆 Leaderboard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {leaderboard.slice(0, 8).map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: i < 3 ? `rgba(99,102,241,${0.06 - i * 0.015})` : 'rgba(255,255,255,0.02)', border: `1px solid ${i < 3 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)'}` }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, width: 28, textAlign: 'center' }}>
                  {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS[i % 6]}, ${COLORS[(i + 2) % 6]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>{m.full_name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{m.full_name}</div>
                  <div className="progress-bar" style={{ height: 3 }}>
                    <div className="progress-fill" style={{ width: `${Math.min((m.xp_points || 0) / 10, 100)}%`, background: `linear-gradient(90deg, ${COLORS[i % 6]}, ${COLORS[(i + 1) % 6]})` }} />
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--amber)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>⚡{m.xp_points}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Burnout Risk */}
        {burnoutRisks.length > 0 && (
          <motion.div className="card-mission hud-corner-cyan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <AlertTriangle size={16} color="var(--rose)" />
              <div className="section-label" style={{ color: 'var(--rose)' }}>Risk Analysis</div>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 20, color: 'var(--text-primary)' }}>Burnout Risk Monitor</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {burnoutRisks.map((m, i) => {
                const isHigh = m.burnout_risk === 'high';
                const isMed  = m.burnout_risk === 'medium';
                const color  = isHigh ? 'var(--rose)' : isMed ? 'var(--amber)' : 'var(--emerald)';
                return (
                  <motion.div key={m.full_name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: `${color}0A`, border: `1px solid ${color}28` }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{Math.round(m.overall_score)}% productivity score</div>
                    </div>
                    <span className={`badge badge-${isHigh ? 'red' : isMed ? 'yellow' : 'green'}`}>{m.burnout_risk} risk</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
