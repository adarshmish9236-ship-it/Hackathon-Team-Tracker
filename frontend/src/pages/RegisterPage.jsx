// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, User, UserPlus } from 'lucide-react';
import { authAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ username:'',email:'',password:'',full_name:'' });
  const [loading, setLoading] = useState(false);
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
    { key:'email',     label:'Email',     icon:Mail, type:'email',placeholder:'alice@team.io' },
    { key:'password',  label:'Password',  icon:Lock, type:'password', placeholder:'••••••••' },
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding:24 }}>
      <div style={{ position:'fixed',top:'10%',right:'15%',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(168,85,247,0.1),transparent)',filter:'blur(60px)',pointerEvents:'none' }}/>
      <div style={{ position:'fixed',bottom:'10%',left:'10%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,0.1),transparent)',filter:'blur(60px)',pointerEvents:'none' }}/>

      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5 }}
        className="glass-card" style={{ width:'100%', maxWidth:440, padding:40 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#a855f7,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',boxShadow:'0 0 30px rgba(168,85,247,0.5)' }}>
            <Zap size={28} color="white"/>
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:24,marginBottom:4 }} className="gradient-text">Join SyncSphere</h1>
          <p style={{ color:'var(--text-muted)',fontSize:14 }}>Create your hackathon command center</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize:13,fontWeight:500,color:'var(--text-secondary)',display:'block',marginBottom:6 }}>{f.label}</label>
              <div style={{ position:'relative' }}>
                <f.icon size={16} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }}/>
                <input className="input" style={{ paddingLeft:38 }} type={f.type} placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} required/>
              </div>
            </div>
          ))}
          <button type="submit" className="btn-primary" style={{ width:'100%',padding:'12px',fontSize:15,justifyContent:'center',marginTop:8 }} disabled={loading}>
            {loading ? '✨ Creating...' : <><UserPlus size={16}/> Create Account</>}
          </button>
        </form>

        <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:14, marginTop:20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--accent-blue)',textDecoration:'none',fontWeight:600 }}>Sign in →</Link>
        </p>
      </motion.div>
    </div>
  );
}
