import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import GoalProjectionSection from '../components/GoalProjectionSection';
import GoalTearDeleteModal from '../components/goals/GoalTearDeleteModal';
import '../styles/goals.css';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  Car,
  Zap,
  Utensils,
  Trash,
  Droplet,
  ShoppingBag,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bot,
  Layers,
  BarChart3,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'ALL', label: 'All Categories (Overall Footprint)', icon: Globe, colorClass: 'cat-all' },
  { id: 'TRANSPORT', label: 'Transport (Vehicles, Commute, Flights)', icon: Car, colorClass: 'cat-transport' },
  { id: 'ENERGY', label: 'Energy (Electricity, Power, Heating)', icon: Zap, colorClass: 'cat-energy' },
  { id: 'FOOD', label: 'Food (Diet, Meals, Groceries)', icon: Utensils, colorClass: 'cat-food' },
  { id: 'WASTE', label: 'Waste (Landfill, Trash, Recycling)', icon: Trash, colorClass: 'cat-waste' },
  { id: 'SHOPPING', label: 'Shopping (Goods, Electronics, Clothing)', icon: ShoppingBag, colorClass: 'cat-shopping' },
  { id: 'WATER', label: 'Water (Heated & Tap Consumption)', icon: Droplet, colorClass: 'cat-water' }
];

const PERIOD_OPTIONS = [
  { id: 'DAILY', label: 'Daily (Today - 24 Hours)', days: 1 },
  { id: 'WEEKLY', label: 'Weekly (7 Days Rolling)', days: 7 },
  { id: 'MONTHLY', label: 'Monthly (30 Days Budget)', days: 30 },
  { id: 'CUSTOM', label: 'Custom Date Range', days: null }
];

function getCategoryMeta(catId) {
  const match = CATEGORY_OPTIONS.find((c) => c.id === (catId || 'ALL').toUpperCase());
  return match || CATEGORY_OPTIONS[0];
}

function computeBudgetStatus(currentKgRaw, targetKgRaw, isTonnes, unitLabel) {
  const currentKg = Number(currentKgRaw) || 0;
  const targetKg = Number(targetKgRaw);

  const displayCurrent = isTonnes ? (currentKg / 1000).toFixed(3) : currentKg.toFixed(2);

  // Safe handling of zero or invalid target
  if (isNaN(targetKg) || targetKg <= 0) {
    if (currentKg > 0) {
      return {
        displayCurrent,
        displayTarget: isTonnes ? '0.000' : '0.00',
        remainingBudgetKg: -currentKg,
        meterPct: 100,
        meterTone: 'critical',
        remainingLabel: `Budget exceeded by ${displayCurrent} ${unitLabel}`,
        pctUsedLabel: 'Exceeded',
        isExceeded: true,
        isZeroTarget: true
      };
    }
    return {
      displayCurrent,
      displayTarget: isTonnes ? '0.000' : '0.00',
      remainingBudgetKg: 0,
      meterPct: 0,
      meterTone: 'safe',
      remainingLabel: '0% remaining (No target set)',
      pctUsedLabel: '0% used',
      isExceeded: false,
      isZeroTarget: true
    };
  }

  const displayTarget = isTonnes ? (targetKg / 1000).toFixed(3) : targetKg.toFixed(2);
  const remainingKg = targetKg - currentKg;
  const pctUsed = (currentKg / targetKg) * 100;
  const clampedMeterPct = Math.max(0, Math.min(100, Math.round(pctUsed)));

  // Negative remaining budget: Budget exceeded
  if (remainingKg < -0.0001) {
    const amountOver = Math.abs(remainingKg);
    const displayOver = isTonnes ? (amountOver / 1000).toFixed(3) : amountOver.toFixed(2);
    return {
      displayCurrent,
      displayTarget,
      remainingBudgetKg: remainingKg,
      meterPct: 100,
      meterTone: 'critical',
      remainingLabel: `Budget exceeded by ${displayOver} ${unitLabel}`,
      pctUsedLabel: `${Math.round(pctUsed)}% used`,
      isExceeded: true,
      isZeroTarget: false
    };
  }

  // Zero remaining budget: fully used
  if (Math.abs(remainingKg) <= 0.0001) {
    return {
      displayCurrent,
      displayTarget,
      remainingBudgetKg: 0,
      meterPct: 100,
      meterTone: 'critical',
      remainingLabel: '0% remaining (Budget fully used)',
      pctUsedLabel: '100% used',
      isExceeded: false,
      isZeroTarget: false
    };
  }

  // Positive remaining budget
  const remainingPct = Math.max(0, Math.min(100, Math.round((remainingKg / targetKg) * 100)));
  const displayRemaining = isTonnes ? (remainingKg / 1000).toFixed(3) : remainingKg.toFixed(2);
  const meterTone = pctUsed > 90 ? 'critical' : pctUsed > 70 ? 'warning' : 'safe';

  return {
    displayCurrent,
    displayTarget,
    remainingBudgetKg: remainingKg,
    meterPct: clampedMeterPct,
    meterTone,
    remainingLabel: `${displayRemaining} ${unitLabel} remaining (${remainingPct}%)`,
    pctUsedLabel: `${Math.round(pctUsed)}% used`,
    isExceeded: false,
    isZeroTarget: false
  };
}

export default function GoalsPage() {
  const { preferredUnit } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [goalPendingDelete, setGoalPendingDelete] = useState(null);

  // Category Emission Control Section State
  const [categoryOverviews, setCategoryOverviews] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [showOverview, setShowOverview] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [targetMode, setTargetMode] = useState('PERCENTAGE'); // 'PERCENTAGE' or 'DIRECT'
  const [modalForm, setModalForm] = useState(() => ({
    title: '',
    description: '',
    category: 'ALL',
    period: 'MONTHLY',
    targetCo2eKg: '',
    baselineCo2eKg: '',
    reductionPercentage: '10',
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

  // Activity data shared with each goal projection section
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);
  const activityRefreshKey = location.state?.refresh;

  // Fetch activities
  useEffect(() => {
    let isActive = true;
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      try {
        const data = await api.activities.getMine();
        if (!isActive) return;
        setActivities(Array.isArray(data) ? data : []);
        setActivitiesError(null);
      } catch (err) {
        if (!isActive) return;
        setActivitiesError(err?.message || 'Failed to load activities.');
      } finally {
        if (isActive) setActivitiesLoading(false);
      }
    };

    fetchActivities();
    return () => {
      isActive = false;
    };
  }, [activityRefreshKey]);

  // Fetch Goals and Category Overviews
  const fetchGoals = useCallback(async () => {
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
  }, []);

  const fetchCategoryOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const data = await api.recommendations.getCategoryOverview();
      setCategoryOverviews(Array.isArray(data) ? data : []);
      setOverviewError(null);
    } catch (err) {
      setOverviewError(err.message || 'Failed to load category overview.');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
    fetchCategoryOverview();
  }, [fetchGoals, fetchCategoryOverview]);

  // Computed Target when in baseline+reduction mode
  const computedTarget = useMemo(() => {
    if (targetMode === 'DIRECT') {
      const t = Number(modalForm.targetCo2eKg);
      if (!t || isNaN(t) || t <= 0) return null;
      return t.toFixed(isTonnes ? 3 : 2);
    }
    const b = Number(modalForm.baselineCo2eKg);
    const r = Number(modalForm.reductionPercentage);
    if (!b || isNaN(b) || b <= 0 || isNaN(r) || r < 0.01 || r > 100) return null;
    const target = b * (1 - r / 100);
    return target >= 0 ? target.toFixed(isTonnes ? 3 : 2) : '0.00';
  }, [targetMode, modalForm.targetCo2eKg, modalForm.baselineCo2eKg, modalForm.reductionPercentage, isTonnes]);

  const handlePeriodChange = (newPeriod) => {
    const today = new Date();
    let newStart = today.toISOString().slice(0, 10);
    let newEnd = modalForm.endDate;

    if (newPeriod === 'DAILY') {
      newEnd = newStart;
    } else if (newPeriod === 'WEEKLY') {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      newEnd = nextWeek.toISOString().slice(0, 10);
    } else if (newPeriod === 'MONTHLY') {
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      newEnd = nextMonth.toISOString().slice(0, 10);
    }

    setModalForm((prev) => ({
      ...prev,
      period: newPeriod,
      startDate: newStart,
      endDate: newEnd
    }));
  };

  const openCreateModal = (preselectedCategory = 'ALL', suggestedTargetKg = null) => {
    setEditingGoal(null);
    setTargetMode(suggestedTargetKg ? 'DIRECT' : 'PERCENTAGE');
    const today = new Date();
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const initialBaseline = isTonnes ? '0.100' : '100';
    const initialTarget = suggestedTargetKg
      ? (isTonnes ? (suggestedTargetKg / 1000).toFixed(3) : suggestedTargetKg.toFixed(2))
      : '';

    setModalForm({
      title: preselectedCategory !== 'ALL'
        ? `Reduce ${preselectedCategory.charAt(0) + preselectedCategory.slice(1).toLowerCase()} Emissions`
        : 'Monthly Carbon Budget',
      description: '',
      category: preselectedCategory,
      period: 'MONTHLY',
      targetCo2eKg: initialTarget,
      baselineCo2eKg: initialBaseline,
      reductionPercentage: '10',
      startDate: today.toISOString().slice(0, 10),
      endDate: nextMonth.toISOString().slice(0, 10),
      status: 'ACTIVE'
    });
    setModalError('');
    setModalFieldErrors({});
    setModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    const rawBaseline = Number(goal.baselineCo2eKg) || Number(goal.targetCo2eKg) || 100;
    const displayBaseline = isTonnes
      ? (rawBaseline / 1000).toFixed(3)
      : rawBaseline.toString();

    const rawTarget = Number(goal.targetCo2eKg) || 0;
    const displayTarget = isTonnes ? (rawTarget / 1000).toFixed(3) : rawTarget.toString();

    const hasReduction = goal.reductionPercentage !== null && goal.reductionPercentage !== undefined;
    setTargetMode(hasReduction ? 'PERCENTAGE' : 'DIRECT');

    setModalForm({
      title: goal.title || '',
      description: goal.description || '',
      category: goal.category || 'ALL',
      period: goal.period || 'CUSTOM',
      targetCo2eKg: displayTarget,
      baselineCo2eKg: displayBaseline,
      reductionPercentage: hasReduction ? goal.reductionPercentage.toString() : '10',
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
    } else if (modalForm.title.trim().length > 150) {
      errors.title = 'Goal title cannot exceed 150 characters.';
    }

    if (modalForm.description && modalForm.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }

    let targetInKg = null;
    let baselineInKg = null;
    let reductionNum = null;

    if (targetMode === 'DIRECT') {
      const rawTarget = Number(modalForm.targetCo2eKg);
      if (isNaN(rawTarget) || rawTarget <= 0) {
        errors.targetCo2eKg = 'Target limit must be greater than zero.';
      } else {
        targetInKg = isTonnes ? rawTarget * 1000 : rawTarget;
        baselineInKg = targetInKg;
      }
    } else {
      const rawBaseline = Number(modalForm.baselineCo2eKg);
      if (isNaN(rawBaseline) || rawBaseline <= 0) {
        errors.baselineCo2eKg = 'Baseline emissions must be greater than zero.';
      } else {
        baselineInKg = isTonnes ? rawBaseline * 1000 : rawBaseline;
      }

      const rawReduction = Number(modalForm.reductionPercentage);
      if (isNaN(rawReduction) || rawReduction < 0.01 || rawReduction > 100) {
        errors.reductionPercentage = 'Reduction percentage must be between 0.01% and 100%.';
      } else {
        reductionNum = rawReduction;
      }
    }

    if (!modalForm.startDate) {
      errors.startDate = 'Start date is required.';
    }
    if (!modalForm.endDate) {
      errors.endDate = 'End date is required.';
    }

    if (modalForm.startDate && modalForm.endDate && modalForm.endDate < modalForm.startDate) {
      errors.endDate = 'End date cannot be earlier than start date.';
    }

    if (Object.keys(errors).length > 0) {
      setModalFieldErrors(errors);
      setModalError(Object.values(errors)[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: modalForm.title.trim(),
        description: modalForm.description.trim(),
        category: modalForm.category,
        period: modalForm.period,
        startDate: modalForm.startDate,
        endDate: modalForm.endDate
      };

      if (targetMode === 'DIRECT') {
        payload.targetCo2eKg = Number(targetInKg.toFixed(3));
        payload.baselineCo2eKg = Number(baselineInKg.toFixed(3));
      } else {
        payload.baselineCo2eKg = Number(baselineInKg.toFixed(3));
        payload.reductionPercentage = Number(reductionNum.toFixed(2));
      }

      if (editingGoal) {
        await api.goals.update(editingGoal.id, {
          ...payload,
          status: modalForm.status
        });
        setActionSuccess('Goal updated successfully!');
      } else {
        await api.goals.create(payload);
        setActionSuccess('New sustainability goal created!');
      }

      setModalOpen(false);
      await Promise.all([fetchGoals(), fetchCategoryOverview()]);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      if (err.validationErrors && typeof err.validationErrors === 'object' && Object.keys(err.validationErrors).length > 0) {
        setModalFieldErrors(err.validationErrors);
        const errorList = Object.values(err.validationErrors);
        setModalError(errorList.join('. '));
      } else {
        setModalError(err.message || 'Operation failed. Please review inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteGoal = async (id) => {
    await api.goals.delete(id);
    setActionSuccess('Goal removed successfully.');
    setGoals((prev) => prev.filter((g) => g.id !== id));
    fetchCategoryOverview();
    setGoalPendingDelete(null);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  // Quick Action: Ask AI about a Category
  const handleAskAiAboutCategory = (catOverview) => {
    const curVal = Number(catOverview.currentPeriodCo2eKg ?? catOverview.current30DayEmissionsKg ?? 0).toFixed(1);
    const trendNum = catOverview.trendPercentage != null ? Number(catOverview.trendPercentage) : null;
    const trendText = trendNum !== null ? `${trendNum >= 0 ? '+' : ''}${trendNum}%` : 'Stable';
    const context = `Category: ${catOverview.displayName || catOverview.category} | 30-Day Footprint: ${curVal} kg CO2e (${trendText} vs prior 30 days). Included types: ${catOverview.includedTypes || 'N/A'}. What are the most effective practical actions to reduce emissions in this category?`;
    window.dispatchEvent(
      new CustomEvent('carbontrack:ask-ai', {
        detail: {
          context,
          prompt: `Give me concrete recommendations to lower my ${catOverview.displayName || catOverview.category} footprint based on my recent activity logs.`
        }
      })
    );
  };

  // Quick Action: Navigate to recommendations filtered by category
  const handleViewRecommendations = (catName) => {
    navigate(`/recommendations?category=${catName}`);
  };

  const filteredGoals = useMemo(() => {
    let result = goals;

    // Filter by Status
    if (activeFilter === 'ACTIVE') {
      result = result.filter((g) => (g.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
    } else if (activeFilter === 'COMPLETED') {
      result = result.filter((g) => (g.status || '').toUpperCase() === 'COMPLETED');
    } else if (activeFilter === 'OVERDUE') {
      result = result.filter((g) => g.status === 'OVERDUE' || g.status === 'EXCEEDED');
    }

    // Filter by Category
    if (categoryFilter !== 'ALL') {
      result = result.filter((g) => (g.category || 'ALL').toUpperCase() === categoryFilter);
    }

    return result;
  }, [goals, activeFilter, categoryFilter]);

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
        <div className="goals-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => setShowOverview(!showOverview)}
            title="Toggle Category Emission Control"
          >
            <BarChart3 size={18} />
            <span>{showOverview ? 'Hide Category Control' : 'Show Category Control'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => openCreateModal('ALL')}
          >
            <Plus size={18} />
            <span>New Goal</span>
          </button>
        </div>
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
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={fetchGoals}
            style={{ marginLeft: 'auto' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* PHASE 4: Category Emission Control Overview Section */}
      {showOverview && (
        <div className="category-control-section">
          <div className="category-control-header">
            <div className="category-control-title-group">
              <span className="category-control-icon">
                <BarChart3 size={22} />
              </span>
              <div>
                <h2 className="category-control-title">Category Emission Control</h2>
                <p className="category-control-subtitle">
                  30-day verified emissions by category, trend shifts vs prior month, and active budget tracking.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchCategoryOverview}
              disabled={overviewLoading}
            >
              {overviewLoading ? <LoadingSpinner size="sm" message="" /> : <span>Refresh Metrics</span>}
            </button>
          </div>

          {overviewError && (
            <div className="auth-alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={16} />
              <span>{overviewError}</span>
            </div>
          )}

          <div className="category-overview-grid">
            {categoryOverviews.map((cat) => {
              const meta = getCategoryMeta(cat.category);
              const CatIcon = meta.icon;

              const curKg = Number(cat.currentPeriodCo2eKg ?? cat.current30DayEmissionsKg ?? 0);
              const display30d = isTonnes
                ? (curKg / 1000).toFixed(3)
                : curKg.toFixed(1);

              const prevRaw = cat.previousPeriodCo2eKg ?? cat.prior30DayEmissionsKg;
              const prevKg = prevRaw != null && !isNaN(Number(prevRaw)) ? Number(prevRaw) : null;
              const displayPrior = prevKg !== null
                ? (isTonnes ? (prevKg / 1000).toFixed(3) : prevKg.toFixed(1))
                : null;

              const trendVal = cat.trendPercentage != null && !isNaN(Number(cat.trendPercentage))
                ? Number(cat.trendPercentage)
                : null;
              const isTrendUp = trendVal !== null && trendVal > 0;
              const isTrendDown = trendVal !== null && trendVal < 0;
              const trendDisplay = trendVal !== null ? `${trendVal > 0 ? '+' : ''}${trendVal}%` : 'Stable';

              const targetRaw = cat.configuredGoalTargetKg ?? cat.activeGoalTargetKg;
              const targetKg = targetRaw != null && !isNaN(Number(targetRaw)) ? Number(targetRaw) : null;
              const displayTarget = targetKg !== null
                ? (isTonnes ? (targetKg / 1000).toFixed(3) : targetKg.toFixed(1))
                : null;

              const remainingRaw = cat.activeGoalRemainingKg ?? (targetKg !== null ? targetKg - curKg : null);
              const remainingKg = remainingRaw != null && !isNaN(Number(remainingRaw)) ? Number(remainingRaw) : null;
              const displayRemaining = remainingKg !== null
                ? (isTonnes ? (remainingKg / 1000).toFixed(3) : remainingKg.toFixed(1))
                : null;

              const hasGoal = Boolean(cat.hasActiveGoal && targetKg !== null);

              return (
                <div
                  key={cat.category}
                  className={`category-overview-card ${cat.isHighEmission ? 'is-high-emission' : ''}`}
                >
                  <div className="category-card-top">
                    <div className="category-info-badge">
                      <div className={`category-badge-icon ${meta.colorClass}`}>
                        <CatIcon size={18} />
                      </div>
                      <div>
                        <h3 className="category-name-heading">{cat.displayName || cat.category}</h3>
                        <span className="category-tag-sub">{cat.category}</span>
                      </div>
                    </div>
                    {cat.isHighEmission && (
                      <span className="high-impact-pill" title={cat.highEmissionReason || "High emission footprint or growth detected"}>
                        <ShieldAlert size={12} />
                        High Impact
                      </span>
                    )}
                  </div>

                  <div className="category-metric-row">
                    <div>
                      <span className="category-metric-current">{display30d}</span>
                      <span className="category-metric-unit">{unitLabel}</span>
                      {displayPrior !== null && (
                        <div className="category-metric-prior" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Prior 30d: {displayPrior} {unitLabel}
                        </div>
                      )}
                    </div>
                    <span
                      className={`category-trend-pill ${
                        isTrendUp ? 'trend-up' : isTrendDown ? 'trend-down' : 'trend-neutral'
                      }`}
                    >
                      {isTrendUp ? <ArrowUpRight size={14} /> : isTrendDown ? <ArrowDownRight size={14} /> : null}
                      {trendDisplay}
                    </span>
                  </div>

                  <div className="category-goal-status">
                    {hasGoal ? (
                      <>
                        <div className="category-goal-meta">
                          <span>
                            Budget:{' '}
                            <strong>
                              {displayTarget}{' '}
                              {unitLabel}
                            </strong>
                          </span>
                          <span>
                            Remaining:{' '}
                            <strong>
                              {displayRemaining}{' '}
                              {unitLabel}
                            </strong>
                          </span>
                        </div>
                        <div className="category-goal-progress">
                          {(() => {
                            const pct = targetKg && targetKg > 0
                              ? Math.min(100, Math.max(0, Math.round((curKg / targetKg) * 100)))
                              : 0;
                            const tone = pct > 90 ? 'critical' : pct > 70 ? 'warning' : 'safe';
                            return <div className={`category-goal-fill ${tone}`} style={{ width: `${pct}%` }} />;
                          })()}
                        </div>
                      </>
                    ) : (
                      <div className="category-no-goal">
                        <Clock size={13} />
                        <span>No active limit set for {cat.displayName || cat.category}</span>
                      </div>
                    )}
                  </div>

                  {cat.includedTypes && (
                    <div className="category-types-hint">
                      <strong>Types:</strong> {cat.includedTypes}
                    </div>
                  )}

                  <div className="category-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => openCreateModal(cat.category, curKg > 0 ? curKg * 0.9 : 50)}
                      title={`Create a goal specifically for ${cat.displayName || cat.category}`}
                    >
                      <Target size={13} />
                      Set Goal
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleViewRecommendations(cat.category)}
                      title="View AI recommendations for this category"
                    >
                      <Sparkles size={13} />
                      Tips
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleAskAiAboutCategory(cat)}
                      title="Ask CarbonTrack AI Advisor about this category"
                    >
                      <Bot size={13} />
                      Ask AI
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* Filter Tabs & Category Filter */}
      <div className="goals-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
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

        {/* Category Pill Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="TRANSPORT">Transport</option>
            <option value="ENERGY">Energy</option>
            <option value="FOOD">Food</option>
            <option value="WASTE">Waste</option>
            <option value="SHOPPING">Shopping</option>
            <option value="WATER">Water</option>
          </select>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length > 0 ? (
        <div className="goals-cards-grid">
          {filteredGoals.map((g) => {
            const budget = computeBudgetStatus(g.currentCo2eKg, g.targetCo2eKg, isTonnes, unitLabel);
            const catMeta = getCategoryMeta(g.category);
            const CatIcon = catMeta.icon;

            let statusClass = 'status-active';
            let statusLabel = 'Active';
            if (g.status === 'COMPLETED') {
              statusClass = 'status-completed';
              statusLabel = 'Completed';
            } else if (g.status === 'OVERDUE') {
              statusClass = 'status-overdue';
              statusLabel = 'Overdue';
            } else if (g.status === 'EXCEEDED' || budget.isExceeded) {
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
                    <div className="goal-badge-group">
                      <span className={`goal-status-badge ${statusClass}`}>
                        {g.status === 'COMPLETED' ? (
                          <CheckCircle2 size={13} />
                        ) : g.status === 'OVERDUE' || g.status === 'EXCEEDED' || budget.isExceeded ? (
                          <AlertCircle size={13} />
                        ) : (
                          <Clock size={13} />
                        )}
                        <span>{statusLabel}</span>
                      </span>

                      {/* Category Badge */}
                      <span className={`goal-category-badge ${catMeta.colorClass}`}>
                        <CatIcon size={12} />
                        <span>{catMeta.id}</span>
                      </span>

                      {/* Period Badge */}
                      <span className="goal-period-badge">
                        {g.period || 'CUSTOM'}
                      </span>
                    </div>

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
                      onClick={() => setGoalPendingDelete(g)}
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
                      <strong>{budget.displayCurrent}</strong> {unitLabel} emitted
                    </span>
                    <span className="goal-target-val">
                      Target: <strong>{budget.displayTarget}</strong> {unitLabel}
                      {g.reductionPercentage != null ? ` (${g.reductionPercentage}% cut)` : ''}
                    </span>
                  </div>

                  <div className="goal-meter-track">
                    <div
                      className={`goal-meter-fill ${budget.meterTone}`}
                      style={{ width: `${budget.meterPct}%` }}
                    />
                  </div>

                  <div className="goal-progress-footer">
                    <span className={budget.isExceeded ? 'text-coral font-medium' : ''}>
                      {budget.remainingLabel}
                    </span>
                    <span className="goal-pct-text">{budget.pctUsedLabel}</span>
                  </div>
                </div>

                {/* Included Categories Pill */}
                {g.includedCategories && (
                  <div className="goal-included-types-tag">
                    <Layers size={13} />
                    <span>Calculated strictly from: {g.includedCategories}</span>
                  </div>
                )}

                {/* Goal Projection & Alerts Section */}
                <GoalProjectionSection
                  key={`proj-${g.id}-${g.targetCo2eKg}-${g.startDate}-${g.endDate}`}
                  goal={g}
                  preferredUnit={preferredUnit}
                  recentActivities={activities}
                  activitiesLoading={activitiesLoading}
                  activitiesError={activitiesError}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No sustainability goals found"
          description={
            activeFilter === 'ALL' && categoryFilter === 'ALL'
              ? 'You have not created any sustainability goals yet. Establish target budgets to hold yourself accountable!'
              : `No goals found with the selected filters.`
          }
          actionText={activeFilter === 'ALL' && categoryFilter === 'ALL' ? 'Create Your First Goal' : 'Clear Filters'}
          onAction={() => {
            setActiveFilter('ALL');
            setCategoryFilter('ALL');
            if (activeFilter === 'ALL' && categoryFilter === 'ALL') {
              openCreateModal('ALL');
            }
          }}
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
                  <p className="modal-subtitle">Define category-specific emissions budget and tracking timeframe.</p>
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
                  placeholder="e.g. Keep Monthly Transport Footprint under 40kg"
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

              {/* Category & Period Selection */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-category">
                    <span>Category <span className="text-coral">*</span></span>
                  </label>
                  <select
                    id="goal-category"
                    className="form-select"
                    value={modalForm.category}
                    onChange={(e) => handleFormFieldChange('category', e.target.value)}
                    disabled={isSubmitting}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">Emissions will strictly track activity logs in this category.</span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="goal-period">
                    <span>Tracking Period <span className="text-coral">*</span></span>
                  </label>
                  <select
                    id="goal-period"
                    className="form-select"
                    value={modalForm.period}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {PERIOD_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">Select a fixed recurring cycle or custom dates.</span>
                </div>
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

              {/* Target Calculation Mode Toggle */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  className={`btn btn-xs ${targetMode === 'PERCENTAGE' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetMode('PERCENTAGE')}
                >
                  Baseline & % Reduction
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${targetMode === 'DIRECT' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetMode('DIRECT')}
                >
                  Direct Target Limit ({unitLabel})
                </button>
              </div>

              {targetMode === 'PERCENTAGE' ? (
                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="goal-baseline">
                      <span>Baseline Footprint ({unitLabel}) <span className="text-coral">*</span></span>
                    </label>
                    <input
                      id="goal-baseline"
                      type="number"
                      step="any"
                      min="0.001"
                      className={`form-input ${modalFieldErrors.baselineCo2eKg ? 'has-error' : ''}`}
                      placeholder={isTonnes ? '0.100' : '100'}
                      value={modalForm.baselineCo2eKg}
                      onChange={(e) => handleFormFieldChange('baselineCo2eKg', e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                    {modalFieldErrors.baselineCo2eKg ? (
                      <span className="field-error-message">{modalFieldErrors.baselineCo2eKg}</span>
                    ) : (
                      <span className="field-hint">Reference emissions before reduction.</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="goal-reduction">
                      <span>Target Reduction (%) <span className="text-coral">*</span></span>
                    </label>
                    <input
                      id="goal-reduction"
                      type="number"
                      step="any"
                      min="0.01"
                      max="100"
                      className={`form-input ${modalFieldErrors.reductionPercentage ? 'has-error' : ''}`}
                      placeholder="10"
                      value={modalForm.reductionPercentage}
                      onChange={(e) => handleFormFieldChange('reductionPercentage', e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                    {modalFieldErrors.reductionPercentage ? (
                      <span className="field-error-message">{modalFieldErrors.reductionPercentage}</span>
                    ) : (
                      <span className="field-hint">Reduction target (0.01% - 100%).</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-direct-target">
                    <span>Direct Maximum Allowance ({unitLabel}) <span className="text-coral">*</span></span>
                  </label>
                  <input
                    id="goal-direct-target"
                    type="number"
                    step="any"
                    min="0.001"
                    className={`form-input ${modalFieldErrors.targetCo2eKg ? 'has-error' : ''}`}
                    placeholder={isTonnes ? '0.080' : '80.0'}
                    value={modalForm.targetCo2eKg}
                    onChange={(e) => handleFormFieldChange('targetCo2eKg', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  {modalFieldErrors.targetCo2eKg ? (
                    <span className="field-error-message">{modalFieldErrors.targetCo2eKg}</span>
                  ) : (
                    <span className="field-hint">Set the exact upper cap for this period.</span>
                  )}
                </div>
              )}

              <div className="goal-target-calc-preview">
                <div className="calc-preview-top">
                  <span className="calc-preview-label">Calculated Target Budget:</span>
                  <span className="calc-preview-value">
                    <strong>{computedTarget !== null ? computedTarget : '—'}</strong> {unitLabel}
                  </span>
                </div>
                <span className="calc-preview-sub">
                  {computedTarget !== null
                    ? targetMode === 'PERCENTAGE'
                      ? `Maximum allowable emissions (${modalForm.baselineCo2eKg} ${unitLabel} − ${modalForm.reductionPercentage}%)`
                      : `Strict upper cap of ${modalForm.targetCo2eKg} ${unitLabel}`
                    : 'Enter target parameters to view allowable budget.'}
                </span>
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
                    disabled={isSubmitting || modalForm.period !== 'CUSTOM'}
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
                    disabled={isSubmitting || modalForm.period !== 'CUSTOM'}
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

      {/* Tearable Ticket Goal Deletion Confirmation Modal */}
      <GoalTearDeleteModal
        isOpen={Boolean(goalPendingDelete)}
        goal={goalPendingDelete}
        onClose={() => setGoalPendingDelete(null)}
        onConfirmDelete={handleConfirmDeleteGoal}
      />
    </div>
  );
}
