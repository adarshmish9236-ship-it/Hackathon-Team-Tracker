// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminDashboardPage from './pages/AdminDashboardPage';
import AppLayout        from './components/layout/AppLayout';

const PrivateRoute = ({ children }) => {
  const { token } = useStore();
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { theme, token, setUser, setToken } = useStore();

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
  }, []);

  return (
    <BrowserRouter>
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
          <Route path="admin"                      element={<AdminDashboardPage />} />
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

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
