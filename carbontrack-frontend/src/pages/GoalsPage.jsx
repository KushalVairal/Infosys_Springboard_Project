import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  X
} from 'lucide-react';

export default function GoalsPage() {
  const { preferredUnit } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [modalForm, setModalForm] = useState(() => ({
    title: '',
    description: '',
    targetCo2eKg: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'ACTIVE'
  }));
  const [modalError, setModalError] = useState('');
  const [modalFieldErrors, setModalFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const isTonnes = preferredUnit === 'TONNES_CO2E';
  const unitLabel = isTonnes ? 'Tonnes CO₂e' : 'kg CO₂e';

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await api.goals.getMyGoals();
      setGoals(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to retrieve your sustainability goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreateModal = () => {
    setEditingGoal(null);
    setModalForm({
      title: '',
      description: '',
      targetCo2eKg: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'ACTIVE'
    });
    setModalError('');
    setModalFieldErrors({});
    setModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    // If user prefers tonnes, display converted value in form
    const displayTarget = isTonnes
      ? (Number(goal.targetCo2eKg) / 1000).toFixed(3)
      : Number(goal.targetCo2eKg).toString();

    setModalForm({
      title: goal.title || '',
      description: goal.description || '',
      targetCo2eKg: displayTarget,
      startDate: goal.startDate || '',
      endDate: goal.endDate || '',
      status: goal.status || 'ACTIVE'
    });
    setModalError('');
    setModalFieldErrors({});
    setModalOpen(true);
  };

  const handleFormFieldChange = (field, value) => {
    setModalForm((prev) => ({ ...prev, [field]: value }));
    if (modalFieldErrors[field]) {
      setModalFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (modalError) setModalError('');
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalFieldErrors({});

    const errors = {};
    if (!modalForm.title.trim()) {
      errors.title = 'Goal title is required.';
    }

    const rawTarget = Number(modalForm.targetCo2eKg);
    if (isNaN(rawTarget) || rawTarget <= 0) {
      errors.targetCo2eKg = 'Target emissions budget must be greater than zero.';
    }

    if (!modalForm.startDate) {
      errors.startDate = 'Start date is required.';
    }
    if (!modalForm.endDate) {
      errors.endDate = 'End date is required.';
    }

    if (modalForm.startDate && modalForm.endDate && new Date(modalForm.endDate) < new Date(modalForm.startDate)) {
      errors.endDate = 'End date cannot be earlier than start date.';
    }

    if (Object.keys(errors).length > 0) {
      setModalFieldErrors(errors);
      setModalError(Object.values(errors)[0]);
      return;
    }

    // Convert back to kg if entered as tonnes
    const targetInKg = isTonnes ? rawTarget * 1000 : rawTarget;

    setIsSubmitting(true);
    try {
      if (editingGoal) {
        await api.goals.update(editingGoal.id, {
          title: modalForm.title.trim(),
          description: modalForm.description.trim(),
          targetCo2eKg: targetInKg,
          startDate: modalForm.startDate,
          endDate: modalForm.endDate,
          status: modalForm.status
        });
        setActionSuccess('Goal updated successfully!');
      } else {
        await api.goals.create({
          title: modalForm.title.trim(),
          description: modalForm.description.trim(),
          targetCo2eKg: targetInKg,
          startDate: modalForm.startDate,
          endDate: modalForm.endDate
        });
        setActionSuccess('New sustainability goal created!');
      }

      setModalOpen(false);
      await fetchGoals();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Operation failed. Please review inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to remove this sustainability goal?')) {
      return;
    }

    try {
      await api.goals.delete(id);
      setActionSuccess('Goal removed successfully.');
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to remove goal.');
    }
  };

  const filteredGoals = useMemo(() => {
    if (activeFilter === 'ALL') return goals;
    return goals.filter((g) => (g.status || 'ACTIVE').toUpperCase() === activeFilter);
  }, [goals, activeFilter]);

  const stats = useMemo(() => {
    const total = goals.length;
    const active = goals.filter((g) => g.status === 'ACTIVE').length;
    const completed = goals.filter((g) => g.status === 'COMPLETED').length;
    const overdue = goals.filter((g) => g.status === 'OVERDUE' || g.status === 'EXCEEDED').length;
    return { total, active, completed, overdue };
  }, [goals]);

  if (loading) {
    return (
      <div className="page-loading-wrapper">
        <LoadingSpinner message="Loading your sustainability goals and live progress..." size="lg" />
      </div>
    );
  }

  return (
    <div className="goals-page">
      <div className="goals-page-header">
        <div>
          <h1 className="page-heading">Sustainability Goals & Emission Budgets</h1>
          <p className="page-subheading">
            Set custom carbon reduction budgets. Live progress is automatically calculated from your authenticated activity logs.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-md"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          <span>New Goal</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="auth-alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="dashboard-alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-title">Total Goals</span>
          <div className="metric-body">
            <span className="metric-value">{stats.total}</span>
            <span className="metric-unit">targets</span>
          </div>
          <span className="metric-subtext">All time user-defined goals</span>
        </div>

        <div className="metric-card">
          <span className="metric-title">Active Goals</span>
          <div className="metric-body">
            <span className="metric-value text-emerald">{stats.active}</span>
            <span className="metric-unit">in progress</span>
          </div>
          <span className="metric-subtext">Currently ongoing periods</span>
        </div>

        <div className="metric-card">
          <span className="metric-title">Completed Successfully</span>
          <div className="metric-body">
            <span className="metric-value text-forest">{stats.completed}</span>
            <span className="metric-unit">achieved</span>
          </div>
          <span className="metric-subtext">Stayed within carbon target</span>
        </div>

        <div className="metric-card">
          <span className="metric-title">Attention Needed</span>
          <div className="metric-body">
            <span className="metric-value text-coral">{stats.overdue}</span>
            <span className="metric-unit">exceeded</span>
          </div>
          <span className="metric-subtext">Overdue or over target budget</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="goals-filter-bar">
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All Goals ({stats.total})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ACTIVE')}
          >
            Active ({stats.active})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('COMPLETED')}
          >
            Completed ({stats.completed})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'OVERDUE' ? 'active' : ''}`}
            onClick={() => setActiveFilter('OVERDUE')}
          >
            Overdue / Exceeded ({stats.overdue})
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length > 0 ? (
        <div className="goals-cards-grid">
          {filteredGoals.map((g) => {
            const currentKg = Number(g.currentCo2eKg) || 0;
            const targetKg = Number(g.targetCo2eKg) || 1;
            const pct = Math.min(100, Math.round(g.progressPercentage || (currentKg / targetKg) * 100));

            const displayCurrent = isTonnes ? (currentKg / 1000).toFixed(3) : currentKg.toFixed(2);
            const displayTarget = isTonnes ? (targetKg / 1000).toFixed(3) : targetKg.toFixed(2);

            let statusClass = 'status-active';
            let statusLabel = 'Active';
            if (g.status === 'COMPLETED') {
              statusClass = 'status-completed';
              statusLabel = 'Completed';
            } else if (g.status === 'OVERDUE') {
              statusClass = 'status-overdue';
              statusLabel = 'Overdue';
            } else if (g.status === 'EXCEEDED') {
              statusClass = 'status-exceeded';
              statusLabel = 'Budget Exceeded';
            } else if (g.status === 'CANCELLED') {
              statusClass = 'status-cancelled';
              statusLabel = 'Deactivated';
            }

            return (
              <div key={g.id} className="goal-item-card">
                <div className="goal-card-top">
                  <div className="goal-card-header-left">
                    <span className={`goal-status-badge ${statusClass}`}>
                      {g.status === 'COMPLETED' ? (
                        <CheckCircle2 size={13} />
                      ) : g.status === 'OVERDUE' || g.status === 'EXCEEDED' ? (
                        <AlertCircle size={13} />
                      ) : (
                        <Clock size={13} />
                      )}
                      <span>{statusLabel}</span>
                    </span>
                    <h3 className="goal-item-title">{g.title}</h3>
                  </div>
                  <div className="goal-card-actions">
                    <button
                      type="button"
                      className="goal-icon-btn"
                      title="Edit Goal"
                      onClick={() => openEditModal(g)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="goal-icon-btn danger"
                      title="Delete Goal"
                      onClick={() => handleDeleteGoal(g.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {g.description && <p className="goal-item-desc">{g.description}</p>}

                <div className="goal-dates-row">
                  <Calendar size={14} />
                  <span>
                    {g.startDate} ➔ {g.endDate}
                  </span>
                </div>

                {/* Progress Bar & Numerical Target */}
                <div className="goal-progress-box">
                  <div className="goal-progress-header">
                    <span className="goal-current-val">
                      <strong>{displayCurrent}</strong> {unitLabel} emitted
                    </span>
                    <span className="goal-target-val">
                      Target Budget: <strong>{displayTarget}</strong> {unitLabel}
                    </span>
                  </div>

                  <div className="goal-meter-track">
                    <div
                      className={`goal-meter-fill ${
                        pct > 90 ? 'critical' : pct > 70 ? 'warning' : 'safe'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="goal-progress-footer">
                    <span>
                      {pct >= 100
                        ? '100% of budget exhausted'
                        : `${(100 - pct).toFixed(0)}% budget remaining`}
                    </span>
                    <span className="goal-pct-text">{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No sustainability goals found"
          description={
            activeFilter === 'ALL'
              ? 'You have not created any sustainability goals yet. Establish target budgets to hold yourself accountable!'
              : `No goals found with status "${activeFilter}".`
          }
          actionText={activeFilter === 'ALL' ? 'Create Your First Goal' : 'Clear Filter'}
          onAction={() => (activeFilter === 'ALL' ? openCreateModal() : setActiveFilter('ALL'))}
        />
      )}

      {/* Create / Edit Goal Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setModalOpen(false)}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-bubble">
                  <Target size={22} color="var(--forest-primary)" />
                </span>
                <div>
                  <h2 className="modal-title">{editingGoal ? 'Edit Sustainability Goal' : 'Set Sustainability Goal'}</h2>
                  <p className="modal-subtitle">Define an emissions budget and tracking timeframe.</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="auth-alert alert-error modal-alert-banner" role="alert">
                <AlertCircle size={18} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="modal-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="goal-title">
                  <span>Goal Title <span className="text-coral">*</span></span>
                </label>
                <input
                  id="goal-title"
                  type="text"
                  className={`form-input ${modalFieldErrors.title ? 'has-error' : ''}`}
                  placeholder="e.g. Keep Monthly Footprint under 100kg"
                  value={modalForm.title}
                  onChange={(e) => handleFormFieldChange('title', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                {modalFieldErrors.title ? (
                  <span className="field-error-message">{modalFieldErrors.title}</span>
                ) : (
                  <span className="field-hint">A clear name describing your sustainability target.</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="goal-desc">
                  <span>Description <span className="label-optional">(Optional)</span></span>
                </label>
                <input
                  id="goal-desc"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Focus on taking the train instead of driving"
                  value={modalForm.description}
                  onChange={(e) => handleFormFieldChange('description', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="goal-target">
                  <span>Target Emission Budget ({unitLabel}) <span className="text-coral">*</span></span>
                </label>
                <input
                  id="goal-target"
                  type="number"
                  step="any"
                  min="0.01"
                  className={`form-input ${modalFieldErrors.targetCo2eKg ? 'has-error' : ''}`}
                  placeholder={isTonnes ? '0.15' : '150'}
                  value={modalForm.targetCo2eKg}
                  onChange={(e) => handleFormFieldChange('targetCo2eKg', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                {modalFieldErrors.targetCo2eKg ? (
                  <span className="field-error-message">{modalFieldErrors.targetCo2eKg}</span>
                ) : (
                  <span className="field-hint">Maximum allowable carbon emissions across the goal period.</span>
                )}
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-start">
                    <span>Start Date <span className="text-coral">*</span></span>
                  </label>
                  <input
                    id="goal-start"
                    type="date"
                    className={`form-input ${modalFieldErrors.startDate ? 'has-error' : ''}`}
                    value={modalForm.startDate}
                    onChange={(e) => handleFormFieldChange('startDate', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  {modalFieldErrors.startDate && (
                    <span className="field-error-message">{modalFieldErrors.startDate}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="goal-end">
                    <span>Target End Date <span className="text-coral">*</span></span>
                  </label>
                  <input
                    id="goal-end"
                    type="date"
                    className={`form-input ${modalFieldErrors.endDate ? 'has-error' : ''}`}
                    value={modalForm.endDate}
                    onChange={(e) => handleFormFieldChange('endDate', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  {modalFieldErrors.endDate && (
                    <span className="field-error-message">{modalFieldErrors.endDate}</span>
                  )}
                </div>
              </div>

              {editingGoal && (
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-status">
                    <span>Status</span>
                  </label>
                  <select
                    id="goal-status"
                    className="form-select"
                    value={modalForm.status}
                    onChange={(e) => handleFormFieldChange('status', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled / Deactivated</option>
                  </select>
                </div>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" message="" />
                  ) : (
                    <span>{editingGoal ? 'Save Changes' : 'Create Goal'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
