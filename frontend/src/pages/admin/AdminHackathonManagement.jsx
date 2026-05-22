// src/pages/admin/AdminHackathonManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Settings2, Users, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/axios';

export default function AdminHackathonManagement() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedHack, setSelectedHack] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('');
  const [status, setStatus] = useState('Registration Open');
  const [deadline, setDeadline] = useState('');

  const fetchHackathons = async () => {
    try {
      const r = await adminAPI.getHackathons();
      setHackathons(r.data);
    } catch (err) {
      toast.error('Failed to load hackathons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Event Name is required');
      return;
    }
    try {
      await adminAPI.createHackathon({ name, theme, status, deadline });
      toast.success('New hackathon event created!');
      setName('');
      setTheme('');
      setStatus('Registration Open');
      setDeadline('');
      setShowCreate(false);
      fetchHackathons();
    } catch (err) {
      toast.error('Failed to create hackathon');
    }
  };

  const handleOpenEdit = (hack) => {
    setSelectedHack(hack);
    setName(hack.name);
    setTheme(hack.theme || '');
    setStatus(hack.status);
    
    // Format deadline date for datetime-local input
    if (hack.deadline) {
      const d = new Date(hack.deadline);
      const formatted = d.toISOString().slice(0, 16);
      setDeadline(formatted);
    } else {
      setDeadline('');
    }
    setShowEdit(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Event Name is required');
      return;
    }
    try {
      await adminAPI.updateHackathon(selectedHack.id, { name, theme, status, deadline });
      toast.success('Hackathon configuration updated!');
      setShowEdit(false);
      fetchHackathons();
    } catch (err) {
      toast.error('Failed to update hackathon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this hackathon event? All mapped data will be affected.')) return;
    try {
      await adminAPI.deleteHackathon(id);
      toast.success('Hackathon event deleted');
      setShowEdit(false);
      fetchHackathons();
    } catch (err) {
      toast.error('Failed to delete hackathon');
    }
  };

  if (isLoading) {
    return <div style={{ color: '#888', padding: '40px' }}>Loading Hackathon Command Center...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Hackathon Management</h1>
          <p style={{ color: '#888', margin: 0 }}>Create, configure, and control hackathon events and their lifecycles.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
        >
          <Plus size={18} /> Create New Event
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {hackathons.map(hack => (
          <div key={hack.id} style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: '600', 
                textTransform: 'uppercase',
                backgroundColor: hack.status === 'Ongoing' ? 'rgba(16,185,129,0.1)' : hack.status === 'Evaluating' ? 'rgba(245,158,11,0.1)' : hack.status === 'Completed' ? 'rgba(136,136,136,0.15)' : 'rgba(59,130,246,0.1)',
                color: hack.status === 'Ongoing' ? '#10b981' : hack.status === 'Evaluating' ? '#f59e0b' : hack.status === 'Completed' ? '#888' : '#3b82f6'
              }}>
                {hack.status}
              </div>
              <button 
                onClick={() => handleOpenEdit(hack)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#888'}
              >
                <Settings2 size={18} />
              </button>
            </div>
            
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0' }}>{hack.name}</h3>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px 0' }}>Theme: {hack.theme || 'General Hackathon'}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="#555" />
                <span style={{ color: '#ccc', fontSize: '14px' }}>{hack.team_count} Teams</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="#555" />
                <span style={{ color: '#ccc', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hack.deadline ? new Date(hack.deadline).toLocaleDateString() : 'No Deadline'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => handleOpenEdit(hack)}
                style={{ flex: 1, padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s' }}
              >
                Manage Setup
              </button>
              <button 
                onClick={() => navigate('/app/admin/submissions')}
                style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#888', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                View Submissions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '450px', position: 'relative' }}>
            <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginTop: 0, marginBottom: '24px' }}>Create New Event</h2>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '6px' }}>Event Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Global AI Challenge 2026" 
                  required
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '6px' }}>Theme</label>
                <input 
                  type="text" 
                  value={theme} 
                  onChange={e => setTheme(e.target.value)} 
                  placeholder="e.g. Artificial Intelligence" 
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '6px' }}>Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)} 
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                >
                  <option value="Registration Open">Registration Open</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Evaluating">Evaluating</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '6px' }}>Deadline</label>
                <input 
                  type="datetime-local" 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)} 
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}
              >
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT/SETUP MODAL */}
      {showEdit && selectedHack && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '450px', position: 'relative' }}>
            <button onClick={() => setShowEdit(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={20} /></button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: 0 }}>Manage Setup</h2>
              <button 
                type="button"
                onClick={() => handleDelete(selectedHack.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
              >
                <Trash2 size={14} /> Delete Event
              </button>
            </div>
            
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '6px' }}>Event Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Global AI Challenge 2026" 
                  required
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '6px' }}>Theme</label>
                <input 
                  type="text" 
                  value={theme} 
                  onChange={e => setTheme(e.target.value)} 
                  placeholder="e.g. Artificial Intelligence" 
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '6px' }}>Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)} 
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                >
                  <option value="Registration Open">Registration Open</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Evaluating">Evaluating</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '6px' }}>Deadline</label>
                <input 
                  type="datetime-local" 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)} 
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
