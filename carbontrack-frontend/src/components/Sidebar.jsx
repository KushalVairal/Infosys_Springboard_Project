import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Target,
  Sparkles,
  Bot,
  Users,
  Trophy,
  Award,
  Bell,
  Settings,
  Globe,
  Building2,
  UserPlus,
  ChevronDown,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { LeafIcon } from './NatureIcons';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { logout, profile, user, token } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Remember expanded/collapsed category groups across navigation
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('carbontrack-sidebar-groups');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      OVERVIEW: true,
      TRACKING: true,
      INTELLIGENCE: true,
      COMMUNITY: true,
      ACCOUNT: true,
      ORGANISATION: true
    };
  });

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupKey]: !prev[groupKey] };
      try {
        localStorage.setItem('carbontrack-sidebar-groups', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.notifications.getUnreadCount();
      setUnreadCount(Number(res?.unreadCount || 0));
    } catch {
      // Ignore unread count failure silently
    }
  }, [token]);

  useEffect(() => {
    fetchUnread();
    const handleChanged = () => fetchUnread();
    window.addEventListener('carbontrack:notifications-changed', handleChanged);
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      window.removeEventListener('carbontrack:notifications-changed', handleChanged);
      clearInterval(interval);
    };
  }, [fetchUnread]);

  const isOrgAdmin =
    (profile?.role || user?.role) === 'ORG_ADMIN' ||
    (profile?.role || user?.role) === 'ROLE_ORG_ADMIN';

  // Navigation categorized into structured sections (Phase 3)
  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          iconType: 'dashboard',
          badge: null
        }
      ]
    },
    {
      group: 'TRACKING',
      items: [
        {
          to: '/activities',
          label: 'Activity Tracking',
          icon: Activity,
          iconType: 'activity',
          badge: 'Live'
        },
        {
          to: '/analytics',
          label: 'Analytics',
          icon: BarChart3,
          iconType: 'analytics',
          badge: null
        },
        {
          to: '/goals',
          label: 'Sustainability Goals',
          icon: Target,
          iconType: 'goals',
          badge: null
        }
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        {
          to: '/recommendations',
          label: 'Recommendations',
          icon: Sparkles,
          iconType: 'recommendations',
          badge: 'Smart'
        },
        {
          to: '#ai-assistant',
          label: 'AI Assistant',
          icon: Bot,
          iconType: 'ai',
          badge: 'AI',
          isAction: true,
          onClick: () => {
            window.dispatchEvent(new CustomEvent('carbontrack:ask-ai', { detail: {} }));
            if (onClose) onClose();
          }
        }
      ]
    },
    {
      group: 'COMMUNITY',
      items: [
        {
          to: '/benchmarks',
          label: 'Peer Benchmarks',
          icon: Users,
          iconType: 'benchmarks',
          badge: null
        },
        {
          to: '/leaderboard',
          label: 'Community Leaderboard',
          icon: Trophy,
          iconType: 'leaderboard',
          badge: null
        },
        {
          to: '/achievements',
          label: 'My Achievements',
          icon: Award,
          iconType: 'achievements',
          badge: null
        }
      ]
    },
    {
      group: 'ACCOUNT',
      items: [
        {
          to: '/notifications',
          label: 'Notifications',
          icon: Bell,
          iconType: 'notifications',
          badge: unreadCount > 0 ? String(unreadCount) : null
        },
        {
          to: '/profile',
          label: 'Profile & Settings',
          icon: Settings,
          iconType: 'profile',
          badge: null
        }
      ]
    },
    {
      group: 'ORGANISATION',
      items: [
        {
          to: '/organisation/discover',
          label: 'Discover Organisations',
          icon: Globe,
          iconType: 'organisations',
          badge: null
        },
        ...(isOrgAdmin
          ? [
              {
                to: '/organisation',
                label: 'Organisation Dashboard',
                icon: Building2,
                iconType: 'org-dashboard',
                badge: 'Admin'
              },
              {
                to: '/organisation/members',
                label: 'Manage Members',
                icon: UserPlus,
                iconType: 'members',
                badge: null
              }
            ]
          : [])
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`site-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Unified CarbonTrack Brand Header & Collapse/Expand Control */}
        <div className="sidebar-brand-header">
          <button
            type="button"
            className="sidebar-brand-toggle-btn"
            onClick={() => {
              if (window.innerWidth <= 768 && onClose) {
                onClose();
              } else if (onToggleCollapse) {
                onToggleCollapse();
              }
            }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            <span className="brand-logo-icon">
              <LeafIcon size={22} color="var(--forest-accent, #4ade80)" />
            </span>
            {!isCollapsed && (
              <span className="brand-name">CarbonTrack</span>
            )}
          </button>
        </div>

        {/* Navigation Categories */}
        <nav className="sidebar-nav" aria-label="Main Application Navigation">
          {navGroups.map((group) => {
            if (group.items.length === 0) return null;
            const isGroupExpanded = expandedGroups[group.group] ?? true;

            return (
              <div key={group.group} className={`sidebar-nav-group ${isGroupExpanded ? 'is-expanded' : 'is-collapsed'}`}>
                {!isCollapsed && (
                  <button
                    type="button"
                    className="nav-group-header-btn"
                    onClick={() => toggleGroup(group.group)}
                    aria-expanded={isGroupExpanded}
                    title={`${isGroupExpanded ? 'Collapse' : 'Expand'} ${group.group} section`}
                  >
                    <span className="nav-group-label">{group.group}</span>
                    <ChevronDown size={14} className={`nav-group-arrow ${isGroupExpanded ? 'open' : ''}`} />
                  </button>
                )}
                <ul className={`nav-list ${!isCollapsed && !isGroupExpanded ? 'collapsed-list' : ''}`}>
                  {group.items.map((item) => {
                    const IconComponent = item.icon;
                    const tooltipText = item.badge ? `${item.label} (${item.badge})` : item.label;

                    if (item.isAction) {
                      return (
                        <li key={item.label} className="nav-item">
                          <button
                            type="button"
                            className="nav-link nav-link-btn"
                            onClick={item.onClick}
                            title={isCollapsed ? tooltipText : undefined}
                          >
                            <span className={`nav-link-icon nav-icon-${item.iconType}`}>
                              <IconComponent size={20} />
                            </span>
                            {!isCollapsed && <span className="nav-link-text">{item.label}</span>}
                            {item.badge && !isCollapsed && (
                              <span className="nav-link-badge badge-ai">{item.badge}</span>
                            )}
                            {isCollapsed && <span className="nav-tooltip">{tooltipText}</span>}
                          </button>
                        </li>
                      );
                    }

                    return (
                      <li key={item.to} className="nav-item">
                        <NavLink
                          to={item.to}
                          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                          onClick={() => onClose && onClose()}
                          title={isCollapsed ? tooltipText : undefined}
                        >
                          <span className={`nav-link-icon nav-icon-${item.iconType}`}>
                            <IconComponent size={20} />
                          </span>
                          {!isCollapsed && <span className="nav-link-text">{item.label}</span>}
                          {item.badge && !isCollapsed && (
                            <span className="nav-link-badge">
                              {item.badge}
                            </span>
                          )}
                          {item.badge && isCollapsed && (
                            <span className="badge-collapsed-dot" title={item.badge} />
                          )}
                          {isCollapsed && <span className="nav-tooltip">{tooltipText}</span>}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Eco Tip Widget (hidden when collapsed) */}
        {!isCollapsed && (
          <div className="sidebar-footer-widget">
            <div className="eco-tip-card">
              <div className="eco-tip-header">
                <Sparkles size={16} color="var(--sage-secondary, #668F63)" />
                <span className="eco-tip-label">Eco Insight</span>
              </div>
              <p className="eco-tip-content">
                Replacing 1 short car trip per week with walking or cycling saves over 100 kg CO₂e every year.
              </p>
            </div>
          </div>
        )}

        {/* User Card */}
        <div className="sidebar-user-card">
          <NavLink
            to="/profile"
            onClick={() => onClose && onClose()}
            className="sidebar-user-link"
            title={isCollapsed ? (profile?.fullName || profile?.username || user?.username || 'Member') : undefined}
          >
            <Avatar
              avatarSeed={profile?.avatarSeed}
              seed={profile?.avatarSeed || profile?.username || user?.username}
              username={profile?.username || user?.username}
              name={profile?.fullName || profile?.username || user?.username}
              profileImageUrl={profile?.profileImageUrl}
              size={36}
            />
            {!isCollapsed && (
              <div className="sidebar-user-meta">
                <span className="sidebar-user-name">
                  {profile?.fullName || profile?.username || user?.username || 'Member'}
                </span>
                <span className="sidebar-user-role">
                  {isOrgAdmin ? 'Org Admin' : 'Member'}
                </span>
              </div>
            )}
            {isCollapsed && (
              <span className="nav-tooltip">
                {profile?.fullName || profile?.username || user?.username || 'Profile'}
              </span>
            )}
          </NavLink>
        </div>

        {/* Mobile-Only Actions */}
        <div className="sidebar-mobile-user-actions">
          <button
            type="button"
            className="sidebar-mobile-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}</span>
          </button>
          <button
            type="button"
            className="sidebar-mobile-logout-btn"
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            aria-label="Logout"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
