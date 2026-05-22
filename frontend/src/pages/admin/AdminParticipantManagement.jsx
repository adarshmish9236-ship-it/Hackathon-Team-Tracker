import { useState, useEffect } from 'react';
import { Search, Filter, Shield, UserX, Mail, AlertTriangle } from 'lucide-react';
import { adminAPI } from '../../api/axios';

export default function AdminParticipantManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    adminAPI.getUsers().then(r => setUsers(r.data)).catch(console.error);
  }, []);

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Participant Management</h1>
          <p style={{ color: '#888', margin: 0 }}>Review, assign, and moderate all hackathon participants.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search participants..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 16px 10px 40px', backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', outline: 'none', width: '250px' }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
            <Filter size={18} /> Filters
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#0a0a0a', color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Participant</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Skills & Team</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Activity</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #1a1a1a', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600' }}>
                      {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>{user.full_name || user.username}</div>
                      <div style={{ color: '#888', fontSize: '13px' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ padding: '2px 8px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '11px', color: '#aaa' }}>Hacker</span>
                  </div>
                  <div style={{ color: '#3b82f6', fontSize: '13px' }}>In {user.team_count} Teams</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ color: '#fff', fontSize: '14px' }}>{user.xp_points} XP Points</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    backgroundColor: user.is_online ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: user.is_online ? '#10b981' : '#ef4444'
                  }}>
                    {user.is_online ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <ActionBtn icon={Mail} title="Message" />
                    <ActionBtn icon={Shield} title="Promote to Moderator" color="#3b82f6" />
                    <ActionBtn icon={AlertTriangle} title="Send Warning" color="#f59e0b" />
                    <ActionBtn icon={UserX} title="Suspend User" color="#ef4444" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, title, color = '#888' }) {
  return (
    <button title={title} style={{ padding: '8px', backgroundColor: 'transparent', border: '1px solid #2a2a2a', borderRadius: '6px', color: color, cursor: 'pointer', transition: 'all 0.2s' }}>
      <Icon size={16} />
    </button>
  );
}
