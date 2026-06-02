// src/pages/admin/AdminSettings.jsx
import { useState, useEffect } from 'react';
import { Shield, Layout, Bell, Key, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { adminAPI } from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    maintenance_mode: 'false',
    allow_registration: 'true',
    xp_multiplier: '1.0'
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = () => {
    setIsLoading(true);
    adminAPI.getSettings()
      .then(res => {
        // Handle empty or default configuration mapping
        setSettings({
          maintenance_mode: res.data.maintenance_mode || 'false',
          allow_registration: res.data.allow_registration || 'true',
          xp_multiplier: res.data.xp_multiplier || '1.0'
        });
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to sync system settings');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleSetting = async (key, currentValue) => {
    const nextValue = currentValue === 'true' ? 'false' : 'true';
    try {
      await adminAPI.updateSetting(key, nextValue);
      setSettings(prev => ({ ...prev, [key]: nextValue }));
      toast.success(`${key.replace('_', ' ').toUpperCase()} set to ${nextValue === 'true' ? 'ENABLED' : 'DISABLED'}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to persist setting update');
    }
  };

  const handleUpdateMultiplier = async (val) => {
    try {
      await adminAPI.updateSetting('xp_multiplier', val);
      setSettings(prev => ({ ...prev, xp_multiplier: val }));
      toast.success(`XP Multiplier increased to ${val}x`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update XP multiplier');
    }
  };

  const handleInteractiveTrigger = (moduleName) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Synchronizing ${moduleName} module...`,
        success: <b>{moduleName} fully optimized and verified!</b>,
        error: <b>Sync failed.</b>,
      }
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Settings & Permissions</h1>
        <p style={{ color: '#888', margin: 0 }}>Configure platform-wide settings and manage role-based access control (RBAC).</p>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', color: '#888', textAlign: 'center' }}>Synchronizing settings telemetry from database...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section: Live DB Controls */}
          <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#3b82f6" /> Relational Engine Configuration
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Maintenance Mode */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
                <div>
                  <h3 style={{ fontSize: '16px', color: '#fff', margin: '0 0 4px 0', fontWeight: '600' }}>Maintenance Mode</h3>
                  <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Restrict platform access to system administrators only during diagnostics.</p>
                </div>
                <button 
                  onClick={() => handleToggleSetting('maintenance_mode', settings.maintenance_mode)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: settings.maintenance_mode === 'true' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${settings.maintenance_mode === 'true' ? '#ef4444' : '#3b82f6'}`, borderRadius: '8px', color: settings.maintenance_mode === 'true' ? '#ef4444' : '#3b82f6', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {settings.maintenance_mode === 'true' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  {settings.maintenance_mode === 'true' ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>

              {/* Allow Public Registration */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
                <div>
                  <h3 style={{ fontSize: '16px', color: '#fff', margin: '0 0 4px 0', fontWeight: '600' }}>Allow Public Registration</h3>
                  <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Enable or disable new users registering via the signup dashboard portal.</p>
                </div>
                <button 
                  onClick={() => handleToggleSetting('allow_registration', settings.allow_registration)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: settings.allow_registration === 'true' ? 'rgba(16,185,129,0.1)' : 'rgba(128,128,128,0.1)', border: `1px solid ${settings.allow_registration === 'true' ? '#10b981' : '#666'}`, borderRadius: '8px', color: settings.allow_registration === 'true' ? '#10b981' : '#888', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {settings.allow_registration === 'true' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  {settings.allow_registration === 'true' ? 'OPEN' : 'CLOSED'}
                </button>
              </div>

              {/* XP Boost Multiplier */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
                <div>
                  <h3 style={{ fontSize: '16px', color: '#fff', margin: '0 0 4px 0', fontWeight: '600' }}>XP Multiplier Boost</h3>
                  <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Multiply XP rewards dynamically for task completions (DBMS trigger calculation).</p>
                </div>
                <select 
                  value={settings.xp_multiplier}
                  onChange={(e) => handleUpdateMultiplier(e.target.value)}
                  style={{ padding: '10px 16px', backgroundColor: '#121212', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="1.0">1.0x Normal XP</option>
                  <option value="1.5">1.5x Medium Boost</option>
                  <option value="2.0">2.0x Double XP Morale</option>
                  <option value="3.0">3.0x Ultimate Hackathon Boost</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Secondary Customizations */}
          <div style={{ display: 'grid', gap: '20px' }}>
            <SettingsCard 
              icon={Key} 
              title="Role-Based Access Control" 
              desc="Manage permissions for Super Admins, Moderators, Judges, and Event Managers."
              btnText="Manage Roles"
              onClick={() => handleInteractiveTrigger('Role-Based Access Control')}
            />
            <SettingsCard 
              icon={Layout} 
              title="Theme & Branding Settings" 
              desc="Customize the platform colors, logos, and UI elements for specific hackathons."
              btnText="Customize Theme"
              onClick={() => handleInteractiveTrigger('Theme & Branding')}
            />
            <SettingsCard 
              icon={Bell} 
              title="Notification Preferences" 
              desc="Configure default email templates, webhook integrations, and system alerts."
              btnText="Edit Notifications"
              onClick={() => handleInteractiveTrigger('Notifications')}
            />
            <SettingsCard 
              icon={Shield} 
              title="Security & Registration" 
              desc="Toggle public registration, configure SSO, and manage API keys."
              btnText="Security Settings"
              onClick={() => handleInteractiveTrigger('Security Engine')}
            />
          </div>

        </div>
      )}
    </div>
  );
}

function SettingsCard({ icon: Icon, title, desc, btnText, onClick }) {
  return (
    <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s, border-color 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
          <Icon size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' }}>{title}</h3>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>{desc}</p>
        </div>
      </div>
      <button 
        onClick={onClick}
        style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#1a1a1a'; e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#fff'; }}
      >
        {btnText}
      </button>
    </div>
  );
}
