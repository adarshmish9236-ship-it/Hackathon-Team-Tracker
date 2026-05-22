// src/pages/admin/AdminModeration.jsx
import { AlertTriangle, Shield, Flag, Trash2, Ban } from 'lucide-react';

export default function AdminModeration() {
  const reports = [
    { id: 1, type: 'Spam', target: 'User: Eve Hacker', reportedBy: 'Alice Wong', status: 'Pending', time: '1 hour ago' },
    { id: 2, type: 'Misconduct', target: 'Team: Null Pointers', reportedBy: 'System', status: 'Investigating', time: '5 hours ago' },
    { id: 3, type: 'Inappropriate Content', target: 'Submission: Crypto Analyzer', reportedBy: 'Charlie Day', status: 'Resolved', time: '1 day ago' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Moderation & Reports</h1>
        <p style={{ color: '#888', margin: 0 }}>Review reports, enforce community guidelines, and manage disciplinary actions.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Flag size={20} color="#ef4444" />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>Active Reports</h2>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#0a0a0a', color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Report Details</th>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: '#fff', fontWeight: '500', fontSize: '14px', marginBottom: '4px' }}>{report.type}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Target: {report.target}</div>
                    <div style={{ color: '#555', fontSize: '12px' }}>Reported by: {report.reportedBy}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: report.status === 'Resolved' ? 'rgba(16,185,129,0.1)' : report.status === 'Investigating' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: report.status === 'Resolved' ? '#10b981' : report.status === 'Investigating' ? '#f59e0b' : '#ef4444'
                    }}>
                      {report.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button style={{ padding: '8px', background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#10b981', cursor: 'pointer' }} title="Resolve"><Shield size={16} /></button>
                      <button style={{ padding: '8px', background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f59e0b', cursor: 'pointer' }} title="Warn"><AlertTriangle size={16} /></button>
                      <button style={{ padding: '8px', background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }} title="Suspend/Ban"><Ban size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0' }}>Moderation Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}><span>Open Reports</span><span style={{ color: '#fff', fontWeight: '600' }}>2</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}><span>Users Warned</span><span style={{ color: '#fff', fontWeight: '600' }}>14</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}><span>Users Suspended</span><span style={{ color: '#fff', fontWeight: '600' }}>3</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}><span>Content Removed</span><span style={{ color: '#fff', fontWeight: '600' }}>8</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
