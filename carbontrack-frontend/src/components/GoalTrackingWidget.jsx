import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import {
  Target,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  ChevronDown,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';

/**
 * Goal status mapper aligned with both backend GoalResponseDTO and GoalProjectionDTO:
 * Possible statuses in UI: "On track", "At risk", "Completed", "Missed"
 */
function getUnifiedGoalStatus(goal, projection) {
  if (!goal) return { label: 'No Goal', key: 'NO_GOAL', color: 'neutral', icon: Info };

  // 1. Completed
  if (goal.completed === true || goal.status === 'COMPLETED') {
    return {
      label: 'Completed',
      key: 'COMPLETED',
      color: 'success',
      icon: CheckCircle2,
      description: 'Goal period ended within target footprint!'
    };
  }

  // 2. Missed / Overdue / Exceeded
  if (goal.overdue === true || goal.status === 'OVERDUE' || goal.status === 'EXCEEDED') {
    return {
      label: 'Missed',
      key: 'MISSED',
      color: 'danger',
      icon: AlertCircle,
      description: 'Emissions exceeded the target budget.'
    };
  }

  // 3. Projections for ACTIVE goals
  const projStatus = projection?.projectionStatus?.toUpperCase() || '';
  if (projStatus === 'ON_TRACK') {
    return {
      label: 'On track',
      key: 'ON_TRACK',
      color: 'success',
      icon: CheckCircle2,
      description: 'Projected emissions are within target!'
    };
  }

  if (projStatus === 'AT_RISK') {
    return {
      label: 'At risk',
      key: 'AT_RISK',
      color: 'warning',
      icon: AlertTriangle,
      description: 'Emissions are trending near budget limit.'
    };
  }

  if (projStatus === 'OFF_TRACK') {
    return {
      label: 'At risk',
      key: 'AT_RISK',
      sublabel: 'Off Track',
      color: 'danger',
      icon: AlertTriangle,
      description: 'Emissions currently project beyond target budget.'
    };
  }

  if (projStatus === 'INSUFFICIENT_DATA') {
    return {
      label: 'On track',
      key: 'ON_TRACK',
      sublabel: 'Building baseline',
      color: 'info',
      icon: Clock,
      description: 'Gathering data for projection...'
    };
  }

  return {
    label: 'On track',
    key: 'ON_TRACK',
    color: 'success',
    icon: CheckCircle2,
    description: 'Active sustainability goal'
  };
}

export default function GoalTrackingWidget({
  goals: initialGoals = null,
  onGoalUpdated = null,
  className = ''
}) {
  const { isDark } = useTheme();
  const { preferredUnit } = useAuth();
  const isTonnes = preferredUnit === 'TONNES_CO2E';
  const unitLabel = isTonnes ? 't CO₂e' : 'kg CO₂e';

  const [goals, setGoals] = useState(initialGoals || []);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(!initialGoals);
  const [projectionLoading, setProjectionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all user goals if not provided
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.goals.getMyGoals();
      const list = Array.isArray(res) ? res : [];
      setGoals(list);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load sustainability goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialGoals) {
      fetchGoals();
    } else {
      setGoals(initialGoals);
      setLoading(false);
    }
  }, [initialGoals, fetchGoals]);

  // Active goals filter
  const activeGoals = useMemo(() => {
    const list = goals.filter((g) => g.status === 'ACTIVE' || !g.completed);
    return list.length > 0 ? list : goals;
  }, [goals]);

  // Active goal selected
  const activeGoal = useMemo(() => {
    if (selectedGoalId) {
      const match = goals.find((g) => g.id === Number(selectedGoalId));
      if (match) return match;
    }
    return activeGoals[0] || null;
  }, [selectedGoalId, activeGoals, goals]);

  // Fetch projection for active goal
  const fetchProjection = useCallback(async (goalId) => {
    if (!goalId) {
      setProjection(null);
      return;
    }
    try {
      setProjectionLoading(true);
      const proj = await api.goals.getProjection(goalId);
      setProjection(proj);
    } catch (err) {
      console.warn(`Could not load projection for goal ${goalId}:`, err);
      setProjection(null);
    } finally {
      setProjectionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeGoal?.id) {
      fetchProjection(activeGoal.id);
    } else {
      setProjection(null);
    }
  }, [activeGoal?.id, fetchProjection]);

  // Calculations
  const calculations = useMemo(() => {
    if (!activeGoal) return null;

    const baselineKg = Number(activeGoal.baselineCo2eKg) || 0;
    const targetKg = Number(activeGoal.targetCo2eKg) || 0;
    const currentKg = Number(activeGoal.currentCo2eKg) || 0;
    const reductionPct = Number(activeGoal.reductionPercentage) || 0;

    // Remaining duration calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(activeGoal.startDate);
    const endDate = new Date(activeGoal.endDate);
    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.min(totalDays, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24))));

    // Target budget remaining
    const remainingBudgetKg = projection?.remainingBudgetKg !== undefined && projection?.remainingBudgetKg !== null
      ? Number(projection.remainingBudgetKg)
      : targetKg - currentKg;

    // Daily reduction required calculation from backend projection data
    let dailyAllowanceKg = null;
    let dailyReductionNeededKg = null;
    let isAheadOfBudget = false;

    if (daysRemaining > 0) {
      dailyAllowanceKg = remainingBudgetKg / daysRemaining;

      // Estimate current daily burn rate
      const avgWeekly = projection?.averageWeeklyCo2eKg ? Number(projection.averageWeeklyCo2eKg) : null;
      const currentDailyBurn = avgWeekly !== null && avgWeekly > 0
        ? avgWeekly / 7
        : daysElapsed > 0 ? (currentKg / daysElapsed) : 0;

      if (remainingBudgetKg <= 0) {
        dailyReductionNeededKg = currentDailyBurn; // Needs complete stop/drastic cut
      } else if (currentDailyBurn > dailyAllowanceKg) {
        dailyReductionNeededKg = currentDailyBurn - dailyAllowanceKg;
      } else {
        isAheadOfBudget = true;
      }
    }

    // Progress percentage
    const progressPct = activeGoal.progressPercentage !== undefined && activeGoal.progressPercentage !== null
      ? activeGoal.progressPercentage
      : targetKg > 0 ? Math.min(100, Math.round((currentKg / targetKg) * 100)) : 0;

    // Budget percentage used
    const budgetPctUsed = targetKg > 0 ? Math.min(100, Math.round((currentKg / targetKg) * 100)) : 0;

    // Display units
    const formatCo2 = (kg) => {
      const val = isTonnes ? kg / 1000 : kg;
      return isTonnes ? val.toFixed(3) : val.toFixed(1);
    };

    return {
      baselineKg,
      targetKg,
      currentKg,
      reductionPct,
      daysRemaining,
      totalDays,
      daysElapsed,
      remainingBudgetKg,
      dailyAllowanceKg,
      dailyReductionNeededKg,
      isAheadOfBudget,
      progressPct,
      budgetPctUsed,
      displayBaseline: formatCo2(baselineKg),
      displayTarget: formatCo2(targetKg),
      displayCurrent: formatCo2(currentKg),
      displayRemainingBudget: formatCo2(remainingBudgetKg),
      displayDailyAllowance: dailyAllowanceKg !== null ? formatCo2(Math.max(0, dailyAllowanceKg)) : '0.0',
      displayDailyReduction: dailyReductionNeededKg !== null ? formatCo2(dailyReductionNeededKg) : '0.0'
    };
  }, [activeGoal, projection, isTonnes]);

  // Unified status
  const statusInfo = useMemo(() => {
    return getUnifiedGoalStatus(activeGoal, projection);
  }, [activeGoal, projection]);

  // Timeline chart data
  const timelineChartData = useMemo(() => {
    if (!projection?.weeklyEmissions || projection.weeklyEmissions.length === 0) {
      if (!activeGoal) return [];
      // Provide starting point with current data
      return [
        { label: 'Start', emissions: 0, target: Number(activeGoal.targetCo2eKg) || 100 },
        { label: 'Current', emissions: Number(activeGoal.currentCo2eKg) || 0, target: Number(activeGoal.targetCo2eKg) || 100 }
      ];
    }

    let cum = 0;
    const targetVal = Number(projection.targetCo2eKg || activeGoal?.targetCo2eKg || 0);

    const history = projection.weeklyEmissions.map((w, idx) => {
      const weekVal = Number(w.totalCo2eKg) || 0;
      cum += weekVal;
      return {
        label: `W${idx + 1}`,
        weekStart: w.weekStart,
        weekly: Number(weekVal.toFixed(2)),
        cumulative: Number(cum.toFixed(2)),
        target: targetVal
      };
    });

    // If projected end is available, add a projected point
    if (projection.projectedEndCo2eKg !== null && projection.projectedEndCo2eKg !== undefined) {
      const projectedVal = Number(projection.projectedEndCo2eKg);
      history.push({
        label: 'End (Proj)',
        projected: Number(projectedVal.toFixed(2)),
        target: targetVal
      });
    }

    return history;
  }, [projection, activeGoal]);

  if (loading) {
    return (
      <div className={`goal-widget-container card-surface ${className}`}>
        <LoadingSpinner message="Loading sustainability goal tracking..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`goal-widget-container card-surface ${className}`}>
        <div className="goal-widget-error">
          <AlertCircle size={24} color="var(--accent-coral)" />
          <p>{error}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchGoals}>
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  if (!activeGoal) {
    return (
      <div className={`goal-widget-container card-surface empty-widget-state ${className}`}>
        <div className="widget-empty-icon">
          <Target size={36} color="var(--forest-primary)" />
        </div>
        <h3 className="widget-empty-title">No Active Sustainability Goals</h3>
        <p className="widget-empty-desc">
          Set a footprint reduction target to track daily progress, stay accountable, and unlock sustainability badges.
        </p>
        <Link to="/goals" className="btn btn-primary btn-sm">
          <span>Create a Goal</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const StatusIcon = statusInfo.icon;

  return (
    <div className={`goal-widget-card ${className}`}>
      {/* Widget Header */}
      <div className="goal-widget-header">
        <div className="goal-title-group">
          <span className="goal-icon-bubble">
            <Target size={20} color="var(--forest-primary)" />
          </span>
          <div>
            <div className="goal-heading-row">
              <h3 className="goal-widget-title">{activeGoal.title}</h3>
              {activeGoals.length > 1 && (
                <div className="goal-selector-dropdown">
                  <select
                    value={activeGoal.id}
                    onChange={(e) => setSelectedGoalId(Number(e.target.value))}
                    aria-label="Select active sustainability goal"
                    className="goal-select-input"
                  >
                    {activeGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title} ({g.reductionPercentage}% cut)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <p className="goal-widget-meta">
              Target period: {activeGoal.startDate} to {activeGoal.endDate}
              {calculations?.daysRemaining !== undefined && (
                <span className="days-remaining-pill">
                  <Clock size={12} />
                  {calculations.daysRemaining > 0
                    ? `${calculations.daysRemaining} days remaining`
                    : 'Goal period ended'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Goal Status Badge */}
        <div className="goal-status-container">
          <span className={`unified-goal-status-badge status-${statusInfo.color}`}>
            <StatusIcon size={14} className="status-icon" />
            <span className="status-label">{statusInfo.label}</span>
          </span>
        </div>
      </div>

      {/* Primary KPI Progress Grid */}
      <div className="goal-kpi-grid">
        <div className="kpi-cell">
          <span className="kpi-label">Target Reduction</span>
          <div className="kpi-value-row text-forest">
            <TrendingDown size={18} color="var(--forest-primary)" />
            <span className="kpi-num">{calculations.reductionPct}%</span>
          </div>
          <span className="kpi-subtext">below baseline</span>
        </div>

        <div className="kpi-cell">
          <span className="kpi-label">Baseline Footprint</span>
          <div className="kpi-value-row">
            <span className="kpi-num">{calculations.displayBaseline}</span>
            <span className="kpi-unit">{unitLabel}</span>
          </div>
          <span className="kpi-subtext">Historical reference</span>
        </div>

        <div className="kpi-cell">
          <span className="kpi-label">Target Ceiling</span>
          <div className="kpi-value-row text-forest">
            <span className="kpi-num">{calculations.displayTarget}</span>
            <span className="kpi-unit">{unitLabel}</span>
          </div>
          <span className="kpi-subtext">Max allowable budget</span>
        </div>

        <div className="kpi-cell">
          <span className="kpi-label">Current Progress</span>
          <div className="kpi-value-row">
            <span className="kpi-num">{calculations.displayCurrent}</span>
            <span className="kpi-unit">{unitLabel}</span>
          </div>
          <span className="kpi-subtext">
            {calculations.budgetPctUsed}% of budget used
          </span>
        </div>
      </div>

      {/* Visual Progress Indicator */}
      <div className="goal-progress-section">
        <div className="goal-meter-header">
          <span className="meter-label">Cumulative Budget Utilization</span>
          <span className="meter-pct-value font-semibold">
            {calculations.budgetPctUsed}% used ({calculations.displayCurrent} / {calculations.displayTarget} {unitLabel})
          </span>
        </div>
        <div className="goal-meter-track" role="progressbar" aria-valuenow={calculations.budgetPctUsed} aria-valuemin="0" aria-valuemax="100">
          <div
            className={`goal-meter-fill meter-tone-${
              calculations.budgetPctUsed > 90
                ? 'danger'
                : calculations.budgetPctUsed > 70
                ? 'warning'
                : 'good'
            }`}
            style={{ width: `${Math.min(100, calculations.budgetPctUsed)}%` }}
          />
        </div>
        <div className="goal-meter-markers">
          <span>0 {unitLabel}</span>
          <span className="marker-target">Target: {calculations.displayTarget} {unitLabel}</span>
          <span>Baseline: {calculations.displayBaseline} {unitLabel}</span>
        </div>
      </div>

      {/* Daily Reduction Required Callout (Requirement 6) */}
      <div className={`daily-guidance-card guidance-${calculations.isAheadOfBudget ? 'ontrack' : 'action'}`}>
        <div className="guidance-icon-wrap">
          {calculations.isAheadOfBudget ? (
            <Sparkles size={20} color="var(--forest-primary)" />
          ) : (
            <Flame size={20} color="var(--accent-coral)" />
          )}
        </div>
        <div className="guidance-content">
          <h4 className="guidance-title">
            {calculations.isAheadOfBudget
              ? 'On Track with Daily Allowance'
              : calculations.daysRemaining > 0
              ? 'Daily Reduction Required'
              : 'Goal Period Closed'}
          </h4>
          <p className="guidance-text">
            {calculations.daysRemaining > 0 ? (
              calculations.isAheadOfBudget ? (
                <>
                  You have <strong>{calculations.displayRemainingBudget} {unitLabel}</strong> remaining over {calculations.daysRemaining} days.
                  Your maximum daily emission allowance is <strong>{calculations.displayDailyAllowance} {unitLabel}/day</strong>.
                </>
              ) : calculations.remainingBudgetKg > 0 ? (
                <>
                  To achieve your {calculations.reductionPct}% reduction goal, lower your daily generation by{' '}
                  <strong className="text-coral font-bold">{calculations.displayDailyReduction} {unitLabel}/day</strong>.
                  Daily ceiling: <strong>{calculations.displayDailyAllowance} {unitLabel}/day</strong>.
                </>
              ) : (
                <>
                  Budget exceeded by <strong>{calculations.displayDailyReduction} {unitLabel}</strong>.
                  Focus on high-impact transit or diet habits to stabilize your footprint.
                </>
              )
            ) : (
              'This goal duration has concluded. Review final results in Goal History.'
            )}
          </p>
        </div>
      </div>

      {/* Goal Completion Messages & Alerts (Requirement 10) */}
      {projection?.alertMessage && (
        <div className={`goal-projection-alert alert-${projection.projectionStatus?.toLowerCase() || 'info'}`}>
          <AlertCircle size={16} />
          <span>{projection.alertMessage}</span>
        </div>
      )}

      {/* Timeline Chart Projecting Future Footprint (Requirement 8) */}
      <div className="projection-chart-section">
        <div className="projection-chart-header">
          <div>
            <h4 className="chart-subheading">Emissions Timeline & Projection</h4>
            <p className="chart-microtext">Weekly cumulative tracking against target ceiling</p>
          </div>
          {projection?.projectedEndCo2eKg !== null && projection?.projectedEndCo2eKg !== undefined && (
            <div className="projected-badge">
              <span>Projected End: </span>
              <strong>
                {isTonnes
                  ? (Number(projection.projectedEndCo2eKg) / 1000).toFixed(3)
                  : Number(projection.projectedEndCo2eKg).toFixed(1)}{' '}
                {unitLabel}
              </strong>
            </div>
          )}
        </div>

        <div className="projection-chart-container">
          {projectionLoading ? (
            <div className="chart-loading-box">
              <LoadingSpinner size="sm" message="Recalculating projection..." />
            </div>
          ) : timelineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={timelineChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#273B2F' : '#E5F0DF'} />
                <XAxis dataKey="label" stroke={isDark ? '#A3BBAA' : '#556B5B'} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? '#A3BBAA' : '#556B5B'} fontSize={11} tickLine={false} width={45} />
                <Tooltip
                  formatter={(val, name) => [`${val} ${unitLabel}`, name === 'weekly' ? 'Weekly CO₂e' : name === 'cumulative' ? 'Accumulated' : name === 'projected' ? 'Projected Finish' : 'Target Ceiling']}
                  contentStyle={{
                    backgroundColor: isDark ? '#17241D' : '#FFFFFF',
                    borderRadius: '8px',
                    border: isDark ? '1px solid #273B2F' : '1px solid #D7E6CE',
                    color: isDark ? '#EDF5EE' : '#1D2E24',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine
                  y={Number(activeGoal.targetCo2eKg)}
                  stroke="var(--accent-coral)"
                  strokeDasharray="4 4"
                  label={{ value: 'Target', position: 'top', fill: 'var(--accent-coral)', fontSize: 10 }}
                />
                <Bar dataKey="weekly" fill="var(--mint-accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Line type="monotone" dataKey="cumulative" stroke="var(--forest-primary)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="projected" stroke="var(--accent-amber)" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-placeholder-compact">
              <p>Log weekly activities to reveal your projected trajectory.</p>
            </div>
          )}
        </div>
      </div>

      {/* Widget Footer */}
      <div className="goal-widget-footer">
        <Link to="/goals" className="btn btn-ghost btn-sm">
          <span>Manage All Goals</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

