// src/pages/admin/AdminSettings.jsx
import { Shield, Layout, Bell, Key } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Settings & Permissions</h1>
        <p style={{ color: '#888', margin: 0 }}>Configure platform-wide settings and manage role-based access control (RBAC).</p>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        <SettingsCard 
          icon={Key} 
          title="Role-Based Access Control" 
          desc="Manage permissions for Super Admins, Moderators, Judges, and Event Managers."
          btnText="Manage Roles"
        />
        <SettingsCard 
          icon={Layout} 
          title="Theme & Branding Settings" 
          desc="Customize the platform colors, logos, and UI elements for specific hackathons."
          btnText="Customize Theme"
        />
        <SettingsCard 
          icon={Bell} 
          title="Notification Preferences" 
          desc="Configure default email templates, webhook integrations, and system alerts."
          btnText="Edit Notifications"
        />
        <SettingsCard 
          icon={Shield} 
          title="Security & Registration" 
          desc="Toggle public registration, configure SSO, and manage API keys."
          btnText="Security Settings"
        />
      </div>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, desc, btnText }) {
  return (
    <div style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #2a2a2a', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
          <Icon size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' }}>{title}</h3>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>{desc}</p>
        </div>
      </div>
      <button style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontWeight: '500', cursor: 'pointer' }}>
        {btnText}
      </button>
    </div>
  );
}
