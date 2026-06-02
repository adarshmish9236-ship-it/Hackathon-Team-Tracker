// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import syncsphereLogo from '../assets/syncsphere-logo.png';

export default function RegisterPage() {
  const [form, setForm] = useState({ username:'', email:'', password:'', full_name:'' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setUser, setToken } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const r = await authAPI.register(form);
      setToken(r.data.token);
      setUser(r.data.user);
      toast.success(`Welcome to SyncSphere, ${r.data.user.full_name}! 🎉`);
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const fields = [
    { key:'full_name', label:'Full Name', icon:User, type:'text', placeholder:'Alice Johnson' },
    { key:'username',  label:'Username',  icon:User, type:'text', placeholder:'alice_dev' },
    { key:'email',     label:'Email',     icon:Mail, type:'email', placeholder:'alice@team.io' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--space-void)' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: '40%', flexShrink: 0, background: 'var(--space-void)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', position: 'relative', overflow: 'hidden',
        borderRight: '1px solid rgba(99,102,241,0.1)',
      }}
        className="hide-mobile"
      >
        {/* Ambient orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '-10%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '60%', left: '20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
          {/* Logo */}
          <img
            src={syncsphereLogo}
            alt="SyncSphere Logo"
            style={{
              width: 90, height: 90,
              objectFit: 'contain',
              margin: '0 auto 24px',
              display: 'block',
              filter: 'drop-shadow(0 0 24px rgba(6,182,212,0.55)) drop-shadow(0 0 8px rgba(99,102,241,0.4))',
            }}
          />

          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 48, lineHeight: 1, marginBottom: 14 }} className="gradient-text">
            SyncSphere
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Join the elite hackathon command center
          </p>

          {/* Feature pills */}
          {[
            { emoji: '⚡', label: 'Real-time sync across all devices' },
            { emoji: '🛡', label: 'Enterprise-grade security' },
            { emoji: '🚀', label: '50ms average latency' },
          ].map((pill) => (
            <div key={pill.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px', borderRadius: 12, marginBottom: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.15)',
              backdropFilter: 'blur(12px)',
              textAlign: 'left',
            }}>
              <span style={{ fontSize: 20 }}>{pill.emoji}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{pill.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="bg-dot-grid" style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', background: 'var(--space-deep)', position: 'relative',
        overflowY: 'auto'
      }}>
        {/* Subtle orb */}
        <div style={{ position: 'absolute', top: '30%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="card-mission" style={{ width: '100%', maxWidth: 440, padding: '40px 48px', position: 'relative', zIndex: 1, margin: 'auto' }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}
            className="show-mobile">
            <img
              src={syncsphereLogo}
              alt="SyncSphere Logo"
              style={{
                width: 32, height: 32,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.5))',
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18 }} className="gradient-text">SyncSphere</span>
          </div>

          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 28, marginBottom: 6 }}>
            Create Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            Get your team up and running in seconds
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <f.icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id={`register-${f.key}`}
                    className="input"
                    style={{ paddingLeft: 42 }}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required
                  />
                </div>
              </div>
            ))}

            {/* Password Field (with eye toggle) */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="register-password"
                  className="input"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 15, justifyContent: 'center', marginTop: 12, borderRadius: 'var(--r-md)' }}
              disabled={loading}
            >
              {loading
                ? <><span className="spin-slow" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', marginRight: 8 }} />Creating Account...</>
                : <><UserPlus size={16} style={{ marginRight: 8 }} />Create Account</>
              }
            </button>
          </form>

          {/* Login link */}
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--indigo-light)', textDecoration: 'none', fontWeight: 700 }}>Sign In →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
