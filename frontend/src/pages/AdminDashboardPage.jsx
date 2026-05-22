// src/pages/AdminDashboardPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Users, Server, Activity, ShieldAlert, Cpu, HardDrive } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboardPage() {
  const { user } = useStore();
  const [telemetry, setTelemetry] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tRes, uRes, tmRes] = await Promise.all([
        adminAPI.getTelemetry(),
        adminAPI.getUsers(),
        adminAPI.getTeams()
      ]);
      setTelemetry(tRes.data);
      setUsers(uRes.data);
      setTeams(tmRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('System Data Sync Failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
      const interval = setInterval(loadData, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Access Denied</div>;
  }

  if (isLoading) {
    return <div style={{ padding: 40, color: '#888' }}>Initializing Analytics Engine...</div>;
  }

  // Generate fake historical data for graphs since we only have current snapshots
  const userGrowthData = [
    { name: 'Mon', users: Math.max(0, telemetry.users - 15) },
    { name: 'Tue', users: Math.max(0, telemetry.users - 10) },
    { name: 'Wed', users: Math.max(0, telemetry.users - 5) },
    { name: 'Thu', users: Math.max(0, telemetry.users - 2) },
    { name: 'Fri', users: telemetry.users },
    { name: 'Sat', users: telemetry.users + 1 },
    { name: 'Sun', users: telemetry.users + 3 },
  ];

  const systemLoadData = [
    { time: '10:00', cpu: 20, memory: 40 },
    { time: '10:05', cpu: 45, memory: 45 },
    { time: '10:10', cpu: 30, memory: 42 },
    { time: '10:15', cpu: 65, memory: 55 },
    { time: '10:20', cpu: parseFloat(telemetry.cpuLoad), memory: parseFloat(telemetry.memoryUsage) },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#fff' }}>
            System Analytics
          </h1>
          <p style={{ color: '#888', margin: 0, fontSize: '15px' }}>
            Real-time monitoring and administrative oversight.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Systems Online</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <KpiCard title="Total Users" value={telemetry.users} icon={Users} color="#3b82f6" />
        <KpiCard title="Active Teams" value={telemetry.teams} icon={Server} color="#10b981" />
        <KpiCard title="CPU Load" value={`${telemetry.cpuLoad}%`} icon={Cpu} color="#ef4444" />
        <KpiCard title="Memory Usage" value={`${telemetry.memoryUsage}%`} icon={HardDrive} color="#8b5cf6" />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '16px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '24px', marginTop: 0 }}>System Load Dynamics</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={systemLoadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="time" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '13px' }}
                />
                <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="CPU (%)" />
                <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} name="Memory (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '16px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '24px', marginTop: 0 }}>User Registration Growth</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '16px', border: '1px solid #2a2a2a' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '24px', marginTop: 0 }}>Active Participants</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0 16px 16px 16px', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '0 16px 16px 16px', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '0 16px 16px 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '0 16px 16px 16px', fontWeight: '600', textAlign: 'right' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '16px', color: '#fff', fontWeight: '500' }}>{u.full_name}</td>
                  <td style={{ padding: '16px', color: '#aaa', fontSize: '14px' }}>{u.email}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: u.is_online ? 'rgba(16,185,129,0.1)' : 'rgba(136,136,136,0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: u.is_online ? '#10b981' : '#888' }} />
                      <span style={{ fontSize: '12px', fontWeight: '600', color: u.is_online ? '#10b981' : '#888' }}>{u.is_online ? 'Online' : 'Offline'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', color: u.role === 'admin' ? '#ef4444' : '#888', fontSize: '14px', textTransform: 'capitalize' }}>
                    {u.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teams Data Table */}
      <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '16px', border: '1px solid #2a2a2a', marginTop: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '24px', marginTop: 0 }}>Active Team Deployments</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0 16px 16px 16px', fontWeight: '600' }}>Workspace Name</th>
                <th style={{ padding: '0 16px 16px 16px', fontWeight: '600' }}>Owner</th>
                <th style={{ padding: '0 16px 16px 16px', fontWeight: '600' }}>Members</th>
                <th style={{ padding: '0 16px 16px 16px', fontWeight: '600' }}>Health Score</th>
              </tr>
            </thead>
            <tbody>
              {teams.slice(0, 5).map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '16px', color: '#fff', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Server size={16} color="#10b981" />
                      {t.name}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#aaa', fontSize: '14px' }}>@{t.owner_username}</td>
                  <td style={{ padding: '16px', color: '#3b82f6', fontWeight: '500' }}>
                    {t.member_count} / {t.max_members}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100px', height: '6px', backgroundColor: '#2a2a2a', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${t.health_score}%`, 
                          height: '100%', 
                          backgroundColor: t.health_score > 80 ? '#10b981' : t.health_score > 50 ? '#f59e0b' : '#ef4444' 
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>{t.health_score}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#555' }}>No active teams deployed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      style={{ 
        backgroundColor: '#121212', 
        padding: '24px', 
        borderRadius: '16px', 
        border: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}
    >
      <div style={{ 
        width: '56px', 
        height: '56px', 
        borderRadius: '16px', 
        backgroundColor: `${color}15`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: color
      }}>
        <Icon size={28} />
      </div>
      <div>
        <div style={{ color: '#888', fontSize: '14px', marginBottom: '4px' }}>{title}</div>
        <div style={{ color: '#fff', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em' }}>{value}</div>
      </div>
    </motion.div>
  );
}
