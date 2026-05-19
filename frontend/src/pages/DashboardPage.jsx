// src/pages/DashboardPage.jsx — Main dashboard with stats cards
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { teamAPI } from '../api/axios';
import { Plus, Users, CheckSquare, Zap, TrendingUp, ArrowRight, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, myTeams, setMyTeams, setCurrentTeam } = useStore();
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    teamAPI.getMyTeams().then(r => setMyTeams(r.data)).catch(() => {});
  }, []);

  const joinTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await teamAPI.join(inviteCode.trim().toUpperCase());
      const updated = await teamAPI.getMyTeams();
      setMyTeams(updated.data);
      setCurrentTeam(r.data.team);
      toast.success(`Joined ${r.data.team.name}! 🚀`);
      setShowJoin(false);
      navigate(`/app/teams/${r.data.team.id}`);
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid code'); }
    finally { setLoading(false); }
  };

  const greetTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <motion.h1 initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }}
          style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'1.8rem', fontWeight:700, marginBottom:6 }}>
          {greetTime()}, <span className="gradient-text">{user?.full_name?.split(' ')[0]} 👋</span>
        </motion.h1>
        <p style={{ color:'var(--text-secondary)', fontSize:15 }}>
          You have <strong style={{ color:'var(--accent-blue)' }}>{myTeams.length}</strong> active teams. Let's build something incredible.
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:32 }}>
        {[
          { icon:Users,      label:'My Teams',       value: myTeams.length,    color:'#4f8ef7' },
          { icon:CheckSquare, label:'XP Points',     value: `${user?.xp_points||0}⚡`, color:'#f59e0b' },
          { icon:TrendingUp, label:'Streak',          value: `${user?.streak_days||0} days🔥`, color:'#10b981' },
          { icon:Zap,        label:'Achievements',    value: '—',               color:'#a855f7' },
        ].map((s,i) => (
          <motion.div key={s.label} className="glass-card" style={{ padding:20 }}
            initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.08 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
              <div style={{ width:36,height:36,borderRadius:10,background:`${s.color}18`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <s.icon size={18} color={s.color}/>
              </div>
              <span style={{ fontSize:13,color:'var(--text-secondary)' }}>{s.label}</span>
            </div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.5rem',fontWeight:700,color:s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Teams Grid */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontWeight:700, fontSize:18 }}>Your Teams</h2>
        <div style={{ display:'flex',gap:10 }}>
          <button className="btn-ghost" style={{ padding:'8px 16px',fontSize:13 }} onClick={() => setShowJoin(true)}>Join Team</button>
          <button className="btn-primary" style={{ padding:'8px 16px',fontSize:13 }} onClick={() => navigate('/app/create-team')}><Plus size={14}/> New Team</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
        {myTeams.map((team,i) => {
          const pct = team.tasks_total > 0 ? Math.round((team.tasks_done/team.tasks_total)*100) : 0;
          return (
            <motion.div key={team.id} className="glass-card" style={{ padding:24, cursor:'pointer' }}
              initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.1 }}
              onClick={() => { setCurrentTeam(team); navigate(`/app/teams/${team.id}`); }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16 }}>
                <div>
                  <h3 style={{ fontWeight:700,fontSize:16,marginBottom:4 }}>{team.name}</h3>
                  {team.hackathon_name && <span style={{ fontSize:12,color:'var(--accent-cyan)' }}>🏆 {team.hackathon_name}</span>}
                </div>
                <span className={`badge badge-${team.status==='active'?'green':team.status==='completed'?'blue':'yellow'}`}>{team.status}</span>
              </div>
              <p style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:16,lineHeight:1.5 }}>
                {team.description || 'No description yet'}
              </p>
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-muted)',marginBottom:6 }}>
                  <span>Progress</span><span>{pct}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width:`${pct}%` }}/></div>
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div style={{ fontSize:12,color:'var(--text-muted)',display:'flex',gap:12 }}>
                  <span>👥 {team.member_count}</span>
                  <span>✅ {team.tasks_done}/{team.tasks_total}</span>
                </div>
                <ArrowRight size={16} color="var(--accent-blue)"/>
              </div>
              {team.deadline && (
                <div style={{ marginTop:12,fontSize:12,color:'var(--accent-yellow)',display:'flex',alignItems:'center',gap:4 }}>
                  <Clock size={12}/> Deadline: {new Date(team.deadline).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Empty state */}
        {myTeams.length === 0 && (
          <div style={{ gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--text-muted)' }}>
            <div style={{ fontSize:48,marginBottom:16 }}>🚀</div>
            <p style={{ fontSize:16,marginBottom:16 }}>No teams yet. Create or join one to get started!</p>
            <div style={{ display:'flex',gap:12,justifyContent:'center' }}>
              <button className="btn-primary" onClick={() => navigate('/app/create-team')}><Plus size={14}/> Register Team</button>
              <button className="btn-ghost" onClick={() => setShowJoin(true)}>Join with Code</button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal removed — full-page 3-step form at /app/create-team */}

      {/* Join Modal */}
      {showJoin && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:24 }}
          onClick={e => e.target===e.currentTarget&&setShowJoin(false)}>
          <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }}
            className="glass-card" style={{ width:'100%',maxWidth:400,padding:32 }}>
            <h2 style={{ fontWeight:700,fontSize:20,marginBottom:8 }}>🔑 Join a Team</h2>
            <p style={{ color:'var(--text-secondary)',fontSize:13,marginBottom:24 }}>Enter the invite code shared by your team lead.</p>
            <form onSubmit={joinTeam} style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <input className="input" placeholder="e.g. NEBULA01" value={inviteCode}
                onChange={e=>setInviteCode(e.target.value)} style={{ textTransform:'uppercase',fontSize:18,fontFamily:'monospace',textAlign:'center',letterSpacing:4 }} required/>
              <div style={{ display:'flex',gap:10 }}>
                <button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex:1,justifyContent:'center' }} disabled={loading}>
                  {loading?'Joining...':'Join Team'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
