import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  PlusCircle,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  LogOut,
  Calendar,
  X,
  ShieldCheck
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import '../styles/organisation.css';

export default function OrganisationDiscoveryPage() {
  const navigate = useNavigate();
  const { profile, user, fetchProfile } = useAuth() || {};

  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [joiningId, setJoiningId] = useState(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    visibility: 'PUBLIC'
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Leave Org State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setShowLeaveModal(false);
      }
    };
    if (showCreateModal || showLeaveModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showCreateModal, showLeaveModal]);

  const currentOrgId = profile?.organisationId || user?.organisationId || (typeof user?.organisation === 'object' ? user?.organisation?.id : null);
  const currentOrgName = profile?.organisationName || (typeof user?.organisation === 'string' ? user?.organisation : user?.organisation?.name);
  const hasOrganisation = Boolean(currentOrgId || currentOrgName);
  const isAdmin = (profile?.role || user?.role) === 'ORG_ADMIN' || (profile?.role || user?.role) === 'ROLE_ORG_ADMIN';

  const loadPublicOrganisations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.organisation.getPublicOrganisations();
      setOrganisations(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err?.message || 'Failed to load public organisations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublicOrganisations();
  }, [loadPublicOrganisations]);

  const handleJoin = async (orgId, orgName) => {
    if (hasOrganisation) return;
    try {
      setJoiningId(orgId);
      setError(null);
      await api.organisation.joinOrganisation(orgId);
      if (fetchProfile) {
        await fetchProfile();
      }
      setFeedback(`Congratulations! You have joined ${orgName}.`);
      window.dispatchEvent(new CustomEvent('carbontrack:notifications-changed'));
      await loadPublicOrganisations();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setError(err?.message || 'Failed to join organisation.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      setCreating(true);
      setCreateError(null);
      const newOrg = await api.organisation.createOrganisation({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        visibility: createForm.visibility
      });

      if (fetchProfile) {
        await fetchProfile();
      }

      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', visibility: 'PUBLIC' });
      setFeedback(`Organisation "${newOrg.name}" created successfully! You are now its administrator.`);
      window.dispatchEvent(new CustomEvent('carbontrack:notifications-changed'));
      navigate('/organisation/members');
    } catch (err) {
      setCreateError(err?.message || 'Failed to create organisation.');
    } finally {
      setCreating(false);
    }
  };

  const handleLeave = async () => {
    try {
      setLeaving(true);
      setError(null);
      await api.organisation.leaveOrganisation();
      if (fetchProfile) {
        await fetchProfile();
      }
      setShowLeaveModal(false);
      setFeedback('You have successfully left your organisation.');
      window.dispatchEvent(new CustomEvent('carbontrack:notifications-changed'));
      await loadPublicOrganisations();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setError(err?.message || 'Failed to leave organisation.');
      setShowLeaveModal(false);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <main className="org-discovery-page">
      <header className="org-header">
        <div className="org-header-copy">
          <span className="org-eyebrow">
            <Globe size={15} /> COMMUNITY ORGANISATIONS
          </span>
          <div className="org-title-row">
            <h1 className="org-title">Discover Organisations</h1>
          </div>
          <p className="org-subtitle">
            Find and join public climate-action organisations, or create your own enterprise community.
          </p>
        </div>

        <div className="org-actions-bar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadPublicOrganisations}
            disabled={loading}
          >
            <RotateCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          {!hasOrganisation ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setCreateError(null);
                setShowCreateModal(true);
              }}
            >
              <PlusCircle size={15} />
              <span>Create Organisation</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ color: '#ef4444' }}
              onClick={() => setShowLeaveModal(true)}
            >
              <LogOut size={14} />
              <span>Leave Organisation</span>
            </button>
          )}
        </div>
      </header>

      {/* Current Membership Banner */}
      {hasOrganisation && (
        <div className="org-current-membership-alert">
          <ShieldCheck size={20} style={{ color: 'var(--forest-primary)', flexShrink: 0 }} />
          <div className="org-current-membership-info">
            <strong>Current Organisation: {currentOrgName}</strong>
            <p>
              You are currently an active member of {currentOrgName}. CarbonTrack policy allows membership in exactly one active organisation at a time.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-xs org-current-membership-btn"
            onClick={() => navigate(isAdmin ? '/organisation/members' : '/organisation')}
          >
            View Dashboard
          </button>
        </div>
      )}

      {/* Feedback & Error Alerts */}
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
          <p>Discovering public organisations...</p>
        </div>
      ) : organisations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No public organisations found"
          message="Be the first to create a public organisation and inspire your peers to log lower emissions!"
          actionLabel={!hasOrganisation ? "Create an Organisation" : undefined}
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="org-discovery-grid">
          {organisations.map((org) => {
            const isMyOrg = hasOrganisation && (currentOrgId === org.id || currentOrgName === org.name);

            return (
              <article key={org.id} className="org-discovery-card">
                <div>
                  <div className="org-card-header">
                    <div className="org-card-title-group">
                      <h3>{org.name}</h3>
                      <span className="visibility-badge public">
                        <Globe size={11} /> Public
                      </span>
                    </div>
                    {isMyOrg && (
                      <span className="org-status-badge accepted">
                        <CheckCircle2 size={12} /> Your Org
                      </span>
                    )}
                  </div>

                  <p className="org-card-desc">
                    {org.description || 'No description provided for this organisation.'}
                  </p>
                </div>

                <div className="org-card-footer">
                  <div className="org-meta-info">
                    <span>
                      <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {org.memberCount} {Number(org.memberCount) === 1 ? 'member' : 'members'}
                    </span>
                    <span>Created by @{org.creatorUsername}</span>
                  </div>

                  {!hasOrganisation ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      disabled={joiningId === org.id}
                      onClick={() => handleJoin(org.id, org.name)}
                    >
                      {joiningId === org.id ? 'Joining...' : 'Join Organisation'}
                    </button>
                  ) : isMyOrg ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => navigate('/organisation')}
                    >
                      Open
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      disabled
                      title="You must leave your current organisation to join another."
                    >
                      Join
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create Organisation Modal */}
      {showCreateModal && (
        <div className="org-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="org-modal" role="dialog" aria-modal="true" aria-labelledby="create-org-title">
            <div className="org-modal-header">
              <h2 id="create-org-title">Create Organisation</h2>
              <button
                type="button"
                className="btn-icon-subtle"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="org-alert error" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.82rem' }}>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="org-form-group">
                <label htmlFor="org-name">Organisation Name *</label>
                <input
                  id="org-name"
                  type="text"
                  placeholder="e.g., EcoTech Solutions"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  maxLength={150}
                  required
                />
              </div>

              <div className="org-form-group">
                <label htmlFor="org-desc">Description</label>
                <textarea
                  id="org-desc"
                  rows={3}
                  placeholder="Describe your organisation's sustainability mission..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  maxLength={500}
                />
              </div>

              <div className="org-form-group">
                <label htmlFor="org-visibility">Visibility Type *</label>
                <select
                  id="org-visibility"
                  value={createForm.visibility}
                  onChange={(e) => setCreateForm({ ...createForm, visibility: e.target.value })}
                >
                  <option value="PUBLIC">Public — Discoverable by all CarbonTrack members</option>
                  <option value="PRIVATE">Private — Invitation only, hidden from discovery</option>
                </select>
                <span className="org-form-help">
                  Private organisations do not appear in public searches and require explicit invitation.
                </span>
              </div>

              <div className="org-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={creating || !createForm.name.trim()}
                >
                  {creating ? 'Creating...' : 'Create & Become Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Organisation Modal */}
      {showLeaveModal && (
        <div className="org-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowLeaveModal(false)}>
          <div className="org-modal" role="dialog" aria-modal="true">
            <div className="org-modal-header">
              <h2>Leave Organisation</h2>
              <button
                type="button"
                className="btn-icon-subtle"
                onClick={() => setShowLeaveModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              Are you sure you want to leave <strong>{currentOrgName}</strong>?
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Your account, historical activity logs, badges and achievements will remain completely intact. You will no longer appear on {currentOrgName}&apos;s internal leaderboard.
            </p>

            <div className="org-modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowLeaveModal(false)}
                disabled={leaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                onClick={handleLeave}
                disabled={leaving}
              >
                {leaving ? 'Leaving...' : 'Confirm Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

