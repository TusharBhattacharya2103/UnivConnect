import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 20, background: 'var(--bg)'
    }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTop: '2px solid var(--accent)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%',
          background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font)', fontSize: 14 }}>Loading UnivConnect...</p>
    </div>
  );
}
