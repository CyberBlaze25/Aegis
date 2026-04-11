import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import '../styles/global.css';

const TopBar = () => {
  const location = useLocation();
  const { status: socketStatus } = useSocket();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'COMMAND CENTER';
      case '/honeypod': return 'HONEYPOD OVERVIEW';
      case '/telemetry': return 'REAL-TIME TELEMETRY';
      case '/sentinel': return 'SENTINEL AI ANALYSIS';
      default: return 'AEGIS SENTINEL';
    }
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {getPageTitle()}
        </h2>
        <span className="text-dim text-xs" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
          ID: AEGIS-7-SECURE
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '4px 10px',
          borderRadius: '4px',
          backgroundColor: 'var(--bg-tertiary)',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: socketStatus === 'CONNECTED' ? 'var(--accent-green)' : 'var(--accent-red)'
        }}>
          <div style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: socketStatus === 'CONNECTED' ? 'var(--accent-green)' : 'var(--accent-red)',
            boxShadow: socketStatus === 'CONNECTED' ? '0 0 6px var(--accent-green)' : '0 0 6px var(--accent-red)'
          }}></div>
          {socketStatus === 'CONNECTED' ? 'LINK ACTIVE' : 'LINK DISCONNECTED'}
        </div>
        
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
          HG
        </div>
      </div>
    </header>
  );
};

export default TopBar;
