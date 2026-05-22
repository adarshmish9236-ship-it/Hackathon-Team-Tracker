// FILE: e:\PROJECTS\DBMS\frontend\src\pages\AIInsightsPage.jsx
// src/pages/AIInsightsPage.jsx — AI Command Center (Premium Redesign)
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsAPI, taskAPI, teamAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import {
  Brain, AlertTriangle, TrendingUp, Users, Zap, CheckCircle,
  Activity, Target, Cpu, BarChart2, Flame, Shield, Clock, RefreshCw
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const SEVERITY_COLOR = {
  critical: '#ef4444', high: '#f97316', medium: 'var(--amber)',
  low: 'var(--cyan)', velocity: 'var(--violet)',
};
const TYPE_ICON = {
  risk: '⚠️', burnout: '🔥', deadline: '⏰', inactive: '💤',
  suggest: '💡', bottleneck: '🚧', velocity: '⚡',
};
const SEVERITY_BORDER = {
  critical: 'var(--rose)', high: 'var(--amber)', medium: 'var(--indigo)', low: 'var(--emerald)',
};

// ── AI Orb component ─────────────────────────────────────────────────────────
function AIOrb({ health = 70, listening = false }) {
  const color = health > 75 ? '#10b981' : health > 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer rings */}
      {[160, 140, 120].map((size, i) => (
        <div key={i} className={`ring-${i + 1}`} style={{
          position: 'absolute', width: size, height: size, borderRadius: '50%',
          border: `1px solid ${i === 0 ? 'rgba(79,142,247,0.3)' : i === 1 ? 'rgba(168,85,247,0.25)' : 'rgba(6,182,212,0.2)'}`,
        }} />
      ))}
      {/* Core orb */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="ai-orb-glow"
        style={{
          width: 96, height: 96, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), transparent 60%), linear-gradient(135deg, #6366f1, #a855f7, #06b6d4)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        <div className="scan-line" />
        <TrendingUp size={36} color="white" />
      </motion.div>
      {/* Health arc label */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        fontSize: 13, fontWeight: 700, color,
        background: 'rgba(0,0,0,0.6)', padding: '2px 10px', borderRadius: 99,
        backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
      }}>
        {Math.round(health)}% Health
      </div>
    </div>
  );
}

// ── Sprint health ring ────────────────────────────────────────────────────────
function HealthRing({ value, label, color, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={8} strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeDasharray={circ}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: 14, fontWeight: 700, fill: color, fontFamily: 'var(--font-mono)' }}>
          {Math.round(value)}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>{label}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIInsightsPage() {
  const { id: teamId } = useParams();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const { setAIInsights }   = useStore();
  const intervalRef = useRef(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const r = await analyticsAPI.getInsights(teamId);
      setData(r.data);
      setAIInsights(r.data);
      setLastRefresh(new Date());
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(true), 30000); // auto-refresh every 30s
    return () => clearInterval(intervalRef.current);
  }, [teamId]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
    </div>
  );

  const { analytics: ana, members = [], insights = [], daysLeft, predictedCompletion, completionPct = 0, sprintHealth = 0, velocity = 0, workload = {}, meetingNotes } = data || {};
  const roleColors = { frontend: 'var(--indigo)', backend: 'var(--violet)', designer: '#ec4899', presenter: 'var(--emerald)', debugger: 'var(--amber)', fullstack: 'var(--cyan)', lead: '#FFD700', member: 'var(--text-muted)' };

  // Radar data for member comparison
  const radarData = members.slice(0, 5).map(m => ({
    name: m.full_name?.split(' ')[0],
    productivity: Math.round(m.overall_score || 0),
    tasks: Math.round(m.tasks_score || 0),
    chat: Math.round(m.chat_score || 0),
  }));

  const criticalInsights = insights.filter(i => i.severity === 'critical');
  const otherInsights    = insights.filter(i => i.severity !== 'critical');

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
              <TrendingUp size={22} color="white" />
            </div>
            <span className="gradient-text">Performance & Insights</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 54 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time analytics · Updates every 30s</p>
            {refreshing && <span className="live-badge">Analyzing...</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {lastRefresh && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => load(true)} className="btn-ghost" style={{ fontSize: 13, gap: 6 }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin-slow 1s linear infinite' : 'none' }} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </motion.button>
        </div>
      </div>

      {/* ── AI Orb Hero ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, padding: 40, borderRadius: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06), rgba(6,182,212,0.05))', border: '1px solid rgba(99,102,241,0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.08), transparent 60%)' }} />
        <div className="neural-pulse" style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, opacity: 0.15 }} />

        {/* Orb centered */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative' }}>
          <AIOrb health={sprintHealth} />

          {/* Health pct + status */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, background: 'linear-gradient(135deg, #6366f1, #a855f7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {Math.round(sprintHealth)}%
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              {sprintHealth > 75 ? '🟢 Systems Optimal' : sprintHealth > 50 ? '🟡 Moderate Health' : '🔴 Needs Attention'}
            </div>
          </div>

          {/* 4 metric rings */}
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
            <HealthRing value={sprintHealth}    label="Sprint Health"    color="var(--indigo)"  />
            <HealthRing value={completionPct}   label="Completion"       color="var(--emerald)" />
            <HealthRing value={Math.min(parseFloat(velocity) * 20, 100)} label="Velocity" color="var(--cyan)" />
            <HealthRing value={workload.avgScore || 50} label="Avg Productivity" color="var(--violet)" />
          </div>

          {/* Days left + prediction */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ padding: '12px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-sm)', textAlign: 'center', minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Days to Deadline</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: daysLeft !== null && daysLeft < 2 ? '#ef4444' : 'var(--cyan)' }}>
                {daysLeft ?? '∞'}
              </div>
            </div>
            <div style={{ padding: '12px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-sm)', textAlign: 'center', minWidth: 180 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Project Forecast</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{predictedCompletion || '—'}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Critical Alerts ── */}
      {criticalInsights.length > 0 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="card-mission"
          style={{ marginBottom: 20, padding: '18px 22px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 0.5 }}>
              <AlertTriangle size={22} color="#ef4444" />
            </motion.div>
            <div>
              <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 8, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                ⚡ Critical Alerts ({criticalInsights.length})
              </div>
              {criticalInsights.map((ins, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, paddingLeft: 4 }}>• {ins.msg}</div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Insights Grid (2 cols) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Smart Insights */}
        <div className="glass-hud" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Activity size={16} color="var(--violet)" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.6))' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              Performance Insights ({otherInsights.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
            {otherInsights.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--emerald)' }}>
                <CheckCircle size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 13 }}>All systems nominal! Team is performing great.</p>
              </div>
            )}
            {otherInsights.map((ins, i) => {
              const borderColor = SEVERITY_BORDER[ins.severity] || 'var(--cyan)';
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ padding: '12px 14px', borderRadius: 12, background: `${SEVERITY_COLOR[ins.severity] || 'var(--cyan)'}0D`, borderLeft: `3px solid ${borderColor}`, paddingLeft: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{TYPE_ICON[ins.type] || '📊'}</span>
                  <div>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)', marginBottom: 6 }}>{ins.msg}</p>
                    <span className={`badge badge-${ins.severity === 'critical' ? 'red' : ins.severity === 'high' ? 'yellow' : ins.severity === 'medium' ? 'indigo' : 'green'}`} style={{ fontSize: 10 }}>{ins.severity}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="card-mission hud-corner" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Activity size={16} color="var(--cyan)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              Team Performance Radar
            </h3>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Radar name="Productivity" dataKey="productivity" stroke="var(--indigo)" fill="var(--indigo)" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Tasks" dataKey="tasks" stroke="var(--violet)" fill="var(--violet)" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={{ background: 'var(--space-surface)', border: '1px solid var(--border-sm)', borderRadius: 10, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No productivity data yet. Run score calculation.</p>
          )}
        </div>
      </div>

      {/* ── Member Intelligence + Role Allocation ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Member Analysis */}
        <div className="glass-hud" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Users size={16} color="var(--indigo)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Member Intelligence</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {members.map((m, i) => {
              const score = m.overall_score || 0;
              const barColor = score > 70 ? 'linear-gradient(90deg,var(--emerald),#34d399)' : score > 40 ? 'linear-gradient(90deg,var(--amber),#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)';
              const riskColor = m.burnout_risk === 'high' ? 'var(--rose)' : m.burnout_risk === 'medium' ? 'var(--amber)' : 'var(--emerald)';
              return (
                <motion.div key={m.full_name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass-hud"
                  style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${roleColors[m.role_tag] || 'var(--indigo)'},var(--violet))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0, boxShadow: `0 0 10px ${roleColors[m.role_tag] || 'var(--indigo)'}50` }}>
                    {m.full_name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{m.full_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1, height: 4 }}>
                        <motion.div className="progress-fill" initial={{ width: 0 }}
                          animate={{ width: `${score}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                          style={{ background: barColor }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: score > 70 ? 'var(--emerald)' : score > 40 ? 'var(--amber)' : '#ef4444', minWidth: 34, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {Math.round(score)}%
                      </span>
                    </div>
                  </div>
                  <span className={`badge badge-${m.burnout_risk === 'high' ? 'red' : m.burnout_risk === 'medium' ? 'yellow' : 'green'}`} style={{ fontSize: 10 }}>
                    {m.burnout_risk || 'low'}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Role Allocation */}
        <div className="glass-hud" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Target size={16} color="var(--amber)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Role Allocations</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {members.slice(0, 6).map((m, i) => {
              const roleEmojis = { lead: '👑', frontend: '🎨', backend: '⚙️', designer: '✏️', debugger: '🔍', presenter: '🎤', fullstack: '🔥', member: '👤' };
              const rc = roleColors[m.role_tag] || 'var(--text-muted)';
              return (
                <motion.div key={m.full_name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  style={{ padding: '14px 12px', borderRadius: 14, background: `${rc}08`, border: `1px solid ${rc}20`, textAlign: 'center' }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{roleEmojis[m.role_tag] || '👤'}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: rc, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{(m.role_tag || 'member')}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{m.full_name?.split(' ')[0]}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sprint Summaries ── */}
      {meetingNotes && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card-mission hud-corner-cyan" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>📝</span>
            <div>
              <div className="section-label" style={{ marginBottom: 1 }}>Generated summary</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Sprint Summaries
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10, fontWeight: 400, fontFamily: 'var(--font-mono)' }}>
                  {new Date(meetingNotes.generated_at).toLocaleTimeString()}
                </span>
              </h3>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            {[
              { label: '✅ Completed', items: meetingNotes.completed, color: 'var(--emerald)' },
              { label: '⚡ In Progress', items: meetingNotes.inProgress, color: 'var(--indigo)' },
              { label: '🚧 Blockers', items: meetingNotes.blockers?.length > 0 ? meetingNotes.blockers : ['None reported'], color: 'var(--rose)' },
              { label: '🎯 Next Steps', items: meetingNotes.nextSteps, color: 'var(--cyan)' },
            ].map(section => (
              <div key={section.label} className="terminal" style={{ borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: section.color, marginBottom: 10, fontFamily: 'var(--font-mono)' }}>{section.label}</div>
                {section.items?.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: section.color, marginRight: 4 }}>›</span>{item}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--border-sm)', paddingTop: 12 }}>
            Morale: <strong style={{ color: 'var(--emerald)' }}>{meetingNotes.morale}</strong> · {meetingNotes.summary}
          </div>
        </motion.div>
      )}
    </div>
  );
}
