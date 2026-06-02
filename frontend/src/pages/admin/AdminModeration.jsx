// src/pages/admin/AdminModeration.jsx
import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Flag, Trash2, Ban } from 'lucide-react';
import { adminAPI } from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminModeration() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadIncidents = () => {
    setIsLoading(true);
    adminAPI.getIncidents()
      .then(res => {
        setReports(res.data);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load incident reports');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminAPI.updateIncidentStatus(id, newStatus);
      toast.success(`Report status set to ${newStatus}`);
      loadIncidents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update report status');
    }
  };

  const handleDeleteIncident = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this report from the database?')) {
      try {
        await adminAPI.deleteIncident(id);
        toast.success('Report entry deleted');
        loadIncidents();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete report');
      }
    }
  };

  // Dynamic statistics
  const pendingCount = reports.filter(r => r.status === 'Pending').length;
  const investigatingCount = reports.filter(r => r.status === 'Investigating').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved').length;
  const suspendedCount = reports.filter(r => r.status === 'Suspended').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Moderation & Reports</h1>
        <p style={{ color: '#888', margin: 0 }}>Review reports, enforce community guidelines, and manage disciplinary actions.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Flag size={20} color="#ef4444" />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>Active Reports</h2>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#0a0a0a', color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Report Details</th>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} style={{ borderBottom: '1px solid #1a1a1a', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: '#fff', fontWeight: '500', fontSize: '14px', marginBottom: '4px' }}>{report.type}</div>
                    <div style={{ color: '#aaa', fontSize: '13px' }}>Target: <strong style={{ color: '#ef4444' }}>{report.target}</strong></div>
                    <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>Reported by: {report.reportedBy} • {report.time || 'recently'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: report.status === 'Resolved' ? 'rgba(16,185,129,0.1)' : report.status === 'Investigating' ? 'rgba(245,158,11,0.1)' : report.status === 'Suspended' ? 'rgba(128,128,128,0.15)' : 'rgba(239,68,68,0.1)',
                      color: report.status === 'Resolved' ? '#10b981' : report.status === 'Investigating' ? '#f59e0b' : report.status === 'Suspended' ? '#888' : '#ef4444'
                    }}>
                      {report.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        onClick={() => handleUpdateStatus(report.id, 'Resolved')}
                        style={{ padding: '8px', background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#10b981', cursor: 'pointer', transition: 'all 0.2s' }} 
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'; e.currentTarget.style.borderColor = '#10b981'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#2a2a2a'; }}
                        title="Resolve"
                      >
                        <Shield size={16} />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(report.id, 'Investigating')}
                        style={{ padding: '8px', background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f59e0b', cursor: 'pointer', transition: 'all 0.2s' }} 
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.1)'; e.currentTarget.style.borderColor = '#f59e0b'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#2a2a2a'; }}
                        title="Investigate / Warn"
                      >
                        <AlertTriangle size={16} />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(report.id, 'Suspended')}
                        style={{ padding: '8px', background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#888', cursor: 'pointer', transition: 'all 0.2s' }} 
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.1)'; e.currentTarget.style.borderColor = '#888'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#2a2a2a'; }}
                        title="Suspend target"
                      >
                        <Ban size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteIncident(report.id)}
                        style={{ padding: '8px', background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }} 
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#2a2a2a'; }}
                        title="Delete Report Entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: '#555' }}>No incident reports logged. Excellent!</td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Syncing with database moderation tables...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0' }}>Moderation Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}><span>Active Reports</span><span style={{ color: '#fff', fontWeight: '600' }}>{pendingCount + investigatingCount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}><span>Investigating</span><span style={{ color: '#f59e0b', fontWeight: '600' }}>{investigatingCount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}><span>Resolved</span><span style={{ color: '#10b981', fontWeight: '600' }}>{resolvedCount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}><span>Suspended</span><span style={{ color: '#ef4444', fontWeight: '600' }}>{suspendedCount}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
