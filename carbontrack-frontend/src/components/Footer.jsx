import React from 'react';
import { Link } from 'react-router-dom';
import { LeafIcon } from './NatureIcons';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({ compact = false }) {

  if (compact) {
    return (
      <footer className="compact-footer" style={{
        padding: '1.25rem 0',
        marginTop: 'auto',
        borderTop: '1px solid var(--border-divider)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <LeafIcon size={16} color="var(--forest-primary)" />
          <span>CarbonTrack &copy; {CURRENT_YEAR} &mdash; Personal Carbon Accounting Platform</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="landing-footer">
      <div className="landing-container footer-inner">
        <div className="footer-left">
          <div className="footer-brand">
            <LeafIcon size={20} color="#244B35" />
            <span>CarbonTrack</span>
          </div>
          <p className="footer-tagline">Personal &amp; Organizational Carbon Accounting Platform</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            &copy; {CURRENT_YEAR} CarbonTrack. All rights reserved.
          </span>
        </div>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/forgot-password">Reset Password</Link>
        </div>
      </div>
    </footer>
  );
}
