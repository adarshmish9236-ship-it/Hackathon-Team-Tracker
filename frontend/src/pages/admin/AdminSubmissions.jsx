// src/pages/admin/AdminSubmissions.jsx
import { useState, useEffect } from 'react';
import { Search, ExternalLink, CheckCircle, XCircle, Clock, X, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/axios';

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [judgeName, setJudgeName] = useState('');

  const fetchSubmissions = async () => {
    try {
      const r = await adminAPI.getSubmissions();
      setSubmissions(r.data);
    } catch (err) {
      toast.error('Failed to load project submissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleOpenJudgeModal = (sub) => {
    setSelectedSub(sub);
    setJudgeName(sub.judge_assigned || '');
    setShowJudgeModal(true);
  };

  const handleAssignJudge = async (e) => {
    e.preventDefault();
    if (!judgeName.trim()) {
      toast.error('Judge Name is required');
      return;
    }
    try {
      // selectedSub.id is the team's ID
      await adminAPI.assignJudge(selectedSub.id, judgeName);
      toast.success(`Judge assigned to ${selectedSub.team_name}!`);
      setShowJudgeModal(false);
      fetchSubmissions();
    } catch (err) {
      toast.error('Failed to assign judge');
    }
  };

  const handleRepoClick = (url) => {
    if (!url || url === '-') return;
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(targetUrl, '_blank');
  };

  const filteredSubs = submissions.filter(sub => {
    const term = search.toLowerCase();
    const projName = (sub.project_name || 'No Submission').toLowerCase();
    const teamName = sub.team_name.toLowerCase();
    const trackName = (sub.track || 'General').toLowerCase();
    const judge = (sub.judge_assigned || '').toLowerCase();
    return projName.includes(term) || teamName.includes(term) || trackName.includes(term) || judge.includes(term);
  });

  if (isLoading) {
    return <div style={{ color: '#888', padding: '40px' }}>Analyzing Project Repositories...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Submission & Evaluation</h1>
          <p style={{ color: '#888', margin: 0 }}>Manage project submissions, assign judges, and track evaluation scores.</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search projects or teams..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 16px 10px 40px', backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', outline: 'none', width: '280px', fontSize: '14px' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#0a0a0a', color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Project Details</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Track / Theme</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Evaluation Status</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubs.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '26px 24px' }}>
                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>{sub.project_name || 'Pending Submission'}</div>
                  <div style={{ color: '#888', fontSize: '13px', marginTop: '6px' }}>Team: {sub.team_name}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ color: '#ccc', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    🏆 {sub.track || 'General Event'}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {sub.status === 'Submitted' && <CheckCircle size={16} color="#10b981" />}
                    {sub.status === 'Under Review' && <Clock size={16} color="#f59e0b" />}
                    {sub.status === 'Evaluated' && <Award size={16} color="#3b82f6" />}
                    {sub.status === 'Missing' && <XCircle size={16} color="#ef4444" />}
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: sub.status === 'Submitted' ? '#10b981' : sub.status === 'Under Review' ? '#f59e0b' : sub.status === 'Evaluated' ? '#3b82f6' : '#ef4444' 
                    }}>
                      {sub.status}
                    </span>
                  </div>
                  {sub.judge_assigned && (
                    <div style={{ color: '#888', fontSize: '12px', marginTop: '6px' }}>
                      Judge: <span style={{ color: '#ccc', fontWeight: '500' }}>{sub.judge_assigned}</span>
                    </div>
                  )}
                  {sub.score !== null && (
                    <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                      Score: <span style={{ color: '#3b82f6', fontWeight: '600' }}>{sub.score} / 100</span>
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  {sub.status !== 'Missing' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        onClick={() => handleRepoClick(sub.repo_url)}
                        style={{ padding: '8px 12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        <ExternalLink size={14} /> Repository
                      </button>
                      <button 
                        onClick={() => handleOpenJudgeModal(sub)}
                        style={{ padding: '8px 12px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Assign Judge
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: '#555', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No Submission Yet</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredSubs.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#555' }}>No submissions matched the search term.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ASSIGN JUDGE MODAL */}
      {showJudgeModal && selectedSub && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '420px', position: 'relative' }}>
            <button onClick={() => setShowJudgeModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginTop: 0, marginBottom: '8px' }}>Assign Evaluator</h2>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 24px 0' }}>Assign a dedicated judge for team <strong>{selectedSub.team_name}</strong>.</p>
            
            <form onSubmit={handleAssignJudge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>Judge Name / ID *</label>
                <input 
                  type="text" 
                  value={judgeName} 
                  onChange={e => setJudgeName(e.target.value)} 
                  placeholder="e.g. Dr. Sarah Jenkins" 
                  required
                  autoFocus
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}
              >
                Assign & Evaluate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
