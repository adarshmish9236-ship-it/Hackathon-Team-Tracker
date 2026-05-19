// src/pages/LandingPage.jsx — Futuristic hero with particles
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Users, Kanban, BarChart3, Shield, Brain, Swords, ChevronRight, Star } from 'lucide-react';

const STATS = [
  { value: '10K+', label: 'Teams Tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '50ms', label: 'Avg Latency' },
  { value: '∞',   label: 'Possibilities' },
];

const FEATURES = [
  { icon: Swords,  title: 'War Room',       desc: 'Live hackathon dashboard with timer, stress meter, and real-time completion tracking.', color:'#4f8ef7' },
  { icon: Brain,   title: 'AI Insights',    desc: 'Productivity scores, burnout detection, and smart role allocation powered by algorithms.', color:'#a855f7' },
  { icon: Kanban,  title: 'Kanban Board',   desc: 'Drag-and-drop task management synced live across all team members instantly.', color:'#06b6d4' },
  { icon: Users,   title: 'Team Pulse',     desc: 'See who is online, what they\'re editing, live typing indicators and cursor tracking.', color:'#10b981' },
  { icon: BarChart3,title:'Analytics',      desc: 'GitHub-style heatmaps, contribution graphs, mood analytics, and performance trends.', color:'#f59e0b' },
  { icon: Shield,  title: 'SOS System',     desc: 'One-click emergency alert with severity levels. Critical for offline hackathons.', color:'#ef4444' },
];

export default function LandingPage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
    }));
    let raf;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79,142,247,${p.alpha})`;
        ctx.fill();
      });
      // Connect nearby particles
      particles.forEach((a, i) => particles.slice(i+1).forEach(b => {
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(79,142,247,${0.15*(1-d/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(animate);
    };
    animate();
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', position:'relative', overflow:'hidden' }}>
      <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }}/>

      {/* Nav */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 40px', background:'rgba(5,11,24,0.8)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid var(--border-glass)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#4f8ef7,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(79,142,247,0.5)' }}>
            <Zap size={20} color="white"/>
          </div>
          <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:18 }} className="gradient-text">SyncSphere</span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <Link to="/login"><button className="btn-ghost" style={{ padding:'8px 20px' }}>Login</button></Link>
          <Link to="/register"><button className="btn-primary" style={{ padding:'8px 20px' }}>Get Started <ChevronRight size={14}/></button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'120px 24px 80px', position:'relative', zIndex:1 }}>
        <motion.div initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.8 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:99, background:'rgba(79,142,247,0.1)', border:'1px solid rgba(79,142,247,0.3)', marginBottom:24, fontSize:13, color:'var(--accent-blue)' }}>
            <Zap size={12}/> The OS for Hackathon Teams • 2024
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(2.5rem,6vw,5rem)', fontWeight:800, lineHeight:1.1, marginBottom:24, maxWidth:800 }}>
            <span className="gradient-text">Real-Time Collaboration</span>
            <br/>for Winning Hackathons
          </h1>
          <p style={{ fontSize:'clamp(1rem,2vw,1.25rem)', color:'var(--text-secondary)', maxWidth:600, margin:'0 auto 40px', lineHeight:1.7 }}>
            SyncSphere combines Kanban, real-time chat, AI analytics, war room dashboards, and gamification — built specifically for hackathon teams.
          </p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/register">
              <motion.button className="btn-primary" style={{ padding:'14px 32px', fontSize:16 }}
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.98 }}>
                Launch Your Team 🚀
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button className="btn-ghost" style={{ padding:'14px 32px', fontSize:16 }}
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.98 }}>
                Sign In
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity:0,y:40 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4,duration:0.8 }}
          style={{ display:'flex', gap:48, marginTop:80, flexWrap:'wrap', justifyContent:'center' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'2.5rem', fontWeight:800 }} className="gradient-text">{s.value}</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding:'80px 40px', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'2.5rem', fontWeight:700, marginBottom:12 }}>
            Every Tool You Need to <span className="gradient-text">Win</span>
          </h2>
          <p style={{ color:'var(--text-secondary)', fontSize:16 }}>Purpose-built for the chaos of hackathons</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24, maxWidth:1100, margin:'0 auto' }}>
          {FEATURES.map((f,i) => (
            <motion.div key={f.title} className="glass-card" style={{ padding:28 }}
              initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} transition={{ delay:i*0.1 }} viewport={{ once:true }}>
              <div style={{ width:48,height:48,borderRadius:12,background:`${f.color}20`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
                <f.icon size={24} color={f.color}/>
              </div>
              <h3 style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>{f.title}</h3>
              <p style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'80px 40px', textAlign:'center', position:'relative', zIndex:1 }}>
        <div className="glass-card" style={{ maxWidth:700, margin:'0 auto', padding:60, background:'linear-gradient(135deg,rgba(79,142,247,0.08),rgba(168,85,247,0.08))' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏆</div>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'2rem', fontWeight:700, marginBottom:16 }}>
            Ready to build something <span className="gradient-text">legendary?</span>
          </h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:32, fontSize:16 }}>Join teams already using SyncSphere to coordinate, ship fast, and win.</p>
          <Link to="/register">
            <motion.button className="btn-primary" style={{ padding:'14px 40px', fontSize:16 }}
              whileHover={{ scale:1.05 }} whileTap={{ scale:0.98 }}>
              Start Free — No Credit Card <ChevronRight size={16}/>
            </motion.button>
          </Link>
        </div>
      </section>

      <footer style={{ textAlign:'center', padding:'24px', color:'var(--text-muted)', fontSize:13, borderTop:'1px solid var(--border-glass)', position:'relative', zIndex:1 }}>
        © 2024 SyncSphere · Built for Hackathon Excellence · DBMS Project
      </footer>
    </div>
  );
}
