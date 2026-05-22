// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { authAPI } from './api/axios';

import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import TeamPage         from './pages/TeamPage';
import KanbanPage       from './pages/KanbanPage';
import ChatPage         from './pages/ChatPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import AIInsightsPage   from './pages/AIInsightsPage';
import WarRoomPage      from './pages/WarRoomPage';
import ProfilePage      from './pages/ProfilePage';
import HackathonModePage from './pages/HackathonModePage';
import WorkspacePage    from './pages/WorkspacePage';
import CreateTeamPage   from './pages/CreateTeamPage';
import AdminLoginPage   from './pages/AdminLoginPage';
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview';
import AdminTeamManagement from './pages/admin/AdminTeamManagement';
import AdminParticipantManagement from './pages/admin/AdminParticipantManagement';
import AdminHackathonManagement from './pages/admin/AdminHackathonManagement';
import AdminTaskTracking from './pages/admin/AdminTaskTracking';
import AdminActivityMonitoring from './pages/admin/AdminActivityMonitoring';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminModeration from './pages/admin/AdminModeration';
import AdminSettings from './pages/admin/AdminSettings';
import AppLayout        from './components/layout/AppLayout';
import AdminLayout      from './components/layout/AdminLayout';

const PrivateRoute = ({ children }) => {
  const { token, user } = useStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', background: 'var(--space-void)' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Loading mission control…</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Authenticating your session and preparing the admin dashboard.</div>
        </div>
      </div>
    );
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', background: 'var(--space-void)' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Loading mission control…</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Authenticating your session and preparing the admin dashboard.</div>
        </div>
      </div>
    );
  }
  if (user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }
  return children;
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const { theme, token, user, setUser, setToken } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      authAPI.me().then(r => setUser(r.data.user)).catch(() => {
        localStorage.removeItem('ss_token');
        setToken(null);
      });
    }
  }, [token, setToken, setUser]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-glass)',
            backdropFilter: 'blur(20px)',
            borderRadius: 12,
            fontSize: 14,
          },
          duration: 3000,
        }}
      />
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index                              element={<DashboardPage />} />
          <Route path="profile"                    element={<ProfilePage />} />
          <Route path="create-team"                element={<CreateTeamPage />} />
          <Route path="teams/:id"                  element={<TeamPage />} />
          <Route path="teams/:id/kanban"           element={<KanbanPage />} />
          <Route path="teams/:id/chat"             element={<ChatPage />} />
          <Route path="teams/:id/analytics"        element={<AnalyticsPage />} />
          <Route path="teams/:id/insights"         element={<AIInsightsPage />} />
          <Route path="teams/:id/warroom"          element={<WarRoomPage />} />
          <Route path="teams/:id/hackathon"        element={<HackathonModePage />} />
          <Route path="teams/:id/workspace"        element={<WorkspacePage />} />
        </Route>

        <Route path="/admin-secret-login" element={<AdminLoginPage />} />
        <Route path="/app/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboardOverview />} />
          <Route path="teams" element={<AdminTeamManagement />} />
          <Route path="participants" element={<AdminParticipantManagement />} />
          <Route path="hackathons" element={<AdminHackathonManagement />} />
          <Route path="tasks" element={<AdminTaskTracking />} />
          <Route path="activity" element={<AdminActivityMonitoring />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
