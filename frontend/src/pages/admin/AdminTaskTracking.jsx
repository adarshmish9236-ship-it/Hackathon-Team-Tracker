// src/pages/admin/AdminTaskTracking.jsx
import { CheckCircle2, Circle, Clock, LayoutTemplate } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminTaskTracking() {
  const taskData = [
    { name: 'Quantum Leaps', completed: 45, pending: 12, overdue: 2 },
    { name: 'Data Miners', completed: 30, pending: 25, overdue: 5 },
    { name: 'NeuralNet', completed: 80, pending: 5, overdue: 0 },
    { name: 'Null Pointers', completed: 10, pending: 40, overdue: 15 },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Task & Progress Tracking</h1>
        <p style={{ color: '#888', margin: 0 }}>Monitor team productivity, milestone completions, and identify bottlenecks.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '16px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '24px', marginTop: 0 }}>Team Task Velocity</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
                <XAxis type="number" stroke="#888" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }} />
                <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" radius={[0,0,0,0]} barSize={20} />
                <Bar dataKey="pending" stackId="a" fill="#3b82f6" name="Pending" />
                <Bar dataKey="overdue" stackId="a" fill="#ef4444" name="Overdue" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <StatBox title="Platform-wide Tasks" value="1,432" icon={LayoutTemplate} color="#3b82f6" />
          <StatBox title="Tasks Completed" value="892" icon={CheckCircle2} color="#10b981" />
          <StatBox title="Tasks In Progress" value="450" icon={Circle} color="#f59e0b" />
          <StatBox title="Tasks Overdue" value="90" icon={Clock} color="#ef4444" />
        </div>
      </div>
    </div>
  );
}

function StatBox({ title, value, icon: Icon, color }) {
  return (
    <div style={{ backgroundColor: '#121212', padding: '20px', borderRadius: '16px', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ color: '#fff', fontSize: '24px', fontWeight: '700' }}>{value}</div>
        <div style={{ color: '#888', fontSize: '13px' }}>{title}</div>
      </div>
    </div>
  );
}
