import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { USE_MOCK } from '../api/client';
import { LeafIcon } from './NatureIcons';
import { HealthBadge } from './StatusBadge';
import { Menu, X, LogOut } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { isAuthenticated, user, profile, logout, preferredUnit } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState('UNKNOWN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await api.health();
        if (isMounted) setHealthStatus(res?.status === 'UP' ? 'UP' : 'DOWN');
      } catch {
        if (isMounted) setHealthStatus('DOWN');
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = profile?.fullName || user?.username || profile?.username || 'Eco Champion';
  const unitLabel = preferredUnit === 'TONNES_CO2E' ? 'Tonnes CO₂e' : 'kg CO₂e';

  return (
    <header className="site-navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          {isAuthenticated && (
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation drawer"
            >
              <Menu size={22} />
            </button>
          )}

          <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-brand">
            <span className="brand-logo-icon">
              <LeafIcon size={24} color="#FFFFFF" />
            </span>
            <span className="brand-name">
              Carbon<span className="brand-accent">Track</span>
            </span>
            <span className="brand-pill">v1.0</span>
            {USE_MOCK && (
              <span className="brand-pill" style={{ background: '#fef08a', color: '#854d0e', marginLeft: '6px' }}>
                demo mode
              </span>
            )}
          </Link>
        </div>

        <div className="navbar-center">
          <HealthBadge status={healthStatus} />
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <div className="user-nav-cluster">
              <div className="unit-indicator-pill" title="User preferred emission measurement unit">
                <span className="unit-dot" />
                <span>{unitLabel}</span>
              </div>

              <Link to="/profile" className="user-profile-pill" title="View & Edit Profile">
                <div className="user-avatar-initials">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="Avatar" className="user-avatar-img" />
                  ) : (
                    <span>{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="user-info-text">
                  <span className="user-name-text">{displayName}</span>
                  <span className="user-role-text">{profile?.role || 'Member'}</span>
                </div>
              </Link>

              <button
                type="button"
                className="btn-logout"
                onClick={handleLogout}
                title="Log out securely"
              >
                <LogOut size={18} />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          ) : (
            <div className="public-nav-actions">
              <Link
                to="/login"
                className={`btn btn-ghost ${location.pathname === '/login' ? 'active' : ''}`}
              >
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger for public view */}
          {!isAuthenticated && (
            <button
              type="button"
              className="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* Public Mobile Drawer */}
      {!isAuthenticated && mobileMenuOpen && (
        <div className="public-mobile-drawer">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Overview</Link>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
          <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Create Account</Link>
        </div>
      )}
    </header>
  );
}
