import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, BarChart3, User, Sparkles, X } from 'lucide-react';
import { LeafIcon } from './NatureIcons';

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      badge: null
    },
    {
      to: '/activities',
      label: 'Activity Tracking',
      icon: <Activity size={20} />,
      badge: 'Live'
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: <BarChart3 size={20} />,
      badge: null
    },
    {
      to: '/profile',
      label: 'Profile & Settings',
      icon: <User size={20} />,
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`site-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header-mobile">
          <div className="sidebar-brand-mobile">
            <span className="brand-logo-icon">
              <LeafIcon size={20} color="#FFFFFF" />
            </span>
            <span className="brand-name">CarbonTrack</span>
          </div>
          <button type="button" className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">Navigation</div>
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => onClose && onClose()}
                >
                  <span className="nav-link-icon">{item.icon}</span>
                  <span className="nav-link-text">{item.label}</span>
                  {item.badge && <span className="nav-link-badge">{item.badge}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer-widget">
          <div className="eco-tip-card">
            <div className="eco-tip-header">
              <Sparkles size={16} color="#668F63" />
              <span className="eco-tip-label">Eco Insight</span>
            </div>
            <p className="eco-tip-content">
              Replacing 1 short car trip per week with walking or cycling saves over 100 kg CO₂e every year.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
