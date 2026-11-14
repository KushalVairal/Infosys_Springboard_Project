import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Car,
  Utensils,
  Trash2,
  Droplet,
  ShoppingBag,
  TrendingDown,
  CheckCircle2,
  Play,
  Bot,
  X,
  AlertCircle,
  HelpCircle,
  Target
} from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import '../styles/recommendations.css';

const CATEGORY_FILTERS = [
  { id: 'ALL', label: 'All Active' },
  { id: 'ENERGY', label: 'Energy', icon: Zap },
  { id: 'TRANSPORT', label: 'Transport', icon: Car },
  { id: 'FOOD', label: 'Food', icon: Utensils },
  { id: 'SHOPPING', label: 'Shopping', icon: ShoppingBag }
];

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat && CATEGORY_FILTERS.some(f => f.id === cat.toUpperCase())) {
      return cat.toUpperCase();
    }
    return 'ALL';
  };

  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync category if URL parameter changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat && CATEGORY_FILTERS.some(f => f.id === cat.toUpperCase())) {
      setSelectedCategory(cat.toUpperCase());
    }
  }, [location.search]);

  // Modal for Start Action -> Link Goal
  const [activeModalRec, setActiveModalRec] = useState(null);
  const [goalForm, setGoalForm] = useState({
    goalTitle: '',
    targetCo2eKg: '',
    period: 'WEEKLY',
    durationDays: 14
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isHistory = selectedCategory === 'HISTORY';
      const statusParam = isHistory ? 'HISTORY' : 'ACTIVE';
      const catParam = isHistory ? 'ALL' : selectedCategory;

      const data = await api.recommendations.getAll(catParam, statusParam);
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleOpenActionModal = (rec) => {
    setActiveModalRec(rec);
    const defaultTarget = rec.estimatedSavingsKg && Number(rec.estimatedSavingsKg) > 0
      ? (Number(rec.estimatedSavingsKg) * 2).toFixed(1)
      : '20.0';

    setGoalForm({
      goalTitle: `Action: ${rec.title}`,
      targetCo2eKg: defaultTarget,
      period: 'WEEKLY',
      durationDays: rec.timeframe?.includes('month') ? 30 : 14
    });
  };

  const handleConfirmStartAction = async (e) => {
    e.preventDefault();
    if (!activeModalRec) return;

    setSubmittingAction(true);
    try {
      await api.recommendations.startAction(activeModalRec.id, {
        goalTitle: goalForm.goalTitle,
        targetCo2eKg: parseFloat(goalForm.targetCo2eKg),
        period: goalForm.period,
        durationDays: parseInt(goalForm.durationDays, 10)
      });
      setActiveModalRec(null);
      fetchRecommendations();
    } catch (err) {
      alert(err.message || 'Failed to start action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDismiss = async (recId) => {
    try {
      await api.recommendations.updateStatus(recId, 'DISMISSED');
      fetchRecommendations();
    } catch (err) {
      alert(err.message || 'Failed to dismiss recommendation.');
    }
  };

  const handleAskAI = (rec) => {
    // Open the CarbonTrack AI Advisor with pre-filled context
    window.dispatchEvent(new CustomEvent('carbontrack:ask-ai', {
      detail: {
        recommendation: rec,
        initialMessage: `I'd like advice on this recommendation: "${rec.title}". Can you break down practical steps, explain why it was generated based on my emissions, and help me track it?`
      }
    }));
  };

  const getCategoryIcon = (cat) => {
    const upper = (cat || '').toUpperCase();
    if (upper === 'TRANSPORT') return <Car size={14} />;
    if (upper === 'ENERGY' || upper === 'ELECTRICITY') return <Zap size={14} />;
    if (upper === 'FOOD') return <Utensils size={14} />;
    if (upper === 'WASTE') return <Trash2 size={14} />;
    if (upper === 'WATER') return <Droplet size={14} />;
    if (upper === 'SHOPPING') return <ShoppingBag size={14} />;
    return <TrendingDown size={14} />;
  };

  return (
    <div className="recommendations-page">
      <header className="recommendations-header">
        <div className="recommendations-title-area">
          <h1>Personalised Recommendations</h1>
          <p className="recommendations-subtitle">
            Data-driven sustainability actions calculated from your verified carbon footprint and activity habits.
          </p>
        </div>
      </header>

      {/* Category Filter Pills */}
      <nav className="rec-filter-bar" aria-label="Recommendation categories">
        {CATEGORY_FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = selectedCategory === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className={`rec-filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedCategory(f.id)}
            >
              {Icon && <Icon size={14} />}
              <span>{f.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="Analyzing your footprint and loading recommendations..." />}

      {error && !loading && (
        <div className="auth-alert alert-error" role="alert" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={fetchRecommendations}
          >
            Retry
          </button>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      {!loading && !error && recommendations.length === 0 && (
        <EmptyState
          icon={<Sparkles size={44} />}
          title={
            selectedCategory === 'HISTORY'
              ? 'No history yet'
              : `No ${selectedCategory !== 'ALL' ? selectedCategory.replace(/_/g, ' ').toLowerCase() : ''} recommendations found`
          }
          description={
            selectedCategory === 'HISTORY'
              ? 'You have not dismissed or completed any recommendations yet.'
              : 'Log additional activities across transport, energy, and food to generate customized reduction insights.'
          }
        />
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="recommendations-grid">
          {recommendations.map((rec) => {
            const catClass = (rec.category || 'other').toLowerCase();
            const priorityClass = (rec.priority || 'medium').toLowerCase();
            const isCompleted = rec.status === 'COMPLETED';
            const isInProgress = rec.status === 'IN_PROGRESS';
            const isDismissed = rec.status === 'DISMISSED';
            const savingsVal = Number(rec?.estimatedSavingsKg);
            const displaySavings = !isNaN(savingsVal) ? savingsVal.toFixed(1) : '0.0';

            return (
              <article key={rec.id} className="recommendation-card">
                <header className="rec-card-header">
                  <div className="rec-badges-group">
                    <span className={`rec-category-badge ${catClass}`}>
                      {getCategoryIcon(rec.category)}
                      <span>{(rec.category || 'General').replace(/_/g, ' ')}</span>
                    </span>
                    <span className={`rec-priority-badge ${priorityClass}`}>
                      {rec.priority || 'Medium'} Priority
                    </span>
                    {rec.difficulty && (
                      <span className="rec-difficulty-badge">
                        {rec.difficulty}
                      </span>
                    )}
                  </div>

                  {isInProgress && (
                    <span className="rec-status-indicator in_progress">
                      <Play size={11} /> In Progress
                    </span>
                  )}
                  {isCompleted && (
                    <span className="rec-status-indicator completed">
                      <CheckCircle2 size={11} /> Completed
                    </span>
                  )}
                  {isDismissed && (
                    <span className="rec-status-indicator dismissed">
                      Dismissed
                    </span>
                  )}
                </header>

                <h2 className="rec-title">{rec.title}</h2>

                {/* Data Observation */}
                <div className="rec-observation-box">
                  <strong>Data Observation:</strong>
                  {rec.observation}
                </div>

                {/* Practical Action Description */}
                <p className="rec-action-desc">{rec.actionDescription}</p>

                {/* Estimated Savings & Timeframe */}
                <div className="rec-impact-box">
                  <div className="rec-impact-item">
                    <span className="rec-impact-label">Estimated Savings</span>
                    <span className="rec-impact-val">
                      ~{displaySavings} kg CO₂e
                    </span>
                  </div>
                  <div className="rec-impact-item">
                    <span className="rec-impact-label">Suggested Timeframe</span>
                    <span className="rec-impact-val" style={{ fontSize: '0.95rem' }}>
                      {rec.timeframe || '1 - 2 weeks'}
                    </span>
                  </div>
                  {rec.savingsAssumptions && (
                    <p className="rec-assumptions-text">
                      * {rec.savingsAssumptions}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <footer className="rec-card-actions">
                  {!isInProgress && !isCompleted && !isDismissed && (
                    <button
                      type="button"
                      className="rec-btn rec-btn-primary"
                      onClick={() => handleOpenActionModal(rec)}
                    >
                      <Play size={14} /> Start Action
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      type="button"
                      className="rec-btn rec-btn-primary"
                      onClick={() => navigate('/goals')}
                    >
                      <Target size={14} /> View Connected Goal
                    </button>
                  )}

                  <button
                    type="button"
                    className="rec-btn rec-btn-ai"
                    onClick={() => handleAskAI(rec)}
                    title="Ask AI advisor about this recommendation"
                  >
                    <Bot size={15} /> Ask CarbonTrack AI
                  </button>

                  {!isDismissed && !isCompleted && (
                    <button
                      type="button"
                      className="rec-btn rec-btn-secondary"
                      onClick={() => handleDismiss(rec.id)}
                      title="Dismiss this recommendation"
                    >
                      <X size={14} /> Dismiss
                    </button>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Start Action Modal */}
      {activeModalRec && (
        <div className="action-modal-backdrop" onClick={() => !submittingAction && setActiveModalRec(null)}>
          <div className="action-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} color="var(--forest-primary, #246b43)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Commit to Action & Goal</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModalRec(null)}
                disabled={submittingAction}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #4b6354)', marginBottom: '1.25rem' }}>
              Connecting this recommendation creates an active <strong>{activeModalRec.category}</strong> category goal to track your emission reductions.
            </p>

            <form onSubmit={handleConfirmStartAction}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Goal Title
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={goalForm.goalTitle}
                  onChange={(e) => setGoalForm({ ...goalForm, goalTitle: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Target Limit (kg CO₂e)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-input"
                    value={goalForm.targetCo2eKg}
                    onChange={(e) => setGoalForm({ ...goalForm, targetCo2eKg: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Goal Period
                  </label>
                  <select
                    className="form-select"
                    value={goalForm.period}
                    onChange={(e) => setGoalForm({ ...goalForm, period: e.target.value })}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="rec-btn rec-btn-secondary"
                  onClick={() => setActiveModalRec(null)}
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rec-btn rec-btn-primary"
                  disabled={submittingAction}
                >
                  {submittingAction ? 'Connecting Goal...' : 'Confirm & Start Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
