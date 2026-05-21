import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Shield, Users, Server, Activity, Terminal, Crosshair, Radar, BellRing, Trash2, ShieldAlert, Cpu } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState('telemetry');
  
  // Data States
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [threats, setThreats] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('info');

  const [logs, setLogs] = useState([
    { id: 1, type: 'INFO', msg: 'Admin session authenticated.' },
    { id: 2, type: 'WARN', msg: 'Awaiting telemetry link...' }
  ]);

  const loadData = async () => {
    try {
      const [uRes, tRes, telRes, thRes] = await Promise.allSettled([
        adminAPI.getUsers(), adminAPI.getTeams(), adminAPI.getTelemetry(), adminAPI.getThreats()
      ]);
      if (uRes.status === 'fulfilled') setUsers(uRes.value.data);
      if (tRes.status === 'fulfilled') setTeams(tRes.value.data);
      if (telRes.status === 'fulfilled') setTelemetry(telRes.value.data);
      if (thRes.status === 'fulfilled') setThreats(thRes.value.data.slice(0, 5));
      
      const failed = [uRes, tRes, telRes, thRes].filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error('Some admin data failed to load:', failed.map(f => f.reason));
        toast.error('Partial data load failure. Check console for details.');
      }
    } catch (err) {
      console.error('Admin Data Load Error:', err);
      toast.error('Failed to load admin data: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadData();
    const i = setInterval(loadData, 5000); // Polling for telemetry updates
    
    // Simulate terminal logs
    const logInterval = setInterval(() => {
      const messages = [
        'User auth_token generated', 'Deploying team workspace', 'Database query 14ms',
        'Socket connection 192.168.1.45', '[ALERT] Failed login root', 'GC sweeping...'
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const type = msg.includes('[ALERT]') ? 'ERROR' : msg.includes('GC') ? 'WARN' : 'INFO';
      setLogs(p => [...p.slice(-15), { id: Date.now(), type, msg }]);
    }, 1800);

    return () => { clearInterval(i); clearInterval(logInterval); };
  }, [user]);

  const handleRoleChange = async (id, role) => {
    try {
      await adminAPI.updateRole(id, role);
      toast.success('Role updated');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('EXTREME DANGER: Delete user permanently?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User purged');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm('EXTREME DANGER: Delete team permanently?')) return;
    try {
      await adminAPI.deleteTeam(id);
      toast.success('Team annihilated');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    try {
      await adminAPI.broadcast(broadcastMsg, broadcastSeverity);
      toast.success('GLOBAL BROADCAST DISPATCHED', { icon: '📡' });
      setBroadcastMsg('');
    } catch (err) { toast.error('Broadcast failed'); }
  };

  if (user?.role !== 'admin') {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--rose)', fontFamily: 'var(--font-mono)' }}>INSUFFICIENT CLEARANCE</div>;
  }

  const tabs = [
    { id: 'telemetry', label: 'TELEMETRY & THREATS', icon: Radar },
    { id: 'users', label: 'USER GOVERNANCE', icon: Users },
    { id: 'teams', label: 'TEAM DEPLOYMENTS', icon: Server },
    { id: 'broadcast', label: 'SYSTEM BROADCAST', icon: BellRing }
  ];

  return (
    <div style={{ padding: '24px 40px', paddingBottom: 100, minHeight: '100vh', background: 'var(--space-void)', position: 'relative' }}>
      <div className="scan-line" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, opacity: 0.15 }} />

      {/* Header HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="hud-corner-cyan" style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,182,212,0.1)' }}>
            <Shield size={32} color="var(--cyan)" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: 1, color: 'white', margin: 0 }}>COMMAND CENTER</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="live-badge" style={{ background: 'var(--emerald)' }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--emerald)', letterSpacing: 2 }}>ALL SYSTEMS NOMINAL</span>
            </div>
          </div>
        </div>

        {/* Top Mini-Stats */}
        <div style={{ display: 'flex', gap: 16 }}>
          {telemetry && [
            { l: 'CPU', v: `${telemetry.cpuLoad}%`, c: 'var(--cyan)' },
            { l: 'RAM', v: `${telemetry.memoryUsage}%`, c: 'var(--violet)' },
            { l: 'SOCKETS', v: telemetry.activeSockets, c: 'var(--amber)' }
          ].map((s,i) => (
            <div key={i} className="glass-hud" style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{s.l}</div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: s.c, fontWeight: 700 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
        {tabs.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8,
                background: active ? 'rgba(6,182,212,0.15)' : 'transparent',
                border: active ? '1px solid rgba(6,182,212,0.4)' : '1px solid transparent',
                color: active ? 'var(--cyan)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer', transition: '0.2s'
              }}>
              <t.icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
          
          {/* TAB 1: TELEMETRY & THREATS */}
          {activeTab === 'telemetry' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              
              {/* Radar Card */}
              <div className="glass-card" style={{ padding: 24, borderTop: '4px solid var(--rose)', position: 'relative', overflow: 'hidden' }}>
                <h3 style={{ fontFamily: 'var(--font-mono)', color: 'var(--rose)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <Radar size={18} /> THREAT RADAR
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                  <div style={{ width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(244,63,94,0.2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(244,63,94,0.1)', position: 'absolute' }} />
                    <div style={{ width: 140, height: 140, borderRadius: '50%', border: '1px dashed rgba(244,63,94,0.3)', position: 'absolute' }} />
                    <Crosshair size={24} color="var(--rose)" style={{ position: 'absolute' }} />
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      style={{ position: 'absolute', width: '50%', height: 2, background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.8))', top: '50%', left: '50%', transformOrigin: '0 50%' }}
                    />
                    {threats.map((t, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5, repeat: Infinity, repeatType: 'reverse', duration: 1 }}
                        style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: 'var(--rose)', boxShadow: '0 0 15px var(--rose)',
                        top: `${30 + Math.random() * 40}%`, left: `${30 + Math.random() * 40}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>RECENT INCURSIONS</div>
                  {threats.map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(255,255,255,0.05)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--rose)' }}>{t.type}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{t.source_ip}</span>
                    </div>
                  ))}
                  {threats.length === 0 && <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>No threats detected.</div>}
                </div>
              </div>

              {/* Terminal Card */}
              <div className="terminal glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <Terminal size={18} /> LIVE ACTIVITY TERMINAL
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {logs.map(l => (
                    <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>[{new Date(l.id).toISOString().split('T')[1].slice(0,-1)}]</span>
                      <span style={{ color: l.type === 'ERROR' ? 'var(--rose)' : l.type === 'WARN' ? 'var(--amber)' : 'var(--cyan)', fontWeight: 700, width: 45 }}>{l.type}</span>
                      <span style={{ color: l.type === 'ERROR' ? 'var(--rose)' : 'var(--text-secondary)' }}>{l.msg}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: USER GOVERNANCE */}
          {activeTab === 'users' && (
            <div className="glass-card" style={{ padding: 24, borderTop: '4px solid var(--violet)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      <th style={{ padding: 16 }}>OPERATIVE</th>
                      <th style={{ padding: 16 }}>CLEARANCE</th>
                      <th style={{ padding: 16 }}>XP</th>
                      <th style={{ padding: 16 }}>STATUS</th>
                      <th style={{ padding: 16, textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--cyan)' }}>
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'white' }}>{u.full_name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 16 }}>
                          <select className="input" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} style={{ padding: '6px 12px', fontSize: 12, height: 'auto', background: u.role === 'admin' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? 'var(--indigo-light)' : 'white', border: u.role === 'admin' ? '1px solid var(--indigo)' : '1px solid rgba(255,255,255,0.1)' }}>
                            <option value="member">MEMBER</option>
                            <option value="admin">ADMIN</option>
                          </select>
                        </td>
                        <td style={{ padding: 16, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>{u.xp_points}</td>
                        <td style={{ padding: 16 }}>
                          {u.is_online ? <span className="badge badge-green"><div className="dot-online" style={{ width:6, height:6, marginRight:6 }}/>ONLINE</span> : <span className="badge" style={{ background:'rgba(255,255,255,0.05)', color:'var(--text-muted)' }}>OFFLINE</span>}
                        </td>
                        <td style={{ padding: 16, textAlign: 'right' }}>
                          <button onClick={() => handleDeleteUser(u.id)} className="btn-icon" style={{ color: 'var(--rose)', background: 'rgba(244,63,94,0.1)' }} title="Purge Operative">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TEAM GOVERNANCE */}
          {activeTab === 'teams' && (
            <div className="glass-card" style={{ padding: 24, borderTop: '4px solid var(--emerald)' }}>
               <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      <th style={{ padding: 16 }}>WORKSPACE</th>
                      <th style={{ padding: 16 }}>OWNER</th>
                      <th style={{ padding: 16 }}>MEMBERS</th>
                      <th style={{ padding: 16 }}>HEALTH</th>
                      <th style={{ padding: 16, textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: 16 }}>
                          <div style={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Server size={16} color="var(--emerald)" /> {t.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CODE: {t.invite_code}</div>
                        </td>
                        <td style={{ padding: 16 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>@{t.owner_username}</span>
                        </td>
                        <td style={{ padding: 16, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{t.member_count} / {t.max_members}</td>
                        <td style={{ padding: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.05)' }}>
                              <div className="progress-fill" style={{ width: `${t.health_score}%`, background: t.health_score > 80 ? 'var(--emerald)' : t.health_score > 50 ? 'var(--amber)' : 'var(--rose)' }} />
                            </div>
                            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{t.health_score}%</span>
                          </div>
                        </td>
                        <td style={{ padding: 16, textAlign: 'right' }}>
                          <button onClick={() => handleDeleteTeam(t.id)} className="btn-icon" style={{ color: 'var(--rose)', background: 'rgba(244,63,94,0.1)' }} title="Annihilate Team">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="glass-card" style={{ maxWidth: 700, margin: '0 auto', padding: 48, borderTop: '4px solid var(--amber)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <BellRing size={48} color="var(--amber)" style={{ marginBottom: 16 }} className="pulse" />
                <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color: 'white' }}>GLOBAL TRANSMISSION</h2>
                <p style={{ color: 'var(--text-muted)' }}>Push real-time critical alerts to all active operatives instantly via Socket.IO.</p>
              </div>

              <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 8 }}>DIRECTIVE MESSAGE</label>
                  <textarea className="input" placeholder="Enter broadcast text..." value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} style={{ width: '100%', height: 120, fontSize: 16, padding: 20 }} />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  {['info', 'warning', 'critical'].map(s => (
                    <button type="button" key={s} onClick={() => setBroadcastSeverity(s)} style={{ flex: 1, padding: 16, borderRadius: 12, background: broadcastSeverity === s ? (s==='critical'?'rgba(244,63,94,0.2)':'rgba(245,158,11,0.2)') : 'transparent', border: `1px solid ${broadcastSeverity === s ? (s==='critical'?'var(--rose)':'var(--amber)') : 'var(--border-sm)'}`, color: 'white', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', transition: '0.2s' }}>
                      {s}
                    </button>
                  ))}
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: 20, fontSize: 16, justifyContent: 'center', gap: 12, marginTop: 16, background: 'linear-gradient(135deg, var(--amber) 0%, #d97706 100%)', border: 'none', color: '#000' }}>
                  <ShieldAlert size={18} /> INITIATE GLOBAL OVERRIDE
                </button>
              </form>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
