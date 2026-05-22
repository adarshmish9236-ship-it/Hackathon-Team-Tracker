// src/pages/AdminLoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../api/axios';
import { useStore } from '../store/useStore';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      
      // Verify admin role
      if (res.data.user.role !== 'admin') {
        toast.error('Access Denied: Insufficient Clearance');
        setIsLoading(false);
        return;
      }

      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('ss_token', res.data.token);
      toast.success('Admin authorization confirmed. Welcome.');
      navigate('/app/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authorization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      color: '#e5e5e5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#121212',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <Shield size={32} color="#ef4444" />
          </div>
        </div>
        
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: '24px', 
          fontWeight: '600', 
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em'
        }}>
          System Administration
        </h1>
        <p style={{ 
          textAlign: 'center', 
          color: '#888', 
          fontSize: '14px', 
          marginBottom: '32px' 
        }}>
          Restricted Access. Authenticate to proceed.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '8px' }}>
              Admin Identifier
            </label>
            <div style={{ position: 'relative' }}>
              <Activity size={18} color="#555" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@syncsphere.com"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  backgroundColor: '#050505',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '8px' }}>
              Security Key
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#555" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  backgroundColor: '#050505',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              marginTop: '12px',
              padding: '14px',
              backgroundColor: isLoading ? '#555' : '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? 'Authenticating...' : 'Authorize Session'}
            {!isLoading && <ChevronRight size={18} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
