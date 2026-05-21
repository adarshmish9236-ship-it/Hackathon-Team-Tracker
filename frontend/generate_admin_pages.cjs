const fs = require('fs');
const path = require('path');

const dir = 'e:/PROJECTS/DBMS/frontend/src/pages/admin';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const pages = [
  { name: 'ExecutiveOverview.jsx', title: 'Executive Telemetry', icon: 'Activity', color: 'var(--indigo)' },
  { name: 'LiveTerminal.jsx', title: 'Live Activity Terminal', icon: 'Terminal', color: 'var(--cyan)' },
  { name: 'ThreatMonitor.jsx', title: 'Global Threat Radar', icon: 'Radar', color: 'var(--rose)' },
  { name: 'SystemHealth.jsx', title: 'System Health Engine', icon: 'HeartPulse', color: 'var(--emerald)' },
  { name: 'UserGovernance.jsx', title: 'User Governance', icon: 'Users', color: 'var(--violet)' },
  { name: 'TeamGovernance.jsx', title: 'Deployment Governance', icon: 'Shield', color: 'var(--indigo)' },
  { name: 'AccessControl.jsx', title: 'Access & Permissions', icon: 'Key', color: 'var(--amber)' },
  { name: 'AnalyticsEngine.jsx', title: 'Analytics Engine', icon: 'BarChart3', color: 'var(--cyan)' },
  { name: 'AIInsights.jsx', title: 'AI Command Insights', icon: 'Brain', color: 'var(--violet)' },
  { name: 'DatabaseControl.jsx', title: 'Database Control Center', icon: 'Database', color: 'var(--indigo)' },
  { name: 'BroadcastCenter.jsx', title: 'System Broadcast', icon: 'BellRing', color: 'var(--amber)' },
  { name: 'IncidentCenter.jsx', title: 'Incident Response Center', icon: 'Siren', color: 'var(--rose)' },
  { name: 'SettingsHub.jsx', title: 'Platform Settings', icon: 'Settings', color: 'var(--text-secondary)' },
  { name: 'AuditLogs.jsx', title: 'Audit Logs', icon: 'FileText', color: 'var(--cyan)' },
  { name: 'NotificationCommand.jsx', title: 'Notification Command', icon: 'Send', color: 'var(--indigo)' },
];

pages.forEach(p => {
  const content = `import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ${p.icon} } from 'lucide-react';

export default function ${p.name.replace('.jsx', '')}() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Simulate live data fetching
    const timer = setTimeout(() => setData([1, 2, 3]), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card"
      style={{ minHeight: '80vh', padding: 40, borderTop: '4px solid ${p.color}', position: 'relative', overflow: 'hidden' }}
    >
      {/* Cinematic HUD Elements */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(circle, ${p.color} 0%, transparent 70%)', opacity: 0.05, pointerEvents: 'none' }} />
      <div className="scan-line" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.2 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <${p.icon} size={28} style={{ color: '${p.color}' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>${p.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="live-badge" style={{ background: '${p.color}' }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '${p.color}', letterSpacing: 2 }}>SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-hud"
            style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>METRIC_{i}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>
              {data.length ? Math.floor(Math.random() * 1000) : '---'}
            </div>
            <div className="progress-bar" style={{ height: 4, background: 'rgba(255,255,255,0.05)' }}>
              <div className="progress-fill" style={{ width: \`\${Math.random() * 100}%\`, background: '${p.color}' }} />
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Simulated Terminal Area */}
      <div className="terminal" style={{ marginTop: 32, padding: 24, height: 300, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, color: '${p.color}', fontFamily: 'var(--font-mono)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, marginBottom: 12 }}>
          > INITIATING MODULE: ${p.name}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
          {data.length ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              [SYSTEM] Telemetry link established.<br/>
              [SYSTEM] Awaiting further directives...
            </motion.div>
          ) : (
            <div className="pulse">Establishing connection...</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
`;
  fs.writeFileSync(path.join(dir, p.name), content);
});

console.log('All 15 God-Level admin pages generated successfully.');
