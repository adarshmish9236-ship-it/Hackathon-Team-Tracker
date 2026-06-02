// src/pages/CreateTeamPage.jsx — Full Team Registration (3-Step)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { teamAPI } from '../api/axios';
import { useStore } from '../store/useStore';
import {
  Plus, X, Users, Rocket, Code, Globe, Crown,
  Target, Zap, Mail, User, ChevronRight, ChevronLeft,
  UserPlus, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { val: 'lead',       label: '👑 Leader'     },
  { val: 'frontend',   label: '🎨 Frontend'   },
  { val: 'backend',    label: '⚙️ Backend'    },
  { val: 'fullstack',  label: '🔥 Fullstack'  },
  { val: 'designer',   label: '✏️ Designer'   },
  { val: 'ml',         label: '🤖 Machine Learning' },
  { val: 'devops',     label: '🚀 DevOps'     },
  { val: 'presenter',  label: '🎤 Presenter'  },
  { val: 'member',     label: '👤 Member'     },
];

const MEMBER_ROLES = ROLES.filter(r => r.val !== 'lead');

const emptyMember = () => ({
  id: Date.now() + Math.random(),
  name: '',
  email: '',
  role: 'member',
  github: '',
  linkedin: '',
});

// ── Field wrapper ─────────────────────────────────────────────
function Field({ label, icon: Icon, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
        {Icon && <Icon size={13} />} {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Icon Input ────────────────────────────────────────────────
function IconInput({ icon: Icon, iconColor, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={15} color={iconColor || 'var(--text-muted)'} style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      <input className="input" style={{ paddingLeft: 34 }} {...props} />
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = [
    { num: 1, label: 'Project' },
    { num: 2, label: 'Leader'  },
    { num: 3, label: 'Members' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => (
        <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, transition: 'all 0.3s',
              background: step > s.num
                ? 'linear-gradient(135deg,var(--accent-green),#059669)'
                : step === s.num
                ? 'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))'
                : 'rgba(255,255,255,0.05)',
              color: step >= s.num ? 'white' : 'var(--text-muted)',
              boxShadow: step === s.num ? '0 0 20px rgba(79,142,247,0.5)' : 'none',
              border: step < s.num ? '1px solid var(--border-glass)' : 'none',
            }}>
              {step > s.num ? <Check size={18} /> : s.num}
            </div>
            <span style={{ fontSize: 11, color: step >= s.num ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 80, height: 2, margin: '0 4px', marginBottom: 20, borderRadius: 99, background: step > s.num ? 'var(--accent-blue)' : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function CreateTeamPage() {
  const navigate = useNavigate();
  const { user, setMyTeams, setCurrentTeam } = useStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: '', hackathon_name: '', deadline: '', description: '',
    registration_fee: 0, is_fee_paid: false,
  });

  const [leader, setLeader] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    role: 'lead',
    github: user?.github_id || '',
    linkedin: user?.linkedin_id || '',
  });

  const [members, setMembers] = useState([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');

  const openDatePicker = () => {
    if (form.deadline) {
      const d = new Date(form.deadline);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setTempDate(`${yyyy}-${mm}-${dd}`);
      setTempTime(`${hh}:${min}`);
    } else {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setTempDate(`${yyyy}-${mm}-${dd}`);
      setTempTime('23:59');
    }
    setShowDatePicker(true);
  };

  const confirmDatePicker = () => {
    if (!tempDate || !tempTime) {
      return toast.error('Please select both date and time');
    }
    const combined = `${tempDate}T${tempTime}`;
    setForm(prev => ({ ...prev, deadline: combined }));
    setShowDatePicker(false);
    toast.success(`Deadline set: ${new Date(combined).toLocaleString()}`);
  };

  const addMember = () => setMembers(prev => [...prev, emptyMember()]);
  const removeMember = id => setMembers(prev => prev.filter(m => m.id !== id));
  const updateMember = (id, field, val) =>
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));

  // ── Navigation ──────────────────────────────────────────────
  const goNext = () => {
    if (step === 1) {
      if (!form.name.trim()) return toast.error('Team name is required');
      setStep(2);
    } else if (step === 2) {
      if (!leader.email.trim()) return toast.error('Leader email is required');
      setStep(3);
    }
  };

  const goBack = () => setStep(s => s - 1);

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        leaderDetails: leader,
        members: members.filter(m => m.email.trim() && m.name.trim()),
      };
      const res = await teamAPI.create(payload);
      const updated = await teamAPI.getMyTeams();
      setMyTeams(updated.data);
      setCurrentTeam(res.data);
      toast.success(`Team "${form.name}" registered! 🎉`);
      navigate(`/app/teams/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create team');
    }
    setLoading(false);
  };

  // ── Styles ──────────────────────────────────────────────────
  const sectionCard = (accentColor = 'rgba(79,142,247,0.2)') => ({
    background: 'rgba(13,21,38,0.7)',
    border: `1px solid ${accentColor}`,
    borderRadius: 16,
    padding: 28,
    backdropFilter: 'blur(24px)',
    boxShadow: '0 0 40px rgba(79,142,247,0.04)',
  });

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };

  // ── Step 1: Project Details ─────────────────────────────────
  const Step1 = (
    <motion.div key="s1" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
      <div style={sectionCard()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Target size={20} color="var(--accent-blue)" />
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Project Details</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Team / Project Name" required icon={Rocket}>
            <input className="input" autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. SyncSphere Core" />
          </Field>
          <div style={grid2}>
            <Field label="Hackathon Name" icon={Target}>
              <input className="input" value={form.hackathon_name} onChange={e => setForm({ ...form, hackathon_name: e.target.value })} placeholder="e.g. Global Hackathon 2025" />
            </Field>
            <Field label="Submission Deadline" icon={Target}>
              <button
                type="button"
                onClick={openDatePicker}
                className="input"
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-sm)',
                  color: form.deadline ? 'var(--text-primary)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 16px',
                }}
              >
                <span>{form.deadline ? new Date(form.deadline).toLocaleString() : 'Set Date & Time'}</span>
                <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600 }}>Modify</span>
              </button>
            </Field>
          </div>
          <div style={grid2}>
            <Field label="Registration Fee ($)" icon={Target}>
              <input type="number" step="0.01" min="0" className="input" value={form.registration_fee || ''} onChange={e => setForm({ ...form, registration_fee: parseFloat(e.target.value) || 0 })} placeholder="0.00 (Free)" />
            </Field>
            {form.registration_fee > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
                <input 
                  type="checkbox" 
                  id="is_fee_paid"
                  checked={form.is_fee_paid} 
                  onChange={e => setForm({ ...form, is_fee_paid: e.target.checked })} 
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
                />
                <label htmlFor="is_fee_paid" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Has this fee been paid?
                </label>
              </div>
            )}
          </div>
          <Field label="Project Vision / Description" icon={Target}>
            <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What are you building? What problem does it solve?" rows={3} style={{ resize: 'vertical' }} />
          </Field>
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn-primary" onClick={goNext} style={{ padding: '11px 28px' }}>
          Leader Profile <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );

  // ── Step 2: Leader Profile ──────────────────────────────────
  const Step2 = (
    <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.25 }}>
      <div style={sectionCard('rgba(168,85,247,0.25)')}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(245,158,11,0.4)' }}>
            <Crown size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Team Leader Profile</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your details as the team captain</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={grid2}>
            <Field label="Full Name" icon={User} required>
              <IconInput icon={User} placeholder="Your full name" value={leader.name} onChange={e => setLeader({ ...leader, name: e.target.value })} />
            </Field>
            <Field label="Role in Project" icon={Target} required>
              <select className="input" value={leader.role} onChange={e => setLeader({ ...leader, role: e.target.value })}>
                {ROLES.map(r => <option key={r.val} value={r.val}>{r.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Email Address" icon={Mail} required>
            <IconInput icon={Mail} iconColor="var(--accent-blue)" type="email" placeholder="leader@email.com" value={leader.email} onChange={e => setLeader({ ...leader, email: e.target.value })} />
          </Field>

          <div style={grid2}>
            <Field label="GitHub Username / URL" icon={Code}>
              <IconInput icon={Code} iconColor="var(--accent-cyan)" placeholder="github.com/username" value={leader.github} onChange={e => setLeader({ ...leader, github: e.target.value })} />
            </Field>
            <Field label="LinkedIn Profile URL" icon={Globe}>
              <IconInput icon={Globe} iconColor="var(--accent-blue)" placeholder="linkedin.com/in/username" value={leader.linkedin} onChange={e => setLeader({ ...leader, linkedin: e.target.value })} />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" className="btn-ghost" onClick={goBack}>
          <ChevronLeft size={16} /> Back
        </button>
        <button type="button" className="btn-primary" onClick={goNext} style={{ padding: '11px 28px' }}>
          Add Members <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );

  // ── Step 3: Members ─────────────────────────────────────────
  const Step3 = (
    <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.25 }}>
      <div style={sectionCard()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={20} color="var(--accent-blue)" />
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>Team Members</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {members.length === 0 ? 'Add your teammates below' : `${members.length} member${members.length > 1 ? 's' : ''} added`}
              </p>
            </div>
          </div>
          <button type="button" className="btn-ghost" onClick={addMember} style={{ padding: '8px 16px', fontSize: 13, border: '1px dashed rgba(79,142,247,0.4)' }}>
            <UserPlus size={15} /> Add Member
          </button>
        </div>

        <AnimatePresence>
          {members.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12 }}>
              <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No members added yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>You can also invite teammates later via invite code</p>
              <button type="button" className="btn-ghost" onClick={addMember} style={{ marginTop: 16, borderStyle: 'dashed' }}>
                <Plus size={14} /> Add First Member
              </button>
            </motion.div>
          )}

          {members.map((m, i) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ background: 'rgba(79,142,247,0.04)', border: '1px solid rgba(79,142,247,0.12)', borderRadius: 14, padding: 20, position: 'relative' }}>
                {/* Member header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)' }}>Member {i + 1}</span>
                  </div>
                  <button type="button" onClick={() => removeMember(m.id)}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <X size={13} /> Remove
                  </button>
                </div>

                {/* Row 1: Name + Role */}
                <div style={{ ...grid2, marginBottom: 12 }}>
                  <Field label="Full Name" icon={User} required>
                    <IconInput icon={User} placeholder="Member's full name" value={m.name} onChange={e => updateMember(m.id, 'name', e.target.value)} />
                  </Field>
                  <Field label="Role in Project" icon={Target}>
                    <select className="input" value={m.role} onChange={e => updateMember(m.id, 'role', e.target.value)}>
                      {MEMBER_ROLES.map(r => <option key={r.val} value={r.val}>{r.label}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Row 2: Email */}
                <div style={{ marginBottom: 12 }}>
                  <Field label="Email Address" icon={Mail} required>
                    <IconInput icon={Mail} iconColor="var(--accent-blue)" type="email" placeholder="member@email.com" value={m.email} onChange={e => updateMember(m.id, 'email', e.target.value)} />
                  </Field>
                </div>

                {/* Row 3: GitHub + LinkedIn */}
                <div style={grid2}>
                  <Field label="GitHub Username / URL" icon={Code}>
                    <IconInput icon={Code} iconColor="var(--accent-cyan)" placeholder="github.com/username" value={m.github} onChange={e => updateMember(m.id, 'github', e.target.value)} />
                  </Field>
                  <Field label="LinkedIn Profile URL" icon={Globe}>
                    <IconInput icon={Globe} iconColor="var(--accent-blue)" placeholder="linkedin.com/in/username" value={m.linkedin} onChange={e => updateMember(m.id, 'linkedin', e.target.value)} />
                  </Field>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary Preview */}
      {(members.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 16, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Check size={16} color="var(--accent-green)" />
          <span style={{ fontSize: 13, color: 'var(--accent-green)' }}>
            Registering <strong>1 leader</strong> + <strong>{members.filter(m => m.name && m.email).length} member{members.filter(m => m.name && m.email).length !== 1 ? 's' : ''}</strong> for <strong>"{form.name}"</strong>
          </span>
        </motion.div>
      )}

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" className="btn-ghost" onClick={goBack}>
          <ChevronLeft size={16} /> Back
        </button>
        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '11px 32px', fontSize: 15 }}>
          {loading
            ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} /> Registering...</>
            : <><Zap size={16} /> Register Team</>}
        </button>
      </div>
    </motion.div>
  );

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 740, margin: '0 auto', paddingBottom: 60 }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 14 }}>
          <Rocket size={13} /> Hackathon Team Registration
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
          <span className="gradient-text">Assemble Your Dream Team</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Register your leader, add N members — each with their GitHub, LinkedIn & email
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator step={step} />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {step === 1 && Step1}
          {step === 2 && Step2}
          {step === 3 && Step3}
        </AnimatePresence>
      </form>

      {/* Date Picker Custom Popup */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 600,
              backdropFilter: 'blur(10px)',
            }}
            onClick={(e) => e.target === e.currentTarget && setShowDatePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 24, stiffness: 350 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: 400,
                padding: 30,
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                📅 Select Deadline
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>DATE</label>
                  <input
                    type="date"
                    className="input"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>TIME</label>
                  <input
                    type="time"
                    className="input"
                    value={tempTime}
                    onChange={(e) => setTempTime(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setShowDatePicker(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={confirmDatePicker}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
