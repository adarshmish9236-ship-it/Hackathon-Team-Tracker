// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, LogIn } from 'lucide-react';
import { authAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authAPI.login(form);
      setToken(r.data.token);
      setUser(r.data.user);
      toast.success(`Welcome back, ${r.data.user.full_name}! 🚀`);
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  // Demo quick-fill
  const fillDemo = () => setForm({ email: 'alice@syncsphere.io', password: 'password123' });

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding:24 }}>
      {/* Glowing background blobs */}
      <div style={{ position:'fixed',top:'20%',left:'20%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(79,142,247,0.12),transparent)',filter:'blur(60px)',pointerEvents:'none' }}/>
      <div style={{ position:'fixed',bottom:'20%',right:'20%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(168,85,247,0.12),transparent)',filter:'blur(60px)',pointerEvents:'none' }}/>

      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5 }}
        className="glass-card" style={{ width:'100%', maxWidth:420, padding:40 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#4f8ef7,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',boxShadow:'0 0 30px rgba(79,142,247,0.5)' }}>
            <Zap size={28} color="white"/>
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:24,marginBottom:4 }} className="gradient-text">Welcome Back</h1>
          <p style={{ color:'var(--text-muted)',fontSize:14 }}>Sign in to your SyncSphere workspace</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div>
            <label style={{ fontSize:13,fontWeight:500,color:'var(--text-secondary)',display:'block',marginBottom:6 }}>Email</label>
            <div style={{ position:'relative' }}>
              <Mail size={16} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }}/>
              <input className="input" style={{ paddingLeft:38 }} type="email" placeholder="you@team.io"
                value={form.email} onChange={e => setForm({...form,email:e.target.value})} required/>
            </div>
          </div>
          <div>
            <label style={{ fontSize:13,fontWeight:500,color:'var(--text-secondary)',display:'block',marginBottom:6 }}>Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }}/>
              <input className="input" style={{ paddingLeft:38 }} type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({...form,password:e.target.value})} required/>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width:'100%',padding:'12px',fontSize:15,justifyContent:'center',marginTop:8 }} disabled={loading}>
            {loading ? '🔐 Signing in...' : <><LogIn size={16}/> Sign In</>}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:16 }}>
          <button onClick={fillDemo} style={{ background:'none',border:'1px dashed rgba(79,142,247,0.4)',color:'var(--accent-blue)',cursor:'pointer',padding:'8px 16px',borderRadius:8,fontSize:13,marginBottom:16 }}>
            🎮 Fill Demo Credentials
          </button>
        </div>

        <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:14, marginTop:8 }}>
          New to SyncSphere?{' '}
          <Link to="/register" style={{ color:'var(--accent-blue)',textDecoration:'none',fontWeight:600 }}>Create account →</Link>
        </p>
      </motion.div>
    </div>
  );
}
