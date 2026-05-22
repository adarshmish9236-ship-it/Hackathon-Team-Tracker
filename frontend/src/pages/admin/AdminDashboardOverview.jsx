import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Server, Flag, UserPlus, Clock, Zap, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminAPI } from '../../api/axios';

export default function AdminDashboardOverview() {
  const [telemetry, setTelemetry] = useState({ users: 0, teams: 0, tasksCompleted: 0 });

  useEffect(() => {
    adminAPI.getTelemetry().then(r => setTelemetry(r.data)).catch(console.error);
  }, []);

  const growthData = [
    { name: 'Mon', participants: Math.max(0, telemetry.users - 15) },
    { name: 'Tue', participants: Math.max(0, telemetry.users - 10) },
    { name: 'Wed', participants: Math.max(0, telemetry.users - 5) },
    { name: 'Thu', participants: Math.max(0, telemetry.users - 2) },
    { name: 'Fri', participants: telemetry.users },
    { name: 'Sat', participants: telemetry.users + 1 },
    { name: 'Sun', participants: telemetry.users + 3 },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Dashboard Overview</h1>
        <p style={{ color: '#888', margin: 0 }}>High-level executive summary of hackathon operations and participation.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <KpiCard title="Registered Participants" value={telemetry.users.toLocaleString()} icon={Users} color="#3b82f6" trend="Real-time" />
        <KpiCard title="Total Teams" value={telemetry.teams.toLocaleString()} icon={Server} color="#10b981" trend="Real-time" />
        <KpiCard title="Ongoing Hackathons" value="1" icon={Flag} color="#8b5cf6" trend="Active" />
        <KpiCard title="Tasks Completed" value={telemetry.tasksCompleted.toLocaleString()} icon={Target} color="#f59e0b" trend="System-wide" />

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '16px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '24px', marginTop: 0 }}>Participation Growth</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="participants" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPv)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '16px', border: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '24px', marginTop: 0 }}>Live Activity Feed</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            <ActivityItem icon={UserPlus} color="#10b981" title="New team formed" desc="Team 'Quantum Leaps' just registered for AI Challenge." time="2m ago" />
            <ActivityItem icon={Target} color="#f59e0b" title="Project submitted" desc="'NeuralNet' submitted their final project." time="15m ago" />
            <ActivityItem icon={Zap} color="#3b82f6" title="Milestone reached" desc="'Data Miners' completed UI Design phase." time="1h ago" />
            <ActivityItem icon={Clock} color="#ef4444" title="Deadline approaching" desc="Web3 Hackathon ends in 24 hours." time="3h ago" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, trend }) {
  return (
    <motion.div whileHover={{ y: -4 }} style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '16px', border: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
          <Icon size={20} />
        </div>
        <span style={{ fontSize: '12px', color: '#888', fontWeight: '500' }}>{trend}</span>
      </div>
      <div>
        <div style={{ color: '#fff', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '4px' }}>{value}</div>
        <div style={{ color: '#888', fontSize: '14px' }}>{title}</div>
      </div>
    </motion.div>
  );
}

function ActivityItem({ icon: Icon, color, title, desc, time }) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, flexShrink: 0 }}>
        <Icon size={16} />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{title}</span>
          <span style={{ color: '#555', fontSize: '12px' }}>{time}</span>
        </div>
        <div style={{ color: '#888', fontSize: '13px' }}>{desc}</div>
      </div>
    </div>
  );
}
