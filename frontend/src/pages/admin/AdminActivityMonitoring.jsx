// src/pages/admin/AdminActivityMonitoring.jsx
import { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Upload, Users, LogIn, Code, BellRing, Globe, CheckCircle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/axios';

const getActionMeta = (action, metaStr) => {
  let desc = action;
  let Icon = Activity;
  let color = '#3b82f6';
  
  let meta = {};
  try {
    if (metaStr) meta = typeof metaStr === 'string' ? JSON.parse(metaStr) : metaStr;
  } catch (e) {}

  switch(action) {
    case 'user_login':
    case 'login':
      desc = 'Logged into the platform';
      Icon = LogIn;
      color = '#888888';
      break;
    case 'user_register':
      desc = 'Created a new account';
      Icon = Users;
      color = '#3b82f6';
      break;
    case 'team_created':
      desc = `Created a new workspace team`;
      Icon = Users;
      color = '#f59e0b';
      break;
    case 'team_joined':
      desc = `Joined workspace team`;
      Icon = Users;
      color = '#10b981';
      break;
    case 'task_created':
      desc = 'Created a new team task';
      Icon = Code;
      color = '#8b5cf6';
      break;
    case 'task_completed':
      desc = 'Completed an assigned task';
      Icon = CheckCircle;
      color = '#10b981';
      break;
    case 'admin_notify':
      desc = `Sent targeted announcement: "${meta.message || ''}"`;
      Icon = BellRing;
      color = '#ef4444';
      break;
    case 'global_broadcast':
      desc = `Sent global broadcast alert: "${meta.message || ''}"`;
      Icon = Globe;
      color = '#ef4444';
      break;
    case 'chat_sent':
      desc = 'Sent a team chat message';
      Icon = MessageSquare;
      color = '#8b5cf6';
      break;
    default:
      if (action.includes('task')) {
        desc = `Updated task: ${action.replace('task_', '')}`;
        Icon = Code;
        color = '#8b5cf6';
      }
  }
  return { desc, Icon, color };
};

export default function AdminActivityMonitoring() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = async (currentOffset = 0, append = false) => {
    try {
      const limit = 10;
      const r = await adminAPI.getActivities({ search, type, limit, offset: currentOffset });
      
      if (r.data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (append) {
        setActivities(prev => [...prev, ...r.data]);
      } else {
        setActivities(r.data);
      }
    } catch (err) {
      toast.error('Failed to load system activity logs');
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    setIsLoading(true);
    fetchActivities(0, false);
  }, [search, type]);

  const handleLoadMore = () => {
    setIsMoreLoading(true);
    const nextOffset = offset + 10;
    setOffset(nextOffset);
    fetchActivities(nextOffset, true);
  };

  // Helper to format time relative
  const formatTime = (timeStr) => {
    if (!timeStr) return 'Just now';
    const date = new Date(timeStr);
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Activity Monitoring</h1>
          <p style={{ color: '#888', margin: 0 }}>Real-time stream of all platform activities, interactions, and events.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 16px 10px 40px', backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', outline: 'none', width: '250px', fontSize: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '8px' }}>
            <Filter size={16} color="#888" />
            <select 
              value={type}
              onChange={e => setType(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer', padding: '10px 0' }}
            >
              <option value="all" style={{ backgroundColor: '#121212' }}>All Activities</option>
              <option value="login" style={{ backgroundColor: '#121212' }}>Logins</option>
              <option value="team_created" style={{ backgroundColor: '#121212' }}>Team Creations</option>
              <option value="team_joined" style={{ backgroundColor: '#121212' }}>Team Joins</option>
              <option value="task_created" style={{ backgroundColor: '#121212' }}>Task Creations</option>
              <option value="task_completed" style={{ backgroundColor: '#121212' }}>Task Completions</option>
              <option value="admin_notify" style={{ backgroundColor: '#121212' }}>Announcements</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: '#888', padding: '40px', textAlign: 'center' }}>Connecting to live activity logs...</div>
      ) : (
        <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
          {activities.map((act, index) => {
            const { desc, Icon, color } = getActionMeta(act.action, act.meta);
            return (
              <div key={act.id} style={{ display: 'flex', gap: '20px', padding: '20px 24px', borderBottom: index < activities.length - 1 ? '1px solid #1a1a1a' : 'none', transition: 'background-color 0.2s' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: '500', fontSize: '15px' }}>
                      {act.user} <span style={{ color: '#888', fontWeight: '400' }}>({act.team})</span>
                    </span>
                    <span style={{ color: '#555', fontSize: '12px' }}>{formatTime(act.time)}</span>
                  </div>
                  <div style={{ color: '#ccc', fontSize: '14px' }}>{desc}</div>
                </div>
              </div>
            );
          })}
          {activities.length === 0 && (
            <div style={{ padding: '48px', color: '#555', textAlign: 'center' }}>No activities recorded in the system logs.</div>
          )}
          {hasMore && activities.length > 0 && (
            <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#0a0a0a', borderTop: '1px solid #1a1a1a' }}>
              <button 
                onClick={handleLoadMore}
                disabled={isMoreLoading}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '14px', fontWeight: '500', cursor: isMoreLoading ? 'not-allowed' : 'pointer' }}
              >
                {isMoreLoading ? 'Loading Older Logs...' : 'Load Older Logs'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
