import { useState, useEffect } from 'react';
import { Search, Filter, Shield, UserX, Mail, AlertTriangle } from 'lucide-react';
import { adminAPI } from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminParticipantManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);

  // Modals state
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [messagingUser, setMessagingUser] = useState(null);
  const [messageText, setMessageText] = useState('');

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningUser, setWarningUser] = useState(null);
  const [warningText, setWarningText] = useState('');

  const loadUsers = () => {
    adminAPI.getUsers()
      .then(r => setUsers(r.data))
      .catch(err => {
        console.error(err);
        toast.error('Failed to load participants');
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenMessage = (user) => {
    setMessagingUser(user);
    setMessageText('');
    setShowMsgModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error('Message content cannot be empty');
      return;
    }
    try {
      await adminAPI.notify({
        target: 'user',
        user_id: messagingUser.id,
        message: messageText
      });
      toast.success(`Message sent to ${messagingUser.full_name || messagingUser.username}`);
      setShowMsgModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    }
  };

  const handleOpenWarning = (user) => {
    setWarningUser(user);
    setWarningText('');
    setShowWarningModal(true);
  };

  const handleSendWarning = async () => {
    if (!warningText.trim()) {
      toast.error('Warning reason cannot be empty');
      return;
    }
    try {
      await adminAPI.notify({
        target: 'user',
        user_id: warningUser.id,
        message: `⚠️ WARNING: ${warningText}`
      });
      toast.success(`Warning dispatched to ${warningUser.full_name || warningUser.username}`);
      setShowWarningModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send warning');
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'member' : 'admin';
    const actionText = nextRole === 'admin' ? 'Promote to Admin' : 'Demote to Member';
    if (window.confirm(`Are you sure you want to ${actionText.toLowerCase()} for "${user.full_name || user.username}"?`)) {
      try {
        await adminAPI.updateRole(user.id, nextRole);
        toast.success(`User role updated to ${nextRole}`);
        loadUsers();
      } catch (err) {
        console.error(err);
        toast.error('Failed to update role');
      }
    }
  };

  const handleSuspend = async (user) => {
    if (window.confirm(`Are you sure you want to permanently suspend user "${user.full_name || user.username}"? This will delete their account.`)) {
      try {
        await adminAPI.deleteUser(user.id);
        toast.success('Participant suspended and deleted successfully');
        loadUsers();
      } catch (err) {
        console.error(err);
        toast.error('Failed to suspend user');
      }
    }
  };

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
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
            {filteredUsers.map((user) => {
              const isAdmin = user.role === 'admin';
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #1a1a1a', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', border: isAdmin ? '2px solid #ef4444' : 'none' }}>
                        {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>
                          {user.full_name || user.username}
                          {isAdmin && <span style={{ marginLeft: '8px', fontSize: '10px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase' }}>Admin</span>}
                        </div>
                        <div style={{ color: '#888', fontSize: '13px' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      {(typeof user.skills === 'string' ? JSON.parse(user.skills || '[]') : user.skills || []).map((skill, i) => (
                        <span key={i} style={{ padding: '2px 8px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '11px', color: '#aaa' }}>{skill}</span>
                      ))}
                      {(typeof user.skills === 'string' ? JSON.parse(user.skills || '[]') : user.skills || []).length === 0 && (
                        <span style={{ padding: '2px 8px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '11px', color: '#666' }}>No skills listed</span>
                      )}
                    </div>
                    <div style={{ color: '#3b82f6', fontSize: '13px' }}>In {user.team_count || 0} Teams</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: '#fff', fontSize: '14px' }}>{user.xp_points || 0} XP Points</div>
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
                      <ActionBtn icon={Mail} title="Message" color="#888" onClick={() => handleOpenMessage(user)} />
                      <ActionBtn 
                        icon={Shield} 
                        title={isAdmin ? "Demote to Member" : "Promote to Admin"} 
                        color={isAdmin ? "#ef4444" : "#3b82f6"} 
                        onClick={() => handleToggleRole(user)} 
                      />
                      <ActionBtn icon={AlertTriangle} title="Send Warning" color="#f59e0b" onClick={() => handleOpenWarning(user)} />
                      <ActionBtn icon={UserX} title="Suspend User" color="#ef4444" onClick={() => handleSuspend(user)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Message Modal */}
      {showMsgModal && messagingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px', width: '480px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '700' }}>Direct Message to {messagingUser.full_name || messagingUser.username}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>Message Body</label>
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
                onClick={() => setShowMsgModal(false)}
                style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendMessage}
                style={{ padding: '10px 20px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && warningUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px', width: '480px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle color="#f59e0b" size={24} /> Send Official Warning
            </h2>
            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>This warning will be flagged to <strong>{warningUser.full_name || warningUser.username}</strong> on their user dashboard notifications block.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>Reason for Warning</label>
              <textarea 
                rows={3}
                placeholder="Describe behavior/conduct violation..."
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                style={{ padding: '10px 14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                onClick={() => setShowWarningModal(false)}
                style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendWarning}
                style={{ padding: '10px 20px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Send Warning
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
