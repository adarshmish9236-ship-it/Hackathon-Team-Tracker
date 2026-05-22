import { useState, useEffect } from 'react';
import { Send, BellRing, History, Globe, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/axios';

export default function AdminAnnouncements() {
  const [msg, setMsg] = useState('');
  const [target, setTarget] = useState('global');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    adminAPI.getTeams().then(r => setTeams(r.data)).catch(() => {});
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    if (target === 'teams' && !teamId) {
      toast.error('Please select a specific team first.');
      return;
    }
    setIsSending(true);
    try {
      await adminAPI.notify({ target, team_id: teamId, message: msg });
      toast.success('Announcement broadcasted successfully!');
      setMsg('');
    } catch (err) {
      toast.error('Failed to broadcast announcement.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Announcements & Notifications</h1>
        <p style={{ color: '#888', margin: 0 }}>Broadcast critical alerts, reminders, and updates to participants.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <BellRing size={24} color="#3b82f6" />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', margin: 0 }}>Compose Message</h2>
          </div>

          <form onSubmit={handleSend}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>Target Audience</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ flex: 1, padding: '16px', border: target === 'global' ? '1px solid #3b82f6' : '1px solid #2a2a2a', backgroundColor: target === 'global' ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="target" value="global" checked={target==='global'} onChange={()=>setTarget('global')} style={{ display: 'none' }} />
                  <Globe size={18} color={target === 'global' ? '#3b82f6' : '#555'} /> Global Broadcast
                </label>
                <label style={{ flex: 1, padding: '16px', border: target === 'teams' ? '1px solid #10b981' : '1px solid #2a2a2a', backgroundColor: target === 'teams' ? 'rgba(16,185,129,0.1)' : '#0a0a0a', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="target" value="teams" checked={target==='teams'} onChange={()=>setTarget('teams')} style={{ display: 'none' }} />
                  <Users size={18} color={target === 'teams' ? '#10b981' : '#555'} /> Specific Teams
                </label>
              </div>
            </div>

            {target === 'teams' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>Select Team</label>
                <select 
                  value={teamId}
                  onChange={e => setTeamId(e.target.value)}
                  style={{ width: '100%', padding: '16px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }}
                >
                  <option value="">-- Select a Team --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>Message Content</label>
              <textarea 
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Type your announcement here..."
                style={{ width: '100%', height: '150px', padding: '16px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <button type="submit" disabled={isSending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', backgroundColor: isSending ? '#555' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: isSending ? 'not-allowed' : 'pointer' }}>
              <Send size={18} /> {isSending ? 'Dispatching...' : 'Dispatch Notification'}
            </button>
          </form>
        </div>

        <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <History size={18} color="#888" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>Recent Broadcasts</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderLeft: '2px solid #ef4444', paddingLeft: '12px' }}>
              <div style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>Deadline Extended by 2 hours!</div>
              <div style={{ color: '#555', fontSize: '12px' }}>Global • 2 hours ago</div>
            </div>
            <div style={{ borderLeft: '2px solid #3b82f6', paddingLeft: '12px' }}>
              <div style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>Welcome to the Hackathon! API Docs are now live.</div>
              <div style={{ color: '#555', fontSize: '12px' }}>Global • 1 day ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
