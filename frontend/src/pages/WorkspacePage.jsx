// src/pages/WorkspacePage.jsx — Shared Hackathon Workspace
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { motion } from 'framer-motion';
import { Users, Link as LinkIcon, FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkspacePage() {
  const { id: teamId } = useParams();
  const [content, setContent] = useState('');
  const [links, setLinks] = useState([{ title: 'Figma Design', url: 'https://figma.com' }, { title: 'GitHub Repo', url: 'https://github.com' }]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [saving, setSaving] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    // Load local storage as a quick fallback if no DB
    const saved = localStorage.getItem(`workspace_${teamId}`);
    if (saved) setContent(saved);
    const savedLinks = localStorage.getItem(`workspace_links_${teamId}`);
    if (savedLinks) setLinks(JSON.parse(savedLinks));
  }, [teamId]);

  useEffect(() => {
    if (!socket) return;
    socket.on('workspace-update', (data) => {
      setContent(data.content);
    });
    return () => socket.off('workspace-update');
  }, [socket]);

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    socket?.emit('workspace-update', { teamId, content: val });
  };

  const saveWorkspace = () => {
    setSaving(true);
    localStorage.setItem(`workspace_${teamId}`, content);
    localStorage.setItem(`workspace_links_${teamId}`, JSON.stringify(links));
    setTimeout(() => {
      setSaving(false);
      toast.success('Workspace saved successfully!');
    }, 500);
  };

  const addLink = (e) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url) return;
    const l = [...links, newLink];
    setLinks(l);
    setNewLink({ title: '', url: '' });
    localStorage.setItem(`workspace_links_${teamId}`, JSON.stringify(l));
  };

  const removeLink = (idx) => {
    const l = links.filter((_, i) => i !== idx);
    setLinks(l);
    localStorage.setItem(`workspace_links_${teamId}`, JSON.stringify(l));
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="var(--accent-pink)" />
            <span className="gradient-text">Team Workspace</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Collaborate on shared notes and resources</p>
        </div>
        <button className="btn-primary" onClick={saveWorkspace} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Workspace'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Collaborative Notepad */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-hud" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="var(--accent-blue)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Shared Hackathon Notes</span>
          </div>
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Type your ideas, API keys, or architectures here... This syncs in real-time."
            style={{
              flex: 1, minHeight: 500, padding: 20, background: 'transparent', border: 'none',
              color: 'var(--text-primary)', fontSize: 14, resize: 'none', outline: 'none',
              fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6
            }}
          />
        </motion.div>

        {/* Resources & Links */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-hud" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <LinkIcon size={16} color="var(--accent-purple)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Project Links</span>
          </div>
          <div style={{ padding: 20 }}>
            <form onSubmit={addLink} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input className="input" style={{ flex: 1, padding: '8px 12px', fontSize: 12 }} placeholder="Link Title" value={newLink.title} onChange={e => setNewLink({ ...newLink, title: e.target.value })} />
              <input className="input" style={{ flex: 2, padding: '8px 12px', fontSize: 12 }} placeholder="URL" value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} />
              <button type="submit" className="btn-primary" style={{ padding: '8px 12px', fontSize: 12 }}>Add</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</span>
                    <a href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent-cyan)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.url}</a>
                  </div>
                  <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>&times;</button>
                </div>
              ))}
              {links.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No links added yet.</p>}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
