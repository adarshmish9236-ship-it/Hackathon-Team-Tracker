// src/components/layout/AdminLayout.jsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { 
  LayoutDashboard, Users, ShieldAlert, Settings, LogOut, 
  Server, Flag, CheckSquare, Activity, Upload, Bell, Shield 
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUser } = useStore();

  const handleLogout = () => {
    localStorage.removeItem('ss_token');
    setToken(null);
    setUser(null);
    navigate('/admin-secret-login');
  };

  const navItems = [
    { name: 'Overview', path: '/app/admin', icon: LayoutDashboard },
    { name: 'Team Management', path: '/app/admin/teams', icon: Server },
    { name: 'Participants', path: '/app/admin/participants', icon: Users },
    { name: 'Hackathons', path: '/app/admin/hackathons', icon: Flag },
    { name: 'Task Tracking', path: '/app/admin/tasks', icon: CheckSquare },
    { name: 'Activity Monitor', path: '/app/admin/activity', icon: Activity },
    { name: 'Submissions', path: '/app/admin/submissions', icon: Upload },
    { name: 'Announcements', path: '/app/admin/announcements', icon: Bell },
    { name: 'Moderation', path: '/app/admin/moderation', icon: ShieldAlert },
    { name: 'Settings', path: '/app/admin/settings', icon: Settings },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#050505',
      color: '#e5e5e5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        backgroundColor: '#121212',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0
      }}>
        <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '8px', 
            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
            Command Center
          </span>
        </div>

        <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
          <div style={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 16px', marginBottom: '12px', fontWeight: '600' }}>
            Management Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            // Strict exact match for overview, prefix match for others so child routes keep nav active if we add them later
            const isActive = item.path === '/app/admin' 
              ? location.pathname === '/app/admin' || location.pathname === '/app/admin/'
              : location.pathname.startsWith(item.path);

            return (
              <div 
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: isActive ? '#3b82f6' : '#888',
                  transition: 'all 0.2s',
                  marginBottom: '4px'
                }}
              >
                <Icon size={18} />
                <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500' }}>
                  {item.name}
                </span>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '24px 24px 0 24px', marginTop: 'auto', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => navigate('/app')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: '8px',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'; }}
          >
            <LayoutDashboard size={16} />
            Return to User Dashboard
          </button>

          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#888',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
          >
            <LogOut size={16} />
            Terminate Session
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
