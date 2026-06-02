import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MessageSquare, Edit2, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { adminAPI } from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminTeamManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTrack, setEditTrack] = useState('');
  const [editStatus, setEditStatus] = useState('active');

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messagingTeam, setMessagingTeam] = useState(null);
  const [messageText, setMessageText] = useState('');

  const loadTeams = () => {
    adminAPI.getTeams()
      .then(r => setTeams(r.data))
      .catch(err => {
        console.error(err);
        toast.error('Failed to load teams');
      });
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setEditName(team.name || '');
    setEditDesc(team.description || '');
    setEditTrack(team.hackathon_name || '');
    setEditStatus(team.status || 'active');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }
    try {
      await adminAPI.updateTeam(editingTeam.id, {
        name: editName,
        description: editDesc,
        hackathon_name: editTrack,
        status: editStatus
      });
      toast.success('Team details updated');
      setShowEditModal(false);
      loadTeams();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update team');
    }
  };

  const handleOpenMessage = (team) => {
    setMessagingTeam(team);
    setMessageText('');
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error('Message content cannot be empty');
      return;
    }
    try {
      await adminAPI.notify({
        target: 'teams',
        team_id: messagingTeam.id,
        message: messageText
      });
      toast.success('Announcement sent to team members');
      setShowMessageModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send announcement');
    }
  };

  const handleToggleFreeze = async (team) => {
    try {
      const res = await adminAPI.toggleFreezeTeam(team.id);
      const isFrozen = res.data.status === 'archived';
      toast.success(isFrozen ? 'Team frozen successfully' : 'Team unfrozen successfully');
      loadTeams();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update freeze status');
    }
  };

  const handleDelete = async (team) => {
    if (window.confirm(`Are you sure you want to permanently delete team "${team.name}"?`)) {
      try {
        await adminAPI.deleteTeam(team.id);
        toast.success('Team deleted successfully');
        loadTeams();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete team');
      }
    }
  };

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
            {filteredTeams.map((team) => {
              const isFrozen = team.status === 'archived';
              return (
                <tr key={team.id} style={{ borderBottom: '1px solid #1a1a1a', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>{team.name}</div>
                    <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>Leader: {team.owner_name || 'N/A'} • {team.member_count} members</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: '#fff', fontSize: '14px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.description || 'No Project'}</div>
                    <div style={{ color: '#3b82f6', fontSize: '13px', marginTop: '4px' }}>{team.hackathon_name || 'SyncSphere Global'}</div>
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
                      backgroundColor: isFrozen ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                      color: isFrozen ? '#f59e0b' : '#10b981'
                    }}>
                      {isFrozen ? 'Frozen' : (team.status || 'Active')}
                    </span>
                    <div style={{ color: '#555', fontSize: '11px', marginTop: '6px' }}>Registered: {new Date(team.created_at).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <ActionBtn icon={MessageSquare} title="Message Team" onClick={() => handleOpenMessage(team)} />
                      <ActionBtn icon={Edit2} title="Edit Team" onClick={() => handleOpenEdit(team)} />
                      <ActionBtn 
                        icon={isFrozen ? Shield : ShieldOff} 
                        title={isFrozen ? "Unfreeze Team" : "Freeze Team"} 
                        color={isFrozen ? "#10b981" : "#f59e0b"} 
                        onClick={() => handleToggleFreeze(team)} 
                      />
                      <ActionBtn icon={Trash2} title="Delete Team" color="#ef4444" onClick={() => handleDelete(team)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingTeam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px', width: '480px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '700' }}>Edit Team: {editingTeam.name}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>Team Name</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ padding: '10px 14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>Description</label>
              <textarea 
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                style={{ padding: '10px 14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>Hackathon Track</label>
              <input 
                type="text" 
                value={editTrack}
                onChange={(e) => setEditTrack(e.target.value)}
                style={{ padding: '10px 14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>Status</label>
              <select 
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={{ padding: '10px 14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' }}
              >
                <option value="active">Active</option>
                <option value="forming">Forming</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived (Frozen)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                style={{ padding: '10px 20px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && messagingTeam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px', width: '480px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '700' }}>Message Team: {messagingTeam.name}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>Broadcast Message to Members</label>
              <textarea 
                rows={4}
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{ padding: '10px 14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                onClick={() => setShowMessageModal(false)}
                style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendMessage}
                style={{ padding: '10px 20px', backgroundColor: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Send Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, title, color = '#888', onClick }) {
  return (
    <button 
      title={title} 
      onClick={onClick}
      style={{ 
        padding: '8px', 
        backgroundColor: 'transparent', 
        border: '1px solid #2a2a2a', 
        borderRadius: '6px', 
        color: color, 
        cursor: 'pointer', 
        transition: 'all 0.2s' 
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.backgroundColor = `${color}15`; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <Icon size={16} />
    </button>
  );
}
