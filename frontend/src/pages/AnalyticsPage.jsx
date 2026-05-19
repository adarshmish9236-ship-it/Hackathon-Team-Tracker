// src/pages/AnalyticsPage.jsx — Advanced Analytics Dashboard
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { analyticsAPI, teamAPI } from '../api/axios';

const COLORS = ['#4f8ef7','#a855f7','#06b6d4','#10b981','#f59e0b','#ef4444'];
const TS = { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 10, fontSize: 12 } };

export default function AnalyticsPage() {
  const { id: teamId } = useParams();
  const [data, setData]         = useState(null);
  const [leaderboard, setLead]  = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getAll(teamId),
      teamAPI.leaderboard(teamId),
    ]).then(([ana, lb]) => {
      setData(ana.data);
      setLead(lb.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [teamId]);

  if (loading) return (
    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20 }}>
      {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height:220 }}/>)}
    </div>
  );

  const overview      = data?.overview || {};
  const productivity  = data?.productivity || [];
  const taskTimeline  = data?.taskTimeline || [];
  const tasksByStatus = data?.tasksByStatus || [];
  const tasksByPriority = data?.tasksByPriority || [];
  const sentiment     = data?.sentiment || {};
  const burnoutRisks  = data?.burnoutRisks || [];

  const radarData = productivity.slice(0,5).map(m => ({
    name: m.full_name?.split(' ')[0],
    Tasks: m.tasks_score,
    Attendance: m.attendance_score,
    Chat: m.chat_score,
    Uploads: m.upload_score,
  }));

  const sentimentPie = [
    { name:'Positive', value: sentiment.positive || 0 },
    { name:'Neutral',  value: sentiment.neutral  || 0 },
    { name:'Negative', value: sentiment.negative || 0 },
  ];

  const StatCard = ({ label, value, sub, color='var(--accent-blue)' }) => (
    <div className="glass-card" style={{ padding:20 }}>
      <div style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'2rem',fontWeight:800,color }}>{value}</div>
      {sub && <div style={{ fontSize:12,color:'var(--text-muted)',marginTop:4 }}>{sub}</div>}
    </div>
  );

  const burndown = data?.burndown || [];

  return (
    <div style={{ maxWidth: 1200 }}>
      <h1 style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.7rem',fontWeight:800,marginBottom:24,display:'flex',alignItems:'center',gap:10 }}>
        <span style={{ fontSize:24 }}>📊</span>
        <span className="gradient-text">Analytics Dashboard</span>
      </h1>

      {/* Overview Cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:16,marginBottom:28 }}>
        <StatCard label="Completion" value={`${overview.completion_pct || 0}%`} color="var(--accent-green)"/>
        <StatCard label="Tasks Done" value={`${overview.tasks_done||0}/${overview.tasks_total||0}`} color="var(--accent-blue)"/>
        <StatCard label="Members" value={overview.member_count||0} color="var(--accent-purple)"/>
        <StatCard label="Avg Productivity" value={`${Math.round(overview.avg_productivity||0)}%`} color="var(--accent-cyan)"/>
        <StatCard label="Team Health" value={`${overview.health_score||0}%`} color={overview.health_score > 70 ? 'var(--accent-green)' : 'var(--accent-yellow)'}/>
      </div>

      {/* Charts Grid */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:20,marginBottom:24 }}>
        {/* Task Timeline */}
        <motion.div className="glass-hud" style={{ padding:20 }} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
          <h3 style={{ fontWeight:700,fontSize:13,marginBottom:16,textTransform:'uppercase',letterSpacing:1,color:'var(--text-muted)' }}>📅 Task Activity · 14 Days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={taskTimeline} margin={{ top:5,right:10,left:-20,bottom:0 }}>
              <defs>
                <linearGradient id="cgCreated" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.4}/><stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}/></linearGradient>
                <linearGradient id="cgDone" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{ fontSize:10,fill:'var(--text-muted)' }} tickFormatter={d=>d?.slice(5)} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10,fill:'var(--text-muted)' }} axisLine={false} tickLine={false}/>
              <Tooltip {...TS}/>
              <Area type="monotone" dataKey="created" stroke="#4f8ef7" fill="url(#cgCreated)" strokeWidth={2} name="Created" dot={false}/>
              <Area type="monotone" dataKey="completed" stroke="#10b981" fill="url(#cgDone)" strokeWidth={2} name="Completed" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Burn-Down Chart */}
        <motion.div className="glass-hud" style={{ padding:20 }} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.05 }}>
          <h3 style={{ fontWeight:700,fontSize:13,marginBottom:16,textTransform:'uppercase',letterSpacing:1,color:'var(--text-muted)' }}>📉 Sprint Burn-Down</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={burndown} margin={{ top:5,right:10,left:-20,bottom:0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{ fontSize:10,fill:'var(--text-muted)' }} tickFormatter={d=>d?.slice(5)} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10,fill:'var(--text-muted)' }} axisLine={false} tickLine={false}/>
              <Tooltip {...TS}/>
              <Line type="monotone" dataKey="remaining" stroke="#ef4444" strokeWidth={2} dot={false} name="Remaining"/>
              <Line type="monotone" dataKey="ideal" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Ideal"/>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Task Status Pie */}
        <motion.div className="glass-hud" style={{ padding:20 }} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}>
          <h3 style={{ fontWeight:700,fontSize:13,marginBottom:16,textTransform:'uppercase',letterSpacing:1,color:'var(--text-muted)' }}>🎯 Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={tasksByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label={({ status,count })=>`${status}: ${count}`} labelLine={false} fontSize={10}>
                {tasksByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--bg-card)',border:'1px solid var(--border-glass)',borderRadius:8,fontSize:12 }}/>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart */}
        <motion.div className="glass-hud" style={{ padding:20 }} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}>
          <h3 style={{ fontWeight:700,fontSize:13,marginBottom:16,textTransform:'uppercase',letterSpacing:1,color:'var(--text-muted)' }}>🕸 Team Skill Radar</h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={[
              { axis:'Tasks',    ...Object.fromEntries(radarData.map(r=>[r.name,r.Tasks])) },
              { axis:'Attendance',...Object.fromEntries(radarData.map(r=>[r.name,r.Attendance])) },
              { axis:'Chat',     ...Object.fromEntries(radarData.map(r=>[r.name,r.Chat])) },
              { axis:'Uploads',  ...Object.fromEntries(radarData.map(r=>[r.name,r.Uploads])) },
            ]}>
              <PolarGrid stroke="rgba(255,255,255,0.1)"/>
              <PolarAngleAxis dataKey="axis" tick={{ fontSize:11,fill:'#8892b0' }}/>
              {radarData.slice(0,3).map((m,i) => (
                <Radar key={m.name} name={m.name} dataKey={m.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2}/>
              ))}
              <Legend iconType="circle" iconSize={8}/>
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Sentiment Pie */}
        <motion.div className="glass-hud" style={{ padding:20 }} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }}>
          <h3 style={{ fontWeight:700,fontSize:13,marginBottom:16,textTransform:'uppercase',letterSpacing:1,color:'var(--text-muted)' }}>😊 Team Mood (7 Days)</h3>
          <div style={{ display:'flex',alignItems:'center',gap:20 }}>
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={sentimentPie} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                  <Cell fill="#10b981"/><Cell fill="#4f8ef7"/><Cell fill="#ef4444"/>
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {sentimentPie.map((s,i) => (
                <div key={s.name} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <div style={{ width:10,height:10,borderRadius:'50%',background:[COLORS[2*i],COLORS[0],COLORS[5]][i] }}/>
                    <span style={{ fontSize:13 }}>{s.name}</span>
                  </div>
                  <span style={{ fontWeight:700,color:['var(--accent-green)','var(--accent-blue)','#ef4444'][i] }}>{s.value}</span>
                </div>
              ))}
              <div style={{ marginTop:8,fontSize:11,color:'var(--text-muted)' }}>
                Morale Score: <strong style={{ color:'var(--accent-cyan)' }}>{sentiment.morale_score || 0}%</strong>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Productivity + Leaderboard */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24 }}>
        <div className="glass-hud" style={{ padding:20 }}>
          <h3 style={{ fontWeight:700,fontSize:14,marginBottom:16 }}>⚡ Productivity Scores</h3>
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {productivity.map(m => (
              <div key={m.user_id}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,alignItems:'center' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white' }}>{m.full_name[0]}</div>
                    <span style={{ fontSize:13,fontWeight:600 }}>{m.full_name}</span>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:12,color:m.burnout_risk==='high'?'#ef4444':m.burnout_risk==='medium'?'var(--accent-yellow)':'var(--accent-green)' }}>
                      {m.burnout_risk==='high'?'🔴':m.burnout_risk==='medium'?'🟡':'🟢'}
                    </span>
                    <span style={{ fontWeight:700,fontSize:14 }}>{Math.round(m.overall_score)}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${m.overall_score}%`, background: m.overall_score > 70 ? 'linear-gradient(90deg,#10b981,#06b6d4)' : m.overall_score > 40 ? 'linear-gradient(90deg,#f59e0b,#4f8ef7)' : 'linear-gradient(90deg,#ef4444,#f97316)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-hud" style={{ padding:20 }}>
          <h3 style={{ fontWeight:700,fontSize:13,marginBottom:16,textTransform:'uppercase',letterSpacing:1,color:'var(--text-muted)' }}>🏆 Leaderboard</h3>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {leaderboard.slice(0,8).map((m,i) => (
              <div key={m.id} style={{ display:'flex',alignItems:'center',gap:12 }}>
                <span style={{ fontFamily:'monospace',fontWeight:700,fontSize:14,width:24,textAlign:'right',color:['#FFD700','#C0C0C0','#CD7F32'][i]||'var(--text-muted)' }}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                </span>
                <div style={{ width:30,height:30,borderRadius:'50%',background:`linear-gradient(135deg,${COLORS[i%6]},${COLORS[(i+2)%6]})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white' }}>{m.full_name[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:600 }}>{m.full_name}</div>
                  <div style={{ fontSize:11,color:'var(--text-muted)' }}>{m.tasks_completed} tasks</div>
                </div>
                <span style={{ fontWeight:700,color:'var(--accent-yellow)',fontSize:13 }}>⚡{m.xp_points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Burnout Risk */}
      {burnoutRisks.length > 0 && (
        <div className="glass-hud" style={{ padding:20,border:'1px solid rgba(239,68,68,0.25)' }}>
          <h3 style={{ fontWeight:700,fontSize:13,marginBottom:16,color:'#ef4444',textTransform:'uppercase',letterSpacing:1 }}>⚠️ Burnout Risk Alerts</h3>
          <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
            {burnoutRisks.map(m => (
              <div key={m.full_name} style={{ display:'flex',alignItems:'center',gap:10,background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.15)',padding:'10px 16px',borderRadius:10 }}>
                <span style={{ fontSize:20 }}>{m.burnout_risk==='high'?'🔴':'🟡'}</span>
                <div>
                  <div style={{ fontWeight:600,fontSize:13 }}>{m.full_name}</div>
                  <div style={{ fontSize:11,color:'#ef4444' }}>{m.burnout_risk} risk · {Math.round(m.overall_score)}% score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
