// src/pages/AIInsightsPage.jsx — AI Command Center (Full Futuristic Upgrade)
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
  critical: '#ef4444', high: '#f97316', medium: 'var(--accent-yellow)',
  low: 'var(--accent-cyan)', velocity: 'var(--accent-purple)',
};
const TYPE_ICON = {
  risk: '⚠️', burnout: '🔥', deadline: '⏰', inactive: '💤',
  suggest: '💡', bottleneck: '🚧', velocity: '⚡',
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
          background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), transparent 60%), linear-gradient(135deg, rgba(79,142,247,0.8), rgba(168,85,247,0.8))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        <div className="scan-line" />
        <Brain size={36} color="white" />
      </motion.div>
      {/* Health arc label */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        fontSize: 13, fontWeight: 700, color,
        background: 'rgba(0,0,0,0.5)', padding: '2px 10px', borderRadius: 99,
        backdropFilter: 'blur(8px)',
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
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: 14, fontWeight: 700, fill: color, fontFamily: 'JetBrains Mono, monospace' }}>
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
  const { setAIInsights }   = useStore();
  const intervalRef = useRef(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const r = await analyticsAPI.getInsights(teamId);
      setData(r.data);
      setAIInsights(r.data);
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
  const roleColors = { frontend:'var(--accent-blue)', backend:'var(--accent-purple)', designer:'var(--accent-pink)', presenter:'var(--accent-green)', debugger:'var(--accent-yellow)', fullstack:'var(--accent-cyan)', lead:'#FFD700', member:'var(--text-muted)' };

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.7rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={26} color="var(--accent-purple)" style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.6))' }} />
            <span className="gradient-text">AI Command Center</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time intelligence · Updates every 30s</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => load(true)} className="btn-ghost" style={{ fontSize: 13 }}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin-slow 1s linear infinite' : 'none' }} />
          {refreshing ? 'Updating...' : 'Refresh'}
        </motion.button>
      </div>

      {/* Hero Row: Orb + Key Metrics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-hud hud-corner" style={{ padding: 32, marginBottom: 24, display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
        <AIOrb health={sprintHealth} />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 24 }}>
          <HealthRing value={sprintHealth}    label="Sprint Health" color="var(--accent-blue)"   />
          <HealthRing value={completionPct}   label="Completion"    color="var(--accent-green)"  />
          <HealthRing value={Math.min(parseFloat(velocity) * 20, 100)} label="Velocity" color="var(--accent-cyan)" />
          <HealthRing value={workload.avgScore || 50} label="Avg Productivity" color="var(--accent-purple)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
          <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>DAYS TO DEADLINE</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: daysLeft !== null && daysLeft < 2 ? '#ef4444' : 'var(--accent-cyan)' }} className="text-glow-cyan">
              {daysLeft ?? '∞'}
            </div>
          </div>
          <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>AI PREDICTION</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{predictedCompletion || '—'}</div>
          </div>
        </div>
      </motion.div>

      {/* Critical Alerts Banner */}
      {criticalInsights.length > 0 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 0.5 }}>
            <AlertTriangle size={20} color="#ef4444" />
          </motion.div>
          <div>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 6, fontSize: 14 }}>⚡ CRITICAL ALERTS ({criticalInsights.length})</div>
            {criticalInsights.map((ins, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>• {ins.msg}</div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Smart Insights */}
        <div className="glass-hud" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Brain size={15} color="var(--accent-purple)" /> AI Smart Insights ({otherInsights.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
            {otherInsights.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--accent-green)' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13 }}>All systems nominal! Team is performing great.</p>
              </div>
            )}
            {otherInsights.map((ins, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                style={{ padding: '12px 14px', borderRadius: 10, background: `${SEVERITY_COLOR[ins.severity] || 'var(--accent-cyan)'}10`, border: `1px solid ${SEVERITY_COLOR[ins.severity] || 'var(--accent-cyan)'}25`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{TYPE_ICON[ins.type] || '📊'}</span>
                <div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>{ins.msg}</p>
                  <span className={`badge badge-${ins.severity === 'high' ? 'red' : ins.severity === 'medium' ? 'yellow' : 'cyan'}`} style={{ marginTop: 4, fontSize: 10 }}>{ins.severity}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Radar Chart - Member Analysis */}
        <div className="glass-hud" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={15} color="var(--accent-cyan)" /> Team Performance Radar
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Radar name="Productivity" dataKey="productivity" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Tasks" dataKey="tasks" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 10, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No productivity data yet. Run score calculation.</p>}
        </div>
      </div>

      {/* Member Cards + Role Allocation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Member Analysis */}
        <div className="glass-hud" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} color="var(--accent-blue)" /> Member Intelligence
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map((m, i) => (
              <motion.div key={m.full_name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${roleColors[m.role_tag]||'var(--accent-blue)'},var(--accent-purple))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0, boxShadow: `0 0 10px ${roleColors[m.role_tag]||'var(--accent-blue)'}50` }}>
                  {m.full_name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{m.full_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="progress-bar" style={{ flex: 1, height: 4 }}>
                      <motion.div className="progress-fill" initial={{ width: 0 }}
                        animate={{ width: `${m.overall_score || 0}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                        style={{ background: (m.overall_score || 0) > 70 ? 'linear-gradient(90deg,var(--accent-green),#34d399)' : (m.overall_score || 0) > 40 ? 'linear-gradient(90deg,var(--accent-yellow),#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: (m.overall_score || 0) > 70 ? 'var(--accent-green)' : (m.overall_score || 0) > 40 ? 'var(--accent-yellow)' : '#ef4444', minWidth: 32, textAlign: 'right' }}>{Math.round(m.overall_score || 0)}%</span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: m.burnout_risk === 'high' ? '#ef4444' : m.burnout_risk === 'medium' ? 'var(--accent-yellow)' : 'var(--accent-green)', fontWeight: 600, background: `${m.burnout_risk === 'high' ? '#ef444415' : m.burnout_risk === 'medium' ? '#f59e0b15' : '#10b98115'}`, padding: '2px 8px', borderRadius: 99 }}>
                  {m.burnout_risk || 'low'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Smart Role Allocation */}
        <div className="glass-hud" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={15} color="var(--accent-yellow)" /> AI Role Allocation
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {members.slice(0, 6).map((m, i) => {
              const roleEmojis = { lead: '👑', frontend: '🎨', backend: '⚙️', designer: '✏️', debugger: '🔍', presenter: '🎤', fullstack: '🔥', member: '👤' };
              return (
                <motion.div key={m.full_name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{roleEmojis[m.role_tag] || '👤'}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: roleColors[m.role_tag] || 'var(--text-muted)', marginBottom: 2 }}>{(m.role_tag || 'member').toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{m.full_name?.split(' ')[0]}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Meeting Notes */}
      {meetingNotes && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-hud" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🤖 AI-Generated Meeting Notes
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>{new Date(meetingNotes.generated_at).toLocaleTimeString()}</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            {[
              { label: '✅ Completed', items: meetingNotes.completed, color: 'var(--accent-green)' },
              { label: '⚡ In Progress', items: meetingNotes.inProgress, color: 'var(--accent-blue)' },
              { label: '🚧 Blockers', items: meetingNotes.blockers?.length > 0 ? meetingNotes.blockers : ['None reported'], color: '#ef4444' },
              { label: '🎯 Next Steps', items: meetingNotes.nextSteps, color: 'var(--accent-cyan)' },
            ].map(section => (
              <div key={section.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 14, border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: section.color, marginBottom: 8 }}>{section.label}</div>
                {section.items?.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 2 }}>· {item}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            Morale: <strong style={{ color: 'var(--accent-green)' }}>{meetingNotes.morale}</strong> · {meetingNotes.summary}
          </div>
        </motion.div>
      )}
    </div>
  );
}
