import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  AlertCircle,
  Building2,
  Ban,
  ShieldAlert,
  Search,
  UserMinus,
  ArrowRightLeft,
  Trash2,
  Settings,
  Globe,
  Lock,
  X
} from 'lucide-react';
import api from '../api/client';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import '../styles/organisation.css';

export default function ManageMembersPage() {
  const navigate = useNavigate();
  const { profile, user, loading: authLoading, fetchProfile } = useAuth() || {};
  const isOrgAdmin = (profile?.role || user?.role) === 'ORG_ADMIN' || (profile?.role || user?.role) === 'ROLE_ORG_ADMIN';

  const [activeTab, setActiveTab] = useState('MEMBERS'); // 'MEMBERS', 'INVITES', 'SETTINGS'
  const [details, setDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Member removal modal
  const [removingMember, setRemovingMember] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', visibility: 'PUBLIC' });
  const [savingSettings, setSavingSettings] = useState(false);

  // Transfer ownership modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferUserId, setTransferUserId] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Delete organisation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setRemovingMember(null);
        setShowTransferModal(false);
        setShowDeleteModal(false);
      }
    };
    if (removingMember || showTransferModal || showDeleteModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [removingMember, showTransferModal, showDeleteModal]);

  const loadData = useCallback(async () => {
    if (!isOrgAdmin) return;
    try {
      setLoading(true);
      setError(null);
      const [detailsRes, membersRes, invitationsRes] = await Promise.all([
        api.organisation.getDetails().catch(() => null),
        api.organisation.getMembers(),
        api.organisation.getInvitations()
      ]);

      if (detailsRes) {
        setDetails(detailsRes);
        setSettingsForm({
          name: detailsRes.name || '',
          description: detailsRes.description || '',
          visibility: detailsRes.visibility || 'PUBLIC'
        });
      }
      setMembers(Array.isArray(membersRes) ? membersRes : []);
      setInvitations(Array.isArray(invitationsRes) ? invitationsRes : []);
    } catch (err) {
      setError(err?.message || 'Failed to load organisation data.');
    } finally {
      setLoading(false);
    }
  }, [isOrgAdmin]);

  useEffect(() => {
    if (!authLoading && isOrgAdmin) {
      loadData();
    }
  }, [authLoading, isOrgAdmin, loadData]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.trim()) return;

    try {
      setInviting(true);
      setError(null);
      await api.organisation.inviteMember(inviteEmail.trim());
      setFeedback(`Invitation sent successfully to ${inviteEmail.trim()}.`);
      setInviteEmail('');
      await loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (invitationId) => {
    try {
      setCancellingId(invitationId);
      setError(null);
      await api.organisation.cancelInvitation(invitationId);
      setFeedback('Invitation has been cancelled.');
      await loadData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to cancel invitation.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    try {
      setRemoving(true);
      setError(null);
      await api.organisation.removeMember(removingMember.userId);
      setFeedback(`Member @${removingMember.username} has been removed from the organisation.`);
      setRemovingMember(null);
      await loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to remove member.');
    } finally {
      setRemoving(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settingsForm.name.trim()) return;

    try {
      setSavingSettings(true);
      setError(null);
      const updated = await api.organisation.updateDetails({
        name: settingsForm.name.trim(),
        description: settingsForm.description.trim() || undefined,
        visibility: settingsForm.visibility
      });
      setDetails(updated);
      setFeedback('Organisation settings updated successfully.');
      if (fetchProfile) await fetchProfile();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to update organisation settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!transferUserId) return;

    try {
      setTransferring(true);
      setError(null);
      await api.organisation.transferOwnership(Number(transferUserId));
      setFeedback('Ownership successfully transferred.');
      setShowTransferModal(false);
      if (fetchProfile) await fetchProfile();
      await loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to transfer ownership.');
    } finally {
      setTransferring(false);
    }
  };

  const handleDeleteOrganisation = async () => {
    if (deleteConfirmation !== details?.name) return;

    try {
      setDeleting(true);
      setError(null);
      await api.organisation.deleteOrganisation();
      if (fetchProfile) await fetchProfile();
      setShowDeleteModal(false);
      navigate('/organisation/discover');
    } catch (err) {
      setError(err?.message || 'Failed to delete organisation.');
      setDeleting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.username?.toLowerCase().includes(q) ||
        m.fullName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="org-status-badge pending">
            <Clock size={12} /> Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="org-status-badge accepted">
            <CheckCircle2 size={12} /> Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="org-status-badge declined">
            <XCircle size={12} /> Declined
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="org-status-badge expired">
            <Clock size={12} /> Expired
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="org-status-badge expired">
            <Ban size={12} /> Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (!authLoading && !isOrgAdmin) {
    return (
      <div className="org-dashboard-page" style={{ padding: '2rem' }}>
        <div className="org-alert error" role="alert">
          <ShieldAlert size={22} />
          <div>
            <strong>Access Denied: Organisation Admin Role Required</strong>
            <p style={{ margin: '0.2rem 0 0' }}>
              Your account does not possess the ORG_ADMIN privileges needed to manage organisation members.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const otherMembers = members.filter((m) => m.userId !== user?.id && m.userId !== profile?.userId);

  return (
    <div className="org-dashboard-page">
      <header className="org-header">
        <div className="org-header-copy">
          <span className="org-eyebrow">
            <Building2 size={16} /> ORGANISATION ADMINISTRATION
          </span>
          <div className="org-title-row">
            <h1 className="org-title">Manage Members &amp; Settings</h1>
            {details?.name && (
              <span className="org-name-badge">
                <Building2 size={13} /> {details.name}
              </span>
            )}
            {details?.visibility && (
              <span className={`visibility-badge ${details.visibility.toLowerCase()}`}>
                {details.visibility === 'PUBLIC' ? <Globe size={11} /> : <Lock size={11} />}
                {details.visibility}
              </span>
            )}
          </div>
          <p className="org-subtitle">
            Invite colleagues, manage active memberships, configure visibility, or administer organisation settings.
          </p>
        </div>

        <div className="org-actions-bar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            disabled={loading}
            title="Refresh Members"
          >
            <RotateCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/organisation')}
            title="View Organisation Dashboard"
          >
            <Building2 size={14} />
            <span>Dashboard</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="notifications-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`notifications-tab-btn ${activeTab === 'MEMBERS' ? 'active' : ''}`}
          onClick={() => setActiveTab('MEMBERS')}
        >
          <Users size={16} />
          <span>Active Members ({members.length})</span>
        </button>
        <button
          type="button"
          className={`notifications-tab-btn ${activeTab === 'INVITES' ? 'active' : ''}`}
          onClick={() => setActiveTab('INVITES')}
        >
          <Mail size={16} />
          <span>Invitations ({invitations.length})</span>
        </button>
        <button
          type="button"
          className={`notifications-tab-btn ${activeTab === 'SETTINGS' ? 'active' : ''}`}
          onClick={() => setActiveTab('SETTINGS')}
        >
          <Settings size={16} />
          <span>Organisation Settings</span>
        </button>
      </div>

      {feedback && (
        <div className="org-alert" style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d' }}>
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="org-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="org-empty-state">
          <LoadingSpinner size="lg" />
          <p>Loading members and organisation data...</p>
        </div>
      ) : activeTab === 'MEMBERS' ? (
        <div>
          {/* Invite Form Card */}
          <div className="org-filter-card" style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserPlus size={16} /> Invite New Member
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Enter a colleague&apos;s registered email to send them an invitation. They will receive an in-app notification to join {details?.name || 'your organisation'}.
            </p>
            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 280px', position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2.4rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={inviting || !inviteEmail.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', minHeight: '38px' }}
              >
                <UserPlus size={16} />
                <span>{inviting ? 'Sending...' : 'Send Invitation'}</span>
              </button>
            </form>
          </div>

          {/* Members Table */}
          <section className="org-table-card">
            <div className="org-table-header-row" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="org-card-title">Active Members Roster</h2>
                <p className="org-card-sub">
                  Colleagues enrolled in your organisation.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem 0.45rem 2rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="org-empty-state">
                <Users size={32} />
                <p>{searchQuery ? 'No members match your search criteria.' : 'No members found in this organisation.'}</p>
              </div>
            ) : (
              <div className="org-table-wrap">
                <table className="org-table" aria-label="Organisation members table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m) => {
                      const isCurrentAdmin = m.userId === user?.id || m.userId === profile?.userId;
                      return (
                        <tr key={m.userId}>
                          <td>
                            <div className="org-user-cell" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Avatar
                                avatarSeed={m.avatarSeed}
                                seed={m.avatarSeed || m.username}
                                username={m.username}
                                name={m.fullName || m.username}
                                size={34}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="org-user-name">
                                  {m.fullName || m.username}
                                </span>
                                <span className="org-user-handle">@{m.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className="visibility-badge"
                              style={{
                                background: m.role === 'ORG_ADMIN' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                color: m.role === 'ORG_ADMIN' ? '#0284c7' : '#15803d',
                                border: 'none'
                              }}
                            >
                              <ShieldCheck size={12} />
                              {m.role === 'ORG_ADMIN' ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          <td>
                            {m.joinedAt
                              ? new Date(m.joinedAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {!isCurrentAdmin ? (
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                style={{ color: '#ef4444' }}
                                onClick={() => setRemovingMember(m)}
                                title={`Remove @${m.username} from organisation`}
                              >
                                <UserMinus size={13} />
                                <span>Remove</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>You (Admin)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : activeTab === 'INVITES' ? (
        <section className="org-table-card">
          <div className="org-table-header-row">
            <div>
              <h2 className="org-card-title">Invitations History</h2>
              <p className="org-card-sub">
                Track pending invitations and cancellation actions.
              </p>
            </div>
          </div>

          {invitations.length === 0 ? (
            <div className="org-empty-state">
              <Mail size={32} />
              <p>No invitations sent yet. Invite your colleagues using the Members tab.</p>
            </div>
          ) : (
            <div className="org-table-wrap">
              <table className="org-table" aria-label="Organisation invitations table">
                <thead>
                  <tr>
                    <th>Invitee Email</th>
                    <th>Status</th>
                    <th>Invited By</th>
                    <th>Sent Date</th>
                    <th>Expires</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <strong>{inv.inviteeEmail}</strong>
                      </td>
                      <td>{getStatusBadge(inv.status)}</td>
                      <td>@{inv.invitedByUsername || 'Admin'}</td>
                      <td>
                        {inv.createdAt
                          ? new Date(inv.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td>
                        {inv.expiresAt
                          ? new Date(inv.expiresAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {inv.status === 'PENDING' ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            disabled={cancellingId === inv.id}
                            onClick={() => handleCancelInvite(inv.id)}
                            style={{ color: '#ef4444' }}
                          >
                            <Ban size={12} />
                            <span>{cancellingId === inv.id ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        /* Settings Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* General Settings */}
          <div className="org-filter-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text-main)' }}>
              General Information
            </h2>
            <form onSubmit={handleSaveSettings}>
              <div className="org-form-group">
                <label htmlFor="settings-name">Organisation Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  maxLength={150}
                  required
                />
              </div>

              <div className="org-form-group">
                <label htmlFor="settings-desc">Description</label>
                <textarea
                  id="settings-desc"
                  rows={3}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  maxLength={500}
                />
              </div>

              <div className="org-form-group">
                <label htmlFor="settings-visibility">Visibility Policy</label>
                <select
                  id="settings-visibility"
                  value={settingsForm.visibility}
                  onChange={(e) => setSettingsForm({ ...settingsForm, visibility: e.target.value })}
                >
                  <option value="PUBLIC">Public — Discoverable on community discovery page</option>
                  <option value="PRIVATE">Private — Hidden from discovery, invitation only</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={savingSettings || !settingsForm.name.trim()}
              >
                {savingSettings ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* Transfer Ownership */}
          <div className="org-filter-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowRightLeft size={18} /> Transfer Organisation Ownership
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Designate another active member of {details?.name} as the primary administrator. You will transition to an ordinary member role.
            </p>

            {otherMembers.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No other members are currently enrolled to transfer ownership to.
              </p>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowTransferModal(true)}
              >
                <ArrowRightLeft size={14} />
                <span>Transfer Ownership</span>
              </button>
            )}
          </div>

          {/* Delete Organisation */}
          <div className="org-filter-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Trash2 size={18} /> Delete Organisation
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Permanently close and archive this organisation. All member memberships and pending invitations will be terminated. Member accounts, personal activity logs, badges and achievements remain completely preserved.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
              onClick={() => {
                setDeleteConfirmation('');
                setShowDeleteModal(true);
              }}
            >
              <Trash2 size={14} />
              <span>Delete Organisation</span>
            </button>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {removingMember && (
        <div className="org-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRemovingMember(null)}>
          <div className="org-modal" role="dialog" aria-modal="true">
            <div className="org-modal-header">
              <h2>Remove Member</h2>
              <button type="button" className="btn-icon-subtle" onClick={() => setRemovingMember(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>@{removingMember.username}</strong> from {details?.name}?
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Their individual activity logs, badges, and personal profile will remain completely safe.
            </p>
            <div className="org-modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRemovingMember(null)} disabled={removing}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                onClick={handleRemoveMember}
                disabled={removing}
              >
                {removing ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="org-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowTransferModal(false)}>
          <div className="org-modal" role="dialog" aria-modal="true">
            <div className="org-modal-header">
              <h2>Transfer Ownership</h2>
              <button type="button" className="btn-icon-subtle" onClick={() => setShowTransferModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTransferOwnership}>
              <div className="org-form-group">
                <label htmlFor="transfer-select">Select New Administrator</label>
                <select
                  id="transfer-select"
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a member --</option>
                  {otherMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      @{m.username} {m.fullName ? `(${m.fullName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="org-modal-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTransferModal(false)} disabled={transferring}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={transferring || !transferUserId}>
                  {transferring ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Organisation Modal */}
      {showDeleteModal && (
        <div className="org-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="org-modal" role="dialog" aria-modal="true">
            <div className="org-modal-header">
              <h2 style={{ color: '#ef4444' }}>Confirm Organisation Deletion</h2>
              <button type="button" className="btn-icon-subtle" onClick={() => setShowDeleteModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              This will close <strong>{details?.name}</strong> and remove all member associations. To confirm, please type the exact organisation name below:
            </p>
            <div className="org-form-group">
              <input
                type="text"
                placeholder={details?.name}
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </div>
            <div className="org-modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                onClick={handleDeleteOrganisation}
                disabled={deleting || deleteConfirmation !== details?.name}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
