const fs = require('fs');
const path = require('path');

const dir = 'e:/PROJECTS/DBMS/frontend/src/pages/admin';

// 1. Executive Overview
const overviewCode = `import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Server, Zap, Globe, Cpu } from 'lucide-react';

export default function ExecutiveOverview() {
  const [cpu, setCpu] = useState(32);
  const [ram, setRam] = useState(64);

  useEffect(() => {
    const i = setInterval(() => {
      setCpu(Math.floor(Math.random() * 20 + 20));
      setRam(Math.floor(Math.random() * 10 + 60));
    }, 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ minHeight: '80vh', padding: 40, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, var(--indigo) 0%, transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.1)', border: '1px solid var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={28} style={{ color: 'var(--indigo)' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: 1 }} className="gradient-text-indigo">GLOBAL TELEMETRY</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="live-badge" style={{ background: 'var(--emerald)' }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--emerald)', letterSpacing: 2 }}>ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 40 }}>
        {[
          { label: 'ACTIVE OPERATIVES', val: '24,892', icon: Users, color: 'var(--cyan)' },
          { label: 'GLOBAL DEPLOYMENTS', val: '1,405', icon: Server, color: 'var(--violet)' },
          { label: 'TASKS RESOLVED', val: '89.2K', icon: Zap, color: 'var(--amber)' },
          { label: 'SYSTEM UPTIME', val: '99.99%', icon: Activity, color: 'var(--emerald)' }
        ].map((m, i) => (
          <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="glass-hud" style={{ padding: 24, borderTop: \`3px solid \${m.color}\` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{m.label}</span>
              <m.icon size={18} style={{ color: m.color }} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'white', fontFamily: "'Space Grotesk',sans-serif" }}>{m.val}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div className="glass-card" style={{ flex: 1, padding: 32, background: 'rgba(5,8,15,0.8)' }}>
          <h3 style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={16} color="var(--indigo)" /> RESOURCE ALLOCATION
          </h3>
          
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--cyan)' }}>CPU LOAD</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'white' }}>{cpu}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8, background: 'rgba(255,255,255,0.05)' }}>
              <motion.div className="progress-fill" animate={{ width: \`\${cpu}%\` }} transition={{ duration: 0.5 }} style={{ background: 'var(--cyan)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--violet)' }}>MEMORY ALLOCATION</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'white' }}>{ram}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8, background: 'rgba(255,255,255,0.05)' }}>
              <motion.div className="progress-fill" animate={{ width: \`\${ram}%\` }} transition={{ duration: 0.5 }} style={{ background: 'var(--violet)' }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}`;

// 2. Live Terminal
const terminalCode = `import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function LiveTerminal() {
  const [logs, setLogs] = useState([
    { id: 1, type: 'INFO', msg: 'System initialized. Listening on port 5000...' },
    { id: 2, type: 'WARN', msg: 'High latency detected on node-cluster-04.' }
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    const messages = [
      'User auth_token generated for adarsh_dev',
      'Deploying new team workspace: Hackathon Alpha',
      'Database query executed in 14ms',
      'Socket connection established from 192.168.1.45',
      '[ALERT] Multiple failed login attempts on root',
      'Garbage collection sweeping orphan records...'
    ];

    const i = setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const type = msg.includes('[ALERT]') ? 'ERROR' : msg.includes('latency') ? 'WARN' : 'INFO';
      setLogs(p => [...p.slice(-40), { id: Date.now(), type, msg }]);
    }, 1200);

    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getColor = (t) => t === 'ERROR' ? 'var(--rose)' : t === 'WARN' ? 'var(--amber)' : 'var(--cyan)';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="terminal" style={{ height: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(6,182,212,0.05)' }}>
        <Terminal size={18} color="var(--cyan)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--cyan)', fontWeight: 600, letterSpacing: 2 }}>LIVE ACTIVITY TERMINAL</span>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, fontFamily: 'var(--font-mono)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {logs.map(l => (
          <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', gap: 16 }}>
            <span style={{ color: 'var(--text-muted)' }}>[{new Date(l.id).toISOString().split('T')[1].slice(0, -1)}]</span>
            <span style={{ color: getColor(l.type), fontWeight: 700, width: 50 }}>{l.type}</span>
            <span style={{ color: l.type === 'ERROR' ? 'var(--rose)' : 'var(--text-secondary)' }}>{l.msg}</span>
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>
    </motion.div>
  );
}`;

// 3. Threat Monitor
const threatCode = `import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, ShieldAlert, Crosshair } from 'lucide-react';

export default function ThreatMonitor() {
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.6) {
        setThreats(p => [{
          id: Date.now(),
          ip: \`\${Math.floor(Math.random()*255)}.\${Math.floor(Math.random()*255)}.1.x\`,
          type: Math.random() > 0.5 ? 'BRUTE FORCE' : 'UNAUTHORIZED ACCESS',
          loc: ['Moscow, RU', 'Beijing, CN', 'Unknown'][Math.floor(Math.random()*3)]
        }, ...p.slice(0, 7)]);
      }
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 24, height: '85vh' }}>
      {/* Radar Section */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(244,63,94,0.2)' }}>
        <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="live-badge" style={{ background: 'var(--rose)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--rose)', fontSize: 14, letterSpacing: 2 }}>THREAT RADAR ACTIVE</span>
        </div>

        {/* Radar Animation */}
        <div style={{ width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(244,63,94,0.2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(244,63,94,0.1)', position: 'absolute' }} />
          <div style={{ width: 200, height: 200, borderRadius: '50%', border: '1px dashed rgba(244,63,94,0.3)', position: 'absolute' }} />
          <Crosshair size={24} color="var(--rose)" style={{ position: 'absolute' }} />
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', width: '50%', height: 2, background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.8))', top: '50%', left: '50%', transformOrigin: '0 50%' }}
          />

          <AnimatePresence>
            {threats.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: 'var(--rose)', boxShadow: '0 0 20px var(--rose)',
                top: \`\${20 + Math.random() * 60}%\`, left: \`\${20 + Math.random() * 60}%\` }}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Threat Log Section */}
      <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="glass-hud" style={{ padding: 20, background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.3)' }}>
          <h3 style={{ fontFamily: 'var(--font-mono)', color: 'var(--rose)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={16} /> RECENT INCURSIONS
          </h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {threats.map(t => (
              <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card" style={{ padding: 16, borderLeft: '3px solid var(--rose)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--rose)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{t.type}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Just now</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'white' }}>IP: {t.ip}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Origin: {t.loc}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          {threats.length === 0 && <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: 40 }}>Scanning... No threats detected.</div>}
        </div>
      </div>
    </div>
  );
}`;

// 4. Analytics Engine
const analyticsCode = `import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsEngine() {
  const data = [
    { name: 'Mon', users: 4000, tasks: 2400 },
    { name: 'Tue', users: 3000, tasks: 1398 },
    { name: 'Wed', users: 2000, tasks: 9800 },
    { name: 'Thu', users: 2780, tasks: 3908 },
    { name: 'Fri', users: 1890, tasks: 4800 },
    { name: 'Sat', users: 2390, tasks: 3800 },
    { name: 'Sun', users: 3490, tasks: 4300 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(6,182,212,0.1)', border: '1px solid var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart3 size={28} style={{ color: 'var(--cyan)' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: 1 }} className="gradient-text-indigo">ANALYTICS ENGINE</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Global platform growth and trajectory.</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 32, height: 400, marginBottom: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginBottom: 24 }}>
          <TrendingUp size={16} /> WEEKLY ENGAGEMENT
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--indigo)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(5,8,15,0.9)', border: '1px solid var(--border-sm)', borderRadius: 8 }} />
            <Area type="monotone" dataKey="users" stroke="var(--indigo)" fillOpacity={1} fill="url(#colorUsers)" />
            <Area type="monotone" dataKey="tasks" stroke="var(--cyan)" fillOpacity={1} fill="url(#colorTasks)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}`;

// 5. Broadcast Center
const broadcastCode = `import { useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BroadcastCenter() {
  const [msg, setMsg] = useState('');
  const [severity, setSeverity] = useState('info');

  const handleDispatch = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    toast.success('GLOBAL BROADCAST DISPATCHED TO ALL NODES', { icon: '📡' });
    setMsg('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ maxWidth: 700, margin: '0 auto', padding: 48, borderTop: '4px solid var(--amber)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
        <div className="pulse" style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <BellRing size={40} color="var(--amber)" />
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 900, color: 'white' }}>SYSTEM BROADCAST</h1>
        <p style={{ color: 'var(--text-muted)' }}>Push real-time alerts to all active sockets instantly.</p>
      </div>

      <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 8 }}>TARGET: ALL ACTIVE NODES</label>
          <textarea className="input" placeholder="Enter broadcast directive..." value={msg} onChange={e=>setMsg(e.target.value)} style={{ width: '100%', height: 120, fontSize: 16, padding: 20 }} />
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['info', 'warning', 'critical'].map(s => (
            <button type="button" key={s} onClick={() => setSeverity(s)} style={{ flex: 1, padding: 16, borderRadius: 12, background: severity === s ? (s==='critical'?'rgba(244,63,94,0.2)':'rgba(245,158,11,0.2)') : 'transparent', border: \`1px solid \${severity === s ? (s==='critical'?'var(--rose)':'var(--amber)') : 'var(--border-sm)'}\`, color: 'white', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', transition: '0.2s' }}>
              {s}
            </button>
          ))}
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', padding: 20, fontSize: 16, justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <Send size={18} /> DISPATCH DIRECTIVE
        </button>
      </form>
    </motion.div>
  );
}`;

const files = [
  { name: 'ExecutiveOverview.jsx', code: overviewCode },
  { name: 'LiveTerminal.jsx', code: terminalCode },
  { name: 'ThreatMonitor.jsx', code: threatCode },
  { name: 'AnalyticsEngine.jsx', code: analyticsCode },
  { name: 'BroadcastCenter.jsx', code: broadcastCode }
];

// Fallback for the other 10
const fallback = [
  { name: 'SystemHealth.jsx', title: 'System Health Engine', icon: 'Activity', color: 'var(--emerald)' },
  { name: 'UserGovernance.jsx', title: 'User Governance', icon: 'Users', color: 'var(--violet)' },
  { name: 'TeamGovernance.jsx', title: 'Deployment Governance', icon: 'Shield', color: 'var(--indigo)' },
  { name: 'AccessControl.jsx', title: 'Access & Permissions', icon: 'Key', color: 'var(--amber)' },
  { name: 'AIInsights.jsx', title: 'AI Command Insights', icon: 'Activity', color: 'var(--violet)' },
  { name: 'DatabaseControl.jsx', title: 'Database Control Center', icon: 'Database', color: 'var(--indigo)' },
  { name: 'IncidentCenter.jsx', title: 'Incident Response Center', icon: 'Activity', color: 'var(--rose)' },
  { name: 'SettingsHub.jsx', title: 'Platform Settings', icon: 'Settings', color: 'var(--text-secondary)' },
  { name: 'AuditLogs.jsx', title: 'Audit Logs', icon: 'Activity', color: 'var(--cyan)' },
  { name: 'NotificationCommand.jsx', title: 'Notification Command', icon: 'Activity', color: 'var(--indigo)' },
];

files.forEach(f => fs.writeFileSync(path.join(dir, f.name), f.code));

fallback.forEach(p => {
  const code = \`import { motion } from 'framer-motion';
import { \${p.icon} } from 'lucide-react';
export default function \${p.name.replace('.jsx', '')}() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ minHeight: '60vh', padding: 40, borderTop: '4px solid \${p.color}' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <\${p.icon} size={28} style={{ color: '\${p.color}' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>\${p.title}</h1>
          <div style={{ color: 'var(--text-muted)' }}>Module active and standing by.</div>
        </div>
      </div>
      <div style={{ padding: 40, textAlign: 'center', border: '1px dashed var(--border-sm)', borderRadius: 16, color: 'var(--text-muted)' }}>
        Advanced UI telemetry configured. Ready for database integration.
      </div>
    </motion.div>
  );
}\`;
  fs.writeFileSync(path.join(dir, p.name), code);
});

console.log('Advanced components injected successfully.');
