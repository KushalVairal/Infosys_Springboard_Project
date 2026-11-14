import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Building2,
  Award,
  Trophy,
  Sparkles,
  Clock,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import '../styles/notifications.css';

function formatNotificationTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function NotificationsPage() {
  const { fetchProfile } = useAuth() || {};
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNREAD, INVITATIONS, ACHIEVEMENTS, LEADERBOARD
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    browserNotificationsEnabled: false,
    emailNotificationsEnabled: true,
    invitationAlerts: true,
    badgeAlerts: true,
    achievementAlerts: true,
    leaderboardAlerts: true
  });
  const [permissionMessage, setPermissionMessage] = useState('');

  // Close preferences modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPreferences) {
        setShowPreferences(false);
      }
    };
    if (showPreferences) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPreferences]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [list, countRes] = await Promise.all([
        api.notifications.getMyNotifications(),
        api.notifications.getUnreadCount()
      ]);
      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(Number(countRes?.unreadCount || 0));
    } catch (err) {
      setError(err?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await api.notifications.getPreferences();
      if (prefs) setPreferences(prefs);
    } catch {
      // Preferences failure non-blocking
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [loadNotifications, loadPreferences]);

  const handleMarkAsRead = async (id) => {
    try {
      const updated = await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: updated.readAt } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('carbontrack:notifications-changed'));
    } catch (err) {
      setError(err?.message || 'Failed to mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('carbontrack:notifications-changed'));
      setFeedback('All notifications marked as read.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.notifications.delete(id);
      setNotifications((prev) => {
        const item = prev.find((n) => n.id === id);
        if (item && !item.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
      window.dispatchEvent(new CustomEvent('carbontrack:notifications-changed'));
    } catch (err) {
      setError(err?.message || 'Failed to delete notification.');
    }
  };

  const handleAcceptInvitation = async (invitationId, notificationId) => {
    try {
      setActionLoadingId(notificationId);
      setError(null);
      const res = await api.organisation.acceptInvitation(invitationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId || (n.relatedEntityId === invitationId && n.notificationType === 'ORGANISATION_INVITATION')
            ? {
                ...n,
                notificationType: 'INVITATION_ACCEPTED',
                title: 'Joined ' + (res?.organisationName || 'Organisation'),
                message: `You accepted the invitation and successfully joined ${res?.organisationName || 'the organisation'}.`,
                isRead: true
              }
            : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (fetchProfile) {
        await fetchProfile();
      }
      setFeedback('Congratulations! You have successfully joined the organisation.');
      window.dispatchEvent(new CustomEvent('carbontrack:notifications-changed'));
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setError(err?.message || 'Failed to accept organisation invitation.');
      loadNotifications();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectInvitation = async (invitationId, notificationId) => {
    try {
      setActionLoadingId(notificationId);
      setError(null);
      await api.organisation.rejectInvitation(invitationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId || (n.relatedEntityId === invitationId && n.notificationType === 'ORGANISATION_INVITATION')
            ? {
                ...n,
                notificationType: 'INVITATION_REJECTED',
                title: 'Invitation Declined',
                message: 'You declined the invitation to join this organisation.',
                isRead: true
              }
            : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      setFeedback('Organisation invitation declined.');
      window.dispatchEvent(new CustomEvent('carbontrack:notifications-changed'));
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setError(err?.message || 'Failed to decline organisation invitation.');
      loadNotifications();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      setPermissionMessage('This browser does not support desktop notifications.');
      return;
    }

    if (!preferences.browserNotificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const updated = { ...preferences, browserNotificationsEnabled: true };
        setPreferences(updated);
        await api.notifications.updatePreferences(updated);
        setPermissionMessage('Browser notifications enabled successfully!');
        new Notification('CarbonTrack', {
          body: 'Browser notifications are now active for CarbonTrack.'
        });
      } else {
        setPermissionMessage(
          'Browser notifications permission was denied. To enable them, click the padlock/settings icon in your browser address bar and allow notifications.'
        );
      }
    } else {
      const updated = { ...preferences, browserNotificationsEnabled: false };
      setPreferences(updated);
      await api.notifications.updatePreferences(updated);
      setPermissionMessage('Browser notifications disabled.');
    }
  };

  const handleSavePreferences = async (updated) => {
    setPreferences(updated);
    try {
      await api.notifications.updatePreferences(updated);
    } catch (err) {
      setError('Failed to save notification preferences.');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'UNREAD') return !n.isRead;
      if (activeTab === 'INVITATIONS') return n.notificationType === 'ORGANISATION_INVITATION';
      if (activeTab === 'ACHIEVEMENTS')
        return n.notificationType === 'BADGE_EARNED' || n.notificationType === 'ACHIEVEMENT_UNLOCKED';
      if (activeTab === 'LEADERBOARD') return n.notificationType === 'LEADERBOARD_POSITION';
      return true;
    });
  }, [notifications, activeTab]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORGANISATION_INVITATION':
      case 'INVITATION_ACCEPTED':
      case 'INVITATION_REJECTED':
        return <Building2 size={20} />;
      case 'BADGE_EARNED':
        return <Award size={20} />;
      case 'ACHIEVEMENT_UNLOCKED':
        return <Trophy size={20} />;
      case 'LEADERBOARD_POSITION':
        return <Sparkles size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getIconClass = (type) => {
    switch (type) {
      case 'ORGANISATION_INVITATION':
      case 'INVITATION_ACCEPTED':
      case 'INVITATION_REJECTED':
        return 'invitation';
      case 'BADGE_EARNED':
        return 'badge';
      case 'ACHIEVEMENT_UNLOCKED':
        return 'achievement';
      case 'LEADERBOARD_POSITION':
        return 'leaderboard';
      default:
        return 'system';
    }
  };

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-left">
          <h1>
            <Bell size={26} color="var(--color-primary, #22c55e)" />
            Notifications
            {unreadCount > 0 && (
              <span className="notifications-unread-pill">{unreadCount} new</span>
            )}
          </h1>
          <p>Stay updated on organisation invitations, badge recognitions, and community achievements.</p>
        </div>
        <div className="notifications-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleMarkAllAsRead}
              title="Mark all notifications as read"
            >
              <CheckCheck size={16} />
              <span>Mark All Read</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadNotifications}
            title="Refresh notifications"
          >
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowPreferences(true)}
            title="Notification Settings"
          >
            <Settings size={16} />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* Success / Feedback Alert */}
      {feedback && (
        <div className="org-alert success" role="alert" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="org-alert error" role="alert" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="notifications-tabs">
        <button
          type="button"
          className={`notifications-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          All
          <span className="notifications-tab-badge">{notifications.length}</span>
        </button>
        <button
          type="button"
          className={`notifications-tab-btn ${activeTab === 'UNREAD' ? 'active' : ''}`}
          onClick={() => setActiveTab('UNREAD')}
        >
          Unread
          {unreadCount > 0 && <span className="notifications-tab-badge">{unreadCount}</span>}
        </button>
        <button
          type="button"
          className={`notifications-tab-btn ${activeTab === 'INVITATIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('INVITATIONS')}
        >
          Invitations
        </button>
        <button
          type="button"
          className={`notifications-tab-btn ${activeTab === 'ACHIEVEMENTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('ACHIEVEMENTS')}
        >
          Badges & Rewards
        </button>
        <button
          type="button"
          className={`notifications-tab-btn ${activeTab === 'LEADERBOARD' ? 'active' : ''}`}
          onClick={() => setActiveTab('LEADERBOARD')}
        >
          Leaderboard
        </button>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="org-empty-state">
          <LoadingSpinner size="lg" />
          <p>Loading your notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title={activeTab === 'UNREAD' ? 'No Unread Notifications' : 'No Notifications Found'}
          description={
            activeTab === 'UNREAD'
              ? 'You have caught up with all your notifications!'
              : 'When you receive organisation invitations, milestone badges, or community achievements, they will appear here.'
          }
          icon={<Bell size={42} color="var(--color-primary, #22c55e)" />}
        />
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((n) => {
            const isInvitation = n.notificationType === 'ORGANISATION_INVITATION';
            const isInvitationAccepted = n.notificationType === 'INVITATION_ACCEPTED';
            const isInvitationRejected = n.notificationType === 'INVITATION_REJECTED';
            const isAchievement =
              n.notificationType === 'BADGE_EARNED' || n.notificationType === 'ACHIEVEMENT_UNLOCKED';
            const isLeaderboard = n.notificationType === 'LEADERBOARD_POSITION';

            return (
              <div key={n.id} className={`notification-card ${!n.isRead ? 'unread' : ''}`}>
                <div className={`notification-icon-wrapper ${getIconClass(n.notificationType)}`}>
                  {getNotificationIcon(n.notificationType)}
                </div>

                <div className="notification-body">
                  <div className="notification-meta">
                    <h3 className="notification-title">{n.title}</h3>
                    <span className="notification-time">
                      <Clock size={13} />
                      {formatNotificationTime(n.createdAt)}
                    </span>
                  </div>

                  <p className="notification-message">{n.message}</p>

                  <div className="notification-actions">
                    {/* Status badge for accepted invitation */}
                    {isInvitationAccepted && (
                      <span className="org-status-badge accepted">
                        <CheckCircle2 size={14} /> ACCEPTED · Member
                      </span>
                    )}

                    {/* Status badge for declined invitation */}
                    {isInvitationRejected && (
                      <span className="org-status-badge declined">
                        <X size={14} /> DECLINED
                      </span>
                    )}

                    {/* Action buttons for Invitation notifications */}
                    {isInvitation && n.relatedEntityId && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          disabled={actionLoadingId === n.id}
                          onClick={() => handleAcceptInvitation(n.relatedEntityId, n.id)}
                        >
                          <Check size={14} />
                          <span>Accept Invitation</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          disabled={actionLoadingId === n.id}
                          onClick={() => handleRejectInvitation(n.relatedEntityId, n.id)}
                        >
                          <X size={14} />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {/* View Achievements */}
                    {isAchievement && (
                      <Link to="/achievements" className="btn btn-secondary btn-xs" onClick={() => !n.isRead && handleMarkAsRead(n.id)}>
                        <Award size={14} />
                        <span>View Achievements</span>
                      </Link>
                    )}

                    {/* View Leaderboard */}
                    {isLeaderboard && (
                      <Link to="/leaderboard" className="btn btn-secondary btn-xs" onClick={() => !n.isRead && handleMarkAsRead(n.id)}>
                        <Trophy size={14} />
                        <span>View Leaderboard</span>
                      </Link>
                    )}

                    {/* Card Actions (Mark read, Delete) */}
                    <div className="notification-card-buttons">
                      {!n.isRead && (
                        <button
                          type="button"
                          className="btn-icon-subtle"
                          onClick={() => handleMarkAsRead(n.id)}
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-icon-subtle delete"
                        onClick={() => handleDelete(n.id)}
                        title="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="pref-modal-overlay" onClick={() => setShowPreferences(false)}>
          <div className="pref-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pref-modal-header">
              <h2>Notification Preferences</h2>
              <button
                type="button"
                className="btn-icon-subtle"
                onClick={() => setShowPreferences(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {permissionMessage && (
              <div className="org-alert warning" role="alert" style={{ marginBottom: '1rem' }}>
                <span>{permissionMessage}</span>
              </div>
            )}

            <div className="pref-section">
              <div className="pref-row">
                <div className="pref-info">
                  <h4>Browser Desktop Notifications</h4>
                  <p>Receive real-time push alerts while the CarbonTrack app is open.</p>
                </div>
                <label className="pref-switch">
                  <input
                    type="checkbox"
                    checked={preferences.browserNotificationsEnabled}
                    onChange={handleToggleBrowserNotifications}
                  />
                  <span className="pref-slider" />
                </label>
              </div>

              <div className="pref-row">
                <div className="pref-info">
                  <h4>Email Notifications</h4>
                  <p>Receive email summaries for critical sustainability updates.</p>
                </div>
                <label className="pref-switch">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotificationsEnabled}
                    onChange={(e) =>
                      handleSavePreferences({ ...preferences, emailNotificationsEnabled: e.target.checked })
                    }
                  />
                  <span className="pref-slider" />
                </label>
              </div>
            </div>

            <div className="pref-section">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.8rem', color: 'var(--text-primary)' }}>
                In-App Alert Categories
              </h3>

              <div className="pref-row">
                <div className="pref-info">
                  <h4>Organisation Invitations</h4>
                  <p>Alerts when an Organisation Admin invites you to join their team.</p>
                </div>
                <label className="pref-switch">
                  <input
                    type="checkbox"
                    checked={preferences.invitationAlerts}
                    onChange={(e) =>
                      handleSavePreferences({ ...preferences, invitationAlerts: e.target.checked })
                    }
                  />
                  <span className="pref-slider" />
                </label>
              </div>

              <div className="pref-row">
                <div className="pref-info">
                  <h4>Milestone Badges</h4>
                  <p>Alerts when you unlock streak or carbon reduction badges.</p>
                </div>
                <label className="pref-switch">
                  <input
                    type="checkbox"
                    checked={preferences.badgeAlerts}
                    onChange={(e) =>
                      handleSavePreferences({ ...preferences, badgeAlerts: e.target.checked })
                    }
                  />
                  <span className="pref-slider" />
                </label>
              </div>

              <div className="pref-row">
                <div className="pref-info">
                  <h4>Leaderboard Rewards</h4>
                  <p>Alerts when you reach the top 3 and unlock Leaf medal achievements.</p>
                </div>
                <label className="pref-switch">
                  <input
                    type="checkbox"
                    checked={preferences.achievementAlerts}
                    onChange={(e) =>
                      handleSavePreferences({ ...preferences, achievementAlerts: e.target.checked })
                    }
                  />
                  <span className="pref-slider" />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowPreferences(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

