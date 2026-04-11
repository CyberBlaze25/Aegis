import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/global.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'D', tooltip: 'Dashboard' },
    { path: '/honeypod', label: 'H', tooltip: 'Honeypod' },
    { path: '/telemetry', label: 'T', tooltip: 'Telemetry' },
    { path: '/sentinel', label: 'S', tooltip: 'Sentinel AI' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ marginBottom: '32px', fontWeight: 'bold', color: 'var(--accent-blue)', fontSize: '1.25rem' }}>
        A
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            title={item.tooltip}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: location.pathname === item.path ? 'var(--bg-tertiary)' : 'transparent',
              color: location.pathname === item.path ? 'var(--accent-blue)' : 'var(--text-secondary)',
              border: location.pathname === item.path ? '1px solid var(--border-active)' : '1px solid transparent',
              fontWeight: '600'
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ marginBottom: '16px' }}>
        <button
          title="Settings"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)'
          }}
        >
          ⚙️
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
