// src/pages/TeamPage.jsx — Team overview workspace
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { teamAPI, analyticsAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import { Kanban, MessageCircle, BarChart3, TrendingUp, Swords, Copy, Check, Users, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const { id: teamId } = useParams();
  const navigate        = useNavigate();
  const { setCurrentTeam } = useStore();
  const [team, setTeam]     = useState(null);
  const [members, setMembers] = useState([]);
  const [analytics, setAna] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInvite] = useState(false);

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const loadTeam = () => {
    teamAPI.getTeam(teamId).then(r => {
      setTeam(r.data.team);
      setMembers(r.data.members);
      setAna(r.data.analytics);
      setCurrentTeam(r.data.team);
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(team?.invite_code);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const quickLinks = [
    { icon:Kanban,       label:'Kanban Board',  sub:'Manage tasks',     color:'#4f8ef7', path:`/app/teams/${teamId}/kanban` },
    { icon:MessageCircle,label:'Team Chat',     sub:'Real-time chat',   color:'#a855f7', path:`/app/teams/${teamId}/chat` },
    { icon:BarChart3,    label:'Analytics',     sub:'Charts & insights', color:'#06b6d4', path:`/app/teams/${teamId}/analytics` },
    { icon:TrendingUp,   label:'Insights',      sub:'Sprint and team insights', color:'#10b981', path:`/app/teams/${teamId}/insights` },
    { icon:Swords,       label:'War Room',      sub:'Live dashboard',    color:'#f59e0b', path:`/app/teams/${teamId}/warroom` },
    { icon:Users,        label:'Workspace',     sub:'Shared documents',  color:'#ec4899', path:`/app/teams/${teamId}/workspace` },
  ];

  const updateRole = async (userId, role) => {
    try {
      await teamAPI.setRole(teamId, userId, role);
      toast.success('Role updated');
      loadTeam();
    } catch { toast.error('Failed to update role'); }
  };

  const fmtMins = (m) => {
    if (!m) return '0 hrs';
    const h = Math.floor(m/60);
    const mins = m%60;
    return `${h}h ${mins}m`;
  };

  const ROLE_COLORS = { lead:'#FFD700',frontend:'#4f8ef7',backend:'#a855f7',designer:'#ec4899',presenter:'#10b981',debugger:'#f59e0b',fullstack:'#06b6d4',member:'#8892b0' };

  if (!team) return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height:80 }}/>)}
    </div>
  );

  const pct = analytics?.tasks_total > 0 ? Math.round((analytics?.tasks_done/analytics?.tasks_total)*100) : 0;

  return (
    <div>
      {/* Back Button */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => navigate('/app')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 8,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--indigo-light)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {/* Team Header */}
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
        className="glass-card" style={{ padding:28,marginBottom:24,background:'linear-gradient(135deg,rgba(79,142,247,0.08),rgba(168,85,247,0.08))' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16 }}>
          <div>
            <h1 style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'2rem',fontWeight:800,marginBottom:4 }}>{team.name}</h1>
            {team.hackathon_name && <div style={{ color:'var(--accent-cyan)',fontSize:14,marginBottom:8 }}>🏆 {team.hackathon_name}</div>}
            <p style={{ color:'var(--text-secondary)',fontSize:14,maxWidth:500 }}>{team.description || 'Building something great together.'}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:4 }}>Invite Code</div>
            <button onClick={copyCode} style={{
              background:'var(--bg-glass)',border:'1px solid var(--border-glass)',color:'var(--text-primary)',
              cursor:'pointer',padding:'8px 16px',borderRadius:10,fontFamily:'monospace',fontSize:16,
              letterSpacing:3,display:'flex',alignItems:'center',gap:8,
            }}>
              {team.invite_code}
              {copied ? <Check size={14} color="var(--accent-green)"/> : <Copy size={14}/>}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop:20 }}>
          <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8 }}>
            <span style={{ color:'var(--text-secondary)' }}>Project Progress</span>
            <span style={{ fontWeight:700,color:'var(--accent-blue)' }}>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ height:8 }}>
            <motion.div className="progress-fill" initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1.2,ease:'easeOut' }} style={{ height:'100%',borderRadius:99 }}/>
          </div>
          <div style={{ display:'flex',gap:20,marginTop:12,fontSize:13,color:'var(--text-muted)',flexWrap:'wrap' }}>
            <span>✅ {analytics?.tasks_done || 0} done</span>
            <span>📋 {analytics?.tasks_total || 0} total</span>
            <span>👥 {members.length} members</span>
            <span>💪 Health: {team.health_score}%</span>
            <span>⏱️ Active Time: {fmtMins(analytics?.total_active_mins)}</span>
            {team.deadline && <span>⏰ {new Date(team.deadline).toLocaleDateString()}</span>}
          </div>
        </div>
      </motion.div>

      {/* Quick Action Cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:28 }}>
        {quickLinks.map((l,i) => (
          <motion.div key={l.label} className="glass-card" style={{ padding:20,cursor:'pointer' }}
            initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.08 }}
            onClick={() => navigate(l.path)}
            whileHover={{ scale:1.03,boxShadow:`0 8px 24px ${l.color}30` }}>
            <div style={{ width:44,height:44,borderRadius:12,background:`${l.color}18`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12 }}>
              <l.icon size={22} color={l.color}/>
            </div>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:4 }}>{l.label}</div>
            <div style={{ fontSize:12,color:'var(--text-muted)' }}>{l.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Team Members */}
      <div className="glass-card" style={{ padding:24 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <Users size={18} color="var(--accent-blue)"/>
            <h2 style={{ fontWeight:700,fontSize:16 }}>Team Members & Roles ({members.length})</h2>
          </div>
          <button className="btn-primary" style={{ padding:'6px 14px',fontSize:12 }} onClick={() => setShowInvite(true)}>
            + Add Member
          </button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16 }}>
          {members.map((m,i) => (
            <motion.div key={m.id} initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.06 }}
              style={{ padding:16,background:'var(--bg-glass)',borderRadius:12,border:'1px solid var(--border-glass)',display:'flex',alignItems:'center',gap:12 }}>
              <div style={{ position:'relative',flexShrink:0 }}>
                <div style={{ width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${ROLE_COLORS[m.role_tag]||'#4f8ef7'},var(--accent-purple))`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'white' }}>
                  {m.full_name[0]}
                </div>
                <div style={{ position:'absolute',bottom:0,right:0,width:12,height:12,borderRadius:'50%',background:m.is_online?'var(--accent-green)':'var(--text-muted)',border:'2px solid var(--bg-secondary)',boxShadow:m.is_online?'0 0 6px var(--accent-green)':'none' }}/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <span style={{ fontWeight:700,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{m.full_name}</span>
                  {m.role_tag === 'lead' && <Crown size={14} color="#FFD700" title="Team Leader"/>}
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:4 }}>
                  <select value={m.role_tag} onChange={e=>updateRole(m.id, e.target.value)}
                    style={{ background:'rgba(255,255,255,0.05)',border:'1px solid var(--border-glass)',color:ROLE_COLORS[m.role_tag]||'var(--text-muted)',borderRadius:6,padding:'2px 6px',fontSize:11,outline:'none',cursor:'pointer',fontWeight:600 }}>
                    <option value="lead">Leader</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="designer">Designer</option>
                    <option value="presenter">Presenter</option>
                    <option value="debugger">Debugger</option>
                    <option value="fullstack">Fullstack</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                <div style={{ fontSize:11,color:'var(--text-muted)',marginTop:6 }}>Score: {m.contribution_score || 0}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500 }}
          onClick={(e)=>e.target===e.currentTarget&&setShowInvite(false)}>
          <motion.div initial={{ scale:0.9,opacity:0 }} animate={{ scale:1,opacity:1 }}
            className="glass-card" style={{ padding:32,width:'100%',maxWidth:420,textAlign:'center' }}>
            <h2 style={{ fontWeight:800,fontSize:22,marginBottom:12 }}>Add Team Members</h2>
            <p style={{ color:'var(--text-secondary)',fontSize:14,marginBottom:24 }}>
              Share this invite code with your hackathon teammates. They can enter it on their dashboard to join automatically.
            </p>
            <div style={{ background:'rgba(255,255,255,0.05)',padding:20,borderRadius:12,border:'1px dashed rgba(79,142,247,0.4)',marginBottom:24 }}>
              <div style={{ fontFamily:'monospace',fontSize:32,fontWeight:800,letterSpacing:6,color:'var(--accent-blue)',marginBottom:10 }}>{team.invite_code}</div>
              <button onClick={copyCode} className="btn-primary" style={{ margin:'0 auto' }}>
                <Copy size={14} style={{ marginRight:6 }}/> {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <button className="btn-ghost" onClick={()=>setShowInvite(false)} style={{ width:'100%' }}>Close</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
