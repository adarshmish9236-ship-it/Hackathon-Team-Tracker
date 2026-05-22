import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MoreVertical, Edit2, ShieldOff, MessageSquare, Trash2 } from 'lucide-react';
import { adminAPI } from '../../api/axios';

export default function AdminTeamManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    adminAPI.getTeams().then(r => setTeams(r.data)).catch(console.error);
  }, []);

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Team Management</h1>
          <p style={{ color: '#888', margin: 0 }}>Monitor and manage all participating teams across various hackathons.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search teams..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 16px 10px 40px', backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', outline: 'none' }}
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
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Team Info</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Project & Hackathon</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Progress</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((team) => (
              <tr key={team.id} style={{ borderBottom: '1px solid #1a1a1a', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>{team.name}</div>
                  <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>Leader: {team.owner_name} • {team.member_count} members</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ color: '#fff', fontSize: '14px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.description || 'No Project'}</div>
                  <div style={{ color: '#3b82f6', fontSize: '13px', marginTop: '4px' }}>SyncSphere Global</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '100px', height: '6px', backgroundColor: '#2a2a2a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, team.task_count * 5)}%`, height: '100%', backgroundColor: team.task_count > 10 ? '#10b981' : '#3b82f6' }} />
                    </div>
                    <span style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>{team.task_count} tasks</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    color: '#10b981'
                  }}>
                    Active
                  </span>
                  <div style={{ color: '#555', fontSize: '11px', marginTop: '6px' }}>Registered: {new Date(team.created_at).toLocaleDateString()}</div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <ActionBtn icon={MessageSquare} title="Message Team" />
                    <ActionBtn icon={Edit2} title="Edit Team" />
                    <ActionBtn icon={ShieldOff} title="Freeze Team" color="#f59e0b" />
                    <ActionBtn icon={Trash2} title="Delete Team" color="#ef4444" />
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
