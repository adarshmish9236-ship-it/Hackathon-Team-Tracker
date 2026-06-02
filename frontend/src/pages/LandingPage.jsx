// FILE: e:/PROJECTS/DBMS/frontend/src/pages/LandingPage.jsx
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Kanban, BarChart3, Shield, TrendingUp, Swords, ChevronRight, ChevronDown, Activity } from 'lucide-react';
import syncsphereLogo from '../assets/syncsphere-logo.png';

const STATS = [
  { value: '10K+', label: 'Teams Tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '50ms', label: 'Avg Latency' },
  { value: '∞', label: 'Possibilities' },
];

const FEATURES = [
  { icon: Swords,    title: 'War Room',     desc: 'Live hackathon dashboard with timer, stress meter, and real-time completion tracking.', color: 'var(--indigo)',  grad: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(99,102,241,0.05))' },
  { icon: TrendingUp, title: 'Team Insights', desc: 'Productivity scores, burnout detection, and smart role recommendations based on team activity.', color: 'var(--violet)', grad: 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(139,92,246,0.05))' },
  { icon: Kanban,    title: 'Kanban Board', desc: 'Drag-and-drop task management synced live across all team members instantly.', color: 'var(--cyan)',   grad: 'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(6,182,212,0.05))' },
  { icon: Activity,  title: 'Team Pulse',   desc: 'See who is online, what they\'re editing, live typing indicators and cursor tracking.', color: 'var(--emerald)', grad: 'linear-gradient(135deg,rgba(16,185,129,0.25),rgba(16,185,129,0.05))' },
  { icon: BarChart3, title: 'Analytics',    desc: 'GitHub-style heatmaps, contribution graphs, mood analytics, and performance trends.', color: 'var(--amber)',  grad: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(245,158,11,0.05))' },
  { icon: Shield,    title: 'SOS System',   desc: 'One-click emergency alert with severity levels. Critical for offline hackathons.', color: 'var(--rose)',   grad: 'linear-gradient(135deg,rgba(244,63,94,0.25),rgba(244,63,94,0.05))' },
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
      particles.forEach((a, i) => particles.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(79,142,247,${0.15 * (1 - d / 120)})`;
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
    <div style={{ minHeight: '100vh', background: 'var(--space-void)', position: 'relative', overflow: 'hidden' }}>

      {/* Fixed Pill Navbar */}
      <nav style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, width: '90%', maxWidth: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(24px)', background: 'rgba(8,13,24,0.8)',
        border: '1px solid rgba(99,102,241,0.15)', borderRadius: 99,
        padding: '10px 20px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={syncsphereLogo}
            alt="SyncSphere Logo"
            style={{
              width: 36, height: 36,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.6))',
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 17 }} className="gradient-text">
            SyncSphere
          </span>
        </div>
        {/* Nav Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login">
            <button className="btn-ghost" style={{ padding: '7px 18px', fontSize: 13, borderRadius: 99 }}>Login</button>
          </Link>
          <Link to="/register">
            <button className="btn-primary" style={{ padding: '7px 18px', fontSize: 13, borderRadius: 99 }}>
              Get Started <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-dot-grid" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '140px 24px 80px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Canvas behind */}
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

        {/* Ambient orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge Pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 18px', borderRadius: 99, marginBottom: 28,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
            border: '1px solid rgba(99,102,241,0.35)', fontSize: 13,
            color: 'var(--indigo-light)',
            boxShadow: '0 0 24px rgba(99,102,241,0.15)',
            animation: 'shimmer 2.5s ease-in-out infinite',
          }}>
            <span>⚡</span> Built to turn caffeine and late nights into podium finishes
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 900, lineHeight: 1.05, marginBottom: 28,
            maxWidth: 820, letterSpacing: '-0.02em',
          }}>
            The Operating System<br />
            For <span className="gradient-text">Elite Teams</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 18, color: 'var(--text-secondary)',
            maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.75,
          }}>
            SyncSphere combines Kanban, real-time chat, productivity insights, war room dashboards, and gamification — built specifically for hackathon teams.
          </p>

          {/* CTA Row */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link to="/register">
              <motion.button className="btn-primary" style={{ padding: '14px 36px', fontSize: 16, borderRadius: 99 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                Start for Free →
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button className="btn-ghost" style={{ padding: '14px 36px', fontSize: 16, borderRadius: 99 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                Watch Demo
              </motion.button>
            </Link>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STATS.map(s => (
              <div key={s.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '14px 24px', borderRadius: 99,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(99,102,241,0.18)',
                backdropFilter: 'blur(12px)',
                minWidth: 110,
              }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.8rem', fontWeight: 800 }} className="gradient-text">{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 1, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}
        >
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Scroll</span>
          <ChevronDown size={18} />
        </motion.div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '100px 40px', position: 'relative', zIndex: 1 }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>FEATURES</div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 14, letterSpacing: '-0.02em' }}>
            Everything Your Team <span className="gradient-text">Needs</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Purpose-built for the chaos of hackathons. Every feature, right when you need it.
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} className="card-orbital"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              style={{ padding: 28, background: f.grad }}
              whileHover={{ y: -4, boxShadow: `0 20px 48px ${f.color}30` }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${f.color}22`,
                border: `1px solid ${f.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
                boxShadow: `0 0 20px ${f.color}25`,
              }}>
                <f.icon size={24} color={f.color} />
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 40px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Gradient orb behind card */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), rgba(139,92,246,0.08), transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <motion.div className="card-mission" style={{ maxWidth: 700, margin: '0 auto', padding: '64px 56px', position: 'relative' }}
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🏆</div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Ready to build something <span className="gradient-text-gold">legendary?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 17, lineHeight: 1.7 }}>
            Join teams already using SyncSphere to coordinate, ship fast, and win.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <motion.button className="btn-primary" style={{ padding: '14px 40px', fontSize: 16, borderRadius: 99 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                Start Free — No Credit Card <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button className="btn-ghost" style={{ padding: '14px 32px', fontSize: 16, borderRadius: 99 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                Sign In
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '28px 24px', color: 'var(--text-muted)', fontSize: 13, position: 'relative', zIndex: 1 }}>
        <div className="divider" style={{ marginBottom: 24 }} />
        © 2026 SyncSphere · Built for Hackathon Excellence · DBMS Project
      </footer>
    </div>
  );
}
