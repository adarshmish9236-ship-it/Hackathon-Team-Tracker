// src/pages/ProfilePage.jsx — User profile with XP, achievements, heatmap
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { authAPI, analyticsAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import { Zap, Award, TrendingUp, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const SKILL_OPTIONS = ['React','Node.js','Python','MySQL','MongoDB','Docker','Figma','TypeScript','Go','Machine Learning','DevOps','UI/UX'];

export default function ProfilePage() {
  const { user, setUser, currentTeam } = useStore();
  const [form, setForm] = useState({ full_name:'', bio:'', skills:[], theme_pref:'dark' });
  const [heatmap, setHeatmap] = useState([]);
  const [badges, setBadges]   = useState([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name||'', bio: user.bio||'', skills: user.skills||[], theme_pref: user.theme_pref||'dark' });
    }
    authAPI.me().then(r => {
      setBadges(r.data.badges || []);
      setUser(r.data.user);
    });
    if (currentTeam) {
      analyticsAPI.userActivity(currentTeam.id, user?.id).then(r => setHeatmap(r.data.heatmap || []));
    }
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.update(form);
      const r = await authAPI.me();
      setUser(r.data.user);
      toast.success('Profile updated! ✅');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const toggleSkill = (s) => {
    const skills = form.skills.includes(s) ? form.skills.filter(x=>x!==s) : [...form.skills, s];
    setForm({ ...form, skills });
  };

  // Generate 90-day heatmap grid
  const today = new Date();
  const days = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (89 - i));
    const key = d.toISOString().slice(0, 10);
    const found = heatmap.find(h => h.day === key);
    return { date: key, count: found?.count || 0 };
  });

  const getHeatColor = (count) => {
    if (count === 0) return 'rgba(79,142,247,0.07)';
    if (count < 3)  return 'rgba(79,142,247,0.3)';
    if (count < 6)  return 'rgba(79,142,247,0.55)';
    if (count < 10) return 'rgba(79,142,247,0.8)';
    return '#4f8ef7';
  };

  return (
    <div>
      <h1 style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.5rem',fontWeight:700,marginBottom:24 }}>👤 My Profile</h1>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:24 }}>
        {/* Left: Profile Card */}
        <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
          <motion.div className="glass-card" initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} style={{ padding:28,textAlign:'center' }}>
            <div style={{ width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,color:'white',margin:'0 auto 16px',boxShadow:'0 0 30px rgba(79,142,247,0.4)' }}>
              {user?.full_name?.[0] || '?'}
            </div>
            <h2 style={{ fontWeight:700,fontSize:20,marginBottom:4 }}>{user?.full_name}</h2>
            <p style={{ color:'var(--text-muted)',fontSize:13,marginBottom:12 }}>@{user?.username}</p>
            <div style={{ display:'flex',justifyContent:'center',gap:20 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.5rem',fontWeight:800,color:'var(--accent-yellow)' }}>⚡{user?.xp_points||0}</div>
                <div style={{ fontSize:12,color:'var(--text-muted)' }}>XP Points</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.5rem',fontWeight:800,color:'var(--accent-orange)' }}>🔥{user?.streak_days||0}</div>
                <div style={{ fontSize:12,color:'var(--text-muted)' }}>Day Streak</div>
              </div>
            </div>
          </motion.div>

          {/* Badges */}
          <div className="glass-card" style={{ padding:20 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
              <Award size={16} color="var(--accent-yellow)"/>
              <h3 style={{ fontWeight:700,fontSize:14 }}>Achievements</h3>
            </div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
              {badges.map(b => (
                <div key={b.id} title={b.description}
                  style={{ padding:'6px 12px',borderRadius:99,background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.25)',fontSize:13,cursor:'default' }}>
                  {b.badge_icon} {b.badge_name}
                </div>
              ))}
              {badges.length === 0 && <p style={{ fontSize:12,color:'var(--text-muted)' }}>Complete tasks to earn badges!</p>}
            </div>
          </div>
        </div>

        {/* Right: Edit + Heatmap */}
        <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
          <motion.div className="glass-card" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} style={{ padding:24 }}>
            <h3 style={{ fontWeight:700,fontSize:15,marginBottom:20 }}>Edit Profile</h3>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div>
                <label style={{ fontSize:13,color:'var(--text-secondary)',display:'block',marginBottom:6 }}>Full Name</label>
                <input className="input" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/>
              </div>
              <div>
                <label style={{ fontSize:13,color:'var(--text-secondary)',display:'block',marginBottom:6 }}>Bio</label>
                <textarea className="input" rows={3} style={{ resize:'none' }} placeholder="Tell your team about yourself..."
                  value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/>
              </div>
              <div>
                <label style={{ fontSize:13,color:'var(--text-secondary)',display:'block',marginBottom:10 }}>Skills</label>
                <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                  {SKILL_OPTIONS.map(s => (
                    <button key={s} onClick={() => toggleSkill(s)}
                      style={{ padding:'5px 12px',borderRadius:99,border:'1px solid var(--border-glass)',background:form.skills.includes(s)?'rgba(79,142,247,0.2)':'transparent',color:form.skills.includes(s)?'var(--accent-blue)':'var(--text-muted)',cursor:'pointer',fontSize:12,transition:'all 0.15s',borderColor:form.skills.includes(s)?'rgba(79,142,247,0.5)':'var(--border-glass)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:13,color:'var(--text-secondary)',display:'block',marginBottom:6 }}>Theme</label>
                <div style={{ display:'flex',gap:8 }}>
                  {['dark','light'].map(t => (
                    <button key={t} onClick={() => setForm({...form,theme_pref:t})}
                      style={{ flex:1,padding:'8px',borderRadius:8,border:'1px solid var(--border-glass)',background:form.theme_pref===t?'rgba(79,142,247,0.2)':'transparent',color:form.theme_pref===t?'var(--accent-blue)':'var(--text-muted)',cursor:'pointer',fontWeight:600,fontSize:13 }}>
                      {t==='dark'?'🌙 Dark':'☀️ Light'}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn-primary" style={{ justifyContent:'center',padding:'10px' }} onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving...' : <><Save size={14}/> Save Changes</>}
              </button>
            </div>
          </motion.div>

          {/* Activity Heatmap */}
          <div className="glass-card" style={{ padding:24 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
              <TrendingUp size={16} color="var(--accent-green)"/>
              <h3 style={{ fontWeight:700,fontSize:14 }}>Activity Heatmap (90 days)</h3>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(13,1fr)',gap:3 }}>
              {days.map((d,i) => (
                <div key={i} className="heatmap-cell"
                  title={`${d.date}: ${d.count} actions`}
                  style={{ background: getHeatColor(d.count), border:'1px solid rgba(255,255,255,0.04)' }}/>
              ))}
            </div>
            <div style={{ display:'flex',justifyContent:'flex-end',alignItems:'center',gap:6,marginTop:10,fontSize:11,color:'var(--text-muted)' }}>
              <span>Less</span>
              {[0,2,5,8,12].map(n => (
                <div key={n} className="heatmap-cell" style={{ background:getHeatColor(n) }}/>
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
