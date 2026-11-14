import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Calendar,
  BarChart2,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from './LoadingSpinner';

const STATUS_CONFIGS = {
  ON_TRACK: {
    label: 'On Track',
    badgeClass: 'proj-status-ontrack',
    icon: CheckCircle2,
    tone: 'positive'
  },
  AT_RISK: {
    label: 'At Risk',
    badgeClass: 'proj-status-atrisk',
    icon: AlertTriangle,
    tone: 'caution'
  },
  OFF_TRACK: {
    label: 'Off Track',
    badgeClass: 'proj-status-offtrack',
    icon: AlertCircle,
    tone: 'warning'
  },
  TARGET_ACHIEVED: {
    label: 'Target Achieved',
    badgeClass: 'proj-status-ontrack',
    icon: CheckCircle2,
    tone: 'positive'
  },
  INSUFFICIENT_DATA: {
    label: 'Insufficient Data',
    badgeClass: 'proj-status-insufficient',
    icon: Info,
    tone: 'neutral'
  }
};

const TREND_CONFIGS = {
  INCREASING: {
    label: 'Increasing',
    icon: TrendingUp,
    badgeClass: 'trend-increasing',
    ariaLabel: 'Recent emission trend is increasing'
  },
  DECREASING: {
    label: 'Decreasing',
    icon: TrendingDown,
    badgeClass: 'trend-decreasing',
    ariaLabel: 'Recent emission trend is decreasing'
  },
  STABLE: {
    label: 'Stable',
    icon: Minus,
    badgeClass: 'trend-stable',
    ariaLabel: 'Recent emission trend is stable'
  },
  INSUFFICIENT_DATA: {
    label: 'Insufficient Data',
    icon: HelpCircle,
    badgeClass: 'trend-insufficient',
    ariaLabel: 'Insufficient data for trend'
  }
};

function getStatusConfig(status) {
  const key = (status || '').toUpperCase().trim();
  return STATUS_CONFIGS[key] || STATUS_CONFIGS.INSUFFICIENT_DATA;
}

function getTrendConfig(trend) {
  const key = (trend || '').toUpperCase().trim();
  return TREND_CONFIGS[key] || TREND_CONFIGS.INSUFFICIENT_DATA;
}

function formatEmissionNumber(valueInKg, isTonnes) {
  if (valueInKg === null || valueInKg === undefined || !Number.isFinite(Number(valueInKg))) {
    return null;
  }

  const value = Number(valueInKg) / (isTonnes ? 1000 : 1);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: isTonnes ? 3 : 2,
    maximumFractionDigits: isTonnes ? 3 : 2
  });
}

function toLocalDateKey(value) {
  if (!value) return null;

  // Date-only API values should not be converted through UTC.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getActivityDate(activity) {
  return (
    activity?.logDate ||
    activity?.activityDate ||
    activity?.date ||
    activity?.timestamp ||
    activity?.createdAt ||
    null
  );
}

function getActivityEmissionKg(activity) {
  const possibleValues = [
    activity?.co2eKg,
    activity?.totalCo2eKg,
    activity?.emissionsKg,
    activity?.emissionKg,
    activity?.co2e
  ];

  const value = possibleValues.find(
    (candidate) => candidate !== null && candidate !== undefined && candidate !== ''
  );

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDateDifferenceInDays(startKey, endKey) {
  const [sy, sm, sd] = startKey.split('-').map(Number);
  const [ey, em, ed] = endKey.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / 86400000);
}

export default function GoalProjectionSection({
  goal,
  preferredUnit,
  recentActivities = [],
  activitiesLoading = false,
  activitiesError = null,

}) {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const isTonnes = preferredUnit === 'TONNES_CO2E';
  const unitLabel = isTonnes ? 'Tonnes CO₂e' : 'kg CO₂e';
  const goalId = goal?.id;

  const todayKey = useMemo(() => toLocalDateKey(new Date()), []);

  // ── Fetch projection from the backend ──────────────────────────────
  const loadProjection = useCallback(
    async (force = false) => {
      if (!goalId) return;
      if (!force && hasFetched) return;

      setLoading(true);
      setError(null);

      try {
        const data = await api.goals.getProjection(goalId);
        setProjection(data);
        setHasFetched(true);
      } catch (err) {
        console.error(`[GoalProjectionSection] Failed to load projection for goal ${goalId}:`, err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load projection.');
      } finally {
        setLoading(false);
      }
    },
    [goalId, hasFetched]
  );

  const remainingDays = useMemo(() => {
    const endKey = toLocalDateKey(goal?.endDate);
    if (!endKey || !todayKey) return 0;
    return Math.max(0, getDateDifferenceInDays(todayKey, endKey));
  }, [goal?.endDate, todayKey]);

  // Aggregate raw activity records into seven local calendar days.
  const recentSeven = useMemo(() => {
    const totalsByDate = new Map();
    const loggedDates = new Set();

    if (Array.isArray(recentActivities)) {
      recentActivities.forEach((activity) => {
        const dateKey = toLocalDateKey(getActivityDate(activity));
        if (!dateKey) return;

        const kg = getActivityEmissionKg(activity);
        totalsByDate.set(dateKey, (totalsByDate.get(dateKey) || 0) + kg);
        loggedDates.add(dateKey);
      });
    }

    const today = new Date();
    const rows = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const dateKey = toLocalDateKey(date);
      const kg = totalsByDate.get(dateKey) || 0;

      rows.push({
        date: dateKey,
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
        fullDate: date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        kg,
        emissions: isTonnes ? kg / 1000 : kg
      });
    }

    return {
      rows,
      loggedDayCount: rows.filter((row) => loggedDates.has(row.date)).length
    };
  }, [recentActivities, isTonnes]);

  const averageDailyEmissionsKg = useMemo(() => {
    return recentSeven.rows.reduce((sum, row) => sum + row.kg, 0) / 7;
  }, [recentSeven]);

  const dailyAllowanceKg = useMemo(() => {
    if (!projection || remainingDays <= 0) return projection ? 0 : null;

    const remainingBudget = Number(projection.remainingBudgetKg);
    if (!Number.isFinite(remainingBudget)) return null;

    return Math.max(0, remainingBudget) / remainingDays;
  }, [projection, remainingDays]);

  const dailyReductionRequiredKg = useMemo(() => {
    if (dailyAllowanceKg === null || recentSeven.loggedDayCount < 3) return null;
    return Math.max(0, averageDailyEmissionsKg - dailyAllowanceKg);
  }, [dailyAllowanceKg, averageDailyEmissionsKg, recentSeven.loggedDayCount]);

  const derivedStatus = useMemo(() => {
    if (!projection || recentSeven.loggedDayCount < 3) return 'INSUFFICIENT_DATA';

    const remainingBudget = Number(projection.remainingBudgetKg);
    if (!Number.isFinite(remainingBudget)) return 'INSUFFICIENT_DATA';

    if (remainingBudget < -0.0001) return 'OFF_TRACK';
    if (remainingBudget <= 0.0001) return 'TARGET_ACHIEVED';
    if (dailyReductionRequiredKg > 0) return 'AT_RISK';
    return 'ON_TRACK';
  }, [projection, recentSeven.loggedDayCount, dailyReductionRequiredKg]);

  const derivedTrend = useMemo(() => {
    if (recentSeven.loggedDayCount < 3) return 'INSUFFICIENT_DATA';

    const values = recentSeven.rows.map((row) => row.kg);
    const firstHalf = values.slice(0, 3).reduce((sum, value) => sum + value, 0) / 3;
    const secondHalf = values.slice(4).reduce((sum, value) => sum + value, 0) / 3;
    const difference = secondHalf - firstHalf;
    const tolerance = Math.max(0.001, firstHalf * 0.05);

    if (difference > tolerance) return 'INCREASING';
    if (difference < -tolerance) return 'DECREASING';
    return 'STABLE';
  }, [recentSeven]);

  // Track the activity count so we only re-fetch when activities genuinely change.
  const activityCount = Array.isArray(recentActivities) ? recentActivities.length : 0;

  // Refresh projection when the panel is expanded AND activity data finishes loading.
  useEffect(() => {
    if (!isExpanded) return;           // collapsed – do nothing
    if (activitiesLoading) return;      // still loading – wait

    // First expand: normal fetch; subsequent: force-refresh only when activity count changed.
    if (!hasFetched) {
      loadProjection(false);
    } else {
      loadProjection(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, activitiesLoading, activityCount]);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleRetry = (event) => {
    event.stopPropagation();
    loadProjection(true);
  };

  const statusCfg = getStatusConfig(derivedStatus);
  const trendCfg = getTrendConfig(derivedTrend);
  const StatusIcon = statusCfg.icon;
  const TrendIcon = trendCfg.icon;

  const weeklyChartData = useMemo(() => {
    const weeklyEmissions = projection?.weeklyEmissions;
    if (!Array.isArray(weeklyEmissions)) return [];

    return weeklyEmissions.map((item, index) => {
      const rawKg = Number(item?.totalCo2eKg) || 0;
      let label = `Week ${index + 1}`;

      if (item?.weekStart) {
        const dateKey = toLocalDateKey(item.weekStart);
        if (dateKey) {
          const [year, month, day] = dateKey.split('-').map(Number);
          label = new Date(year, month - 1, day).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
          });
        }
      }

      return {
        name: label,
        fullRange: item?.weekStart && item?.weekEnd
          ? `${item.weekStart} to ${item.weekEnd}`
          : label,
        emissions: isTonnes ? rawKg / 1000 : rawKg
      };
    });
  }, [projection?.weeklyEmissions, isTonnes]);

  const currentFormatted = formatEmissionNumber(projection?.currentCo2eKg, isTonnes);
  const targetFormatted = formatEmissionNumber(projection?.targetCo2eKg, isTonnes);
  const remainingFormatted = formatEmissionNumber(projection?.remainingBudgetKg, isTonnes);
  const projectedEndFormatted = formatEmissionNumber(projection?.projectedEndCo2eKg, isTonnes);
  const averageWeeklyFormatted = formatEmissionNumber(projection?.averageWeeklyCo2eKg, isTonnes);
  const isBudgetExceeded =
    projection?.remainingBudgetKg !== null &&
    projection?.remainingBudgetKg !== undefined &&
    Number(projection.remainingBudgetKg) < 0;

  return (
    <div className="goal-projection-wrapper">
      <div className="goal-projection-toggle-row">
        <button
          type="button"
          className={`goal-projection-toggle-btn ${isExpanded ? 'is-active' : ''}`}
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls={`goal-projection-${goalId}`}
        >
          <div className="projection-toggle-title">
            <Sparkles size={15} className="projection-toggle-icon" />
            <span>{isExpanded ? 'Hide Projection & Alerts' : 'View Projection & Alerts'}</span>
          </div>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div
          id={`goal-projection-${goalId}`}
          className="goal-projection-content"
          role="region"
          aria-label={`Projection and alerts for goal ${goal?.title || ''}`}
        >
          {loading && !projection ? (
            <div className="projection-loading-state">
              <LoadingSpinner size="sm" message="Analyzing emissions and calculating projection..." />
            </div>
          ) : error ? (
            <div className="projection-error-banner" role="alert">
              <div className="projection-error-body">
                <AlertCircle size={18} className="projection-error-icon" />
                <span className="projection-error-text">{error}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-xs projection-retry-btn"
                onClick={handleRetry}
                disabled={loading}
              >
                <RotateCw size={12} className={loading ? 'spin' : ''} />
                <span>Retry</span>
              </button>
            </div>
          ) : projection ? (
            <div className="projection-details-container">
              <div className="projection-meta-bar">
                <div className="projection-status-group">
                  <span className={`projection-status-badge ${statusCfg.badgeClass}`}>
                    <StatusIcon size={14} />
                    <span>{statusCfg.label}</span>
                  </span>
                  <span
                    className={`projection-trend-badge ${trendCfg.badgeClass}`}
                    title={trendCfg.ariaLabel}
                  >
                    <TrendIcon size={13} />
                    <span>Trend: {trendCfg.label}</span>
                  </span>
                </div>

                <div className="projection-actions-group">
                  {projection.projectionDate && (
                    <span className="projection-date-pill">
                      <Calendar size={12} />
                      <span>As of {projection.projectionDate}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    className="projection-refresh-btn"
                    title="Refresh Projection"
                    onClick={() => loadProjection(true)}
                    disabled={loading}
                  >
                    <RotateCw size={13} className={loading ? 'spin' : ''} />
                  </button>
                </div>
              </div>

              {projection.alertMessage?.trim() ? (
                <div
                  className={`projection-alert-card alert-tone-${statusCfg.tone}`}
                  role="status"
                  aria-live="polite"
                >
                  <div className="projection-alert-icon-col">
                    <StatusIcon size={18} />
                  </div>
                  <div className="projection-alert-text-col">
                    <strong className="projection-alert-label">
                      {statusCfg.tone === 'positive'
                        ? 'Goal Update'
                        : statusCfg.tone === 'caution'
                          ? 'Cautionary Alert'
                          : statusCfg.tone === 'warning'
                            ? 'Emissions Alert'
                            : 'Projection Notice'}
                    </strong>
                    <p className="projection-alert-msg">{projection.alertMessage}</p>
                  </div>
                </div>
              ) : null}

              <div className="projection-metrics-grid">
                <div className="projection-metric-cell">
                  <span className="proj-metric-label">Current Logged</span>
                  <div className="proj-metric-val-wrap">
                    <span className="proj-metric-val">{currentFormatted ?? '—'}</span>
                    <span className="proj-metric-unit">{unitLabel}</span>
                  </div>
                </div>

                <div className="projection-metric-cell">
                  <span className="proj-metric-label">Target Budget</span>
                  <div className="proj-metric-val-wrap">
                    <span className="proj-metric-val">{targetFormatted ?? '—'}</span>
                    <span className="proj-metric-unit">{unitLabel}</span>
                  </div>
                </div>

                <div className="projection-metric-cell">
                  <span className="proj-metric-label">
                    {isBudgetExceeded ? 'Amount Exceeded' : 'Remaining Budget'}
                  </span>
                  <div className="proj-metric-val-wrap">
                    {isBudgetExceeded ? (
                      <>
                        <span className="proj-metric-val text-coral font-bold">
                          +{formatEmissionNumber(Math.abs(Number(projection.remainingBudgetKg)), isTonnes)}
                        </span>
                        <span className="proj-metric-unit text-coral">{unitLabel} over</span>
                      </>
                    ) : (
                      <>
                        <span className="proj-metric-val text-emerald font-bold">
                          {remainingFormatted ?? '—'}
                        </span>
                        <span className="proj-metric-unit">{unitLabel}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="projection-metric-cell">
                  <span className="proj-metric-label">Projected at End</span>
                  <div className="proj-metric-val-wrap">
                    <span className={`proj-metric-val ${projectedEndFormatted === null ? 'text-muted' : ''}`}>
                      {projectedEndFormatted ?? 'Not available'}
                    </span>
                    {projectedEndFormatted !== null && (
                      <span className="proj-metric-unit">{unitLabel}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* New daily guidance - displayed directly in the expanded section. */}
              <section className="daily-guidance-section" aria-label="Daily emissions guidance">
                <div className="daily-guidance-grid">
                  <div className="projection-metric-cell">
                    <span className="proj-metric-label">Daily Allowance</span>
                    <div className="proj-metric-val-wrap">
                      <span className="proj-metric-val">
                        {dailyAllowanceKg === null ? '—' : formatEmissionNumber(dailyAllowanceKg, isTonnes)}
                      </span>
                      <span className="proj-metric-unit">{unitLabel}/day</span>
                    </div>
                  </div>
                  <div className="projection-metric-cell">
                    <span className="proj-metric-label">Average Daily Emissions (7 days)</span>
                    <div className="proj-metric-val-wrap">
                      <span className="proj-metric-val">
                        {activitiesLoading ? 'Loading…' : formatEmissionNumber(averageDailyEmissionsKg, isTonnes)}
                      </span>
                      <span className="proj-metric-unit">{unitLabel}/day</span>
                    </div>
                  </div>
                  <div className="projection-metric-cell">
                    <span className="proj-metric-label">Daily Reduction Required</span>
                    <div className="proj-metric-val-wrap">
                      <span className={`proj-metric-val ${dailyReductionRequiredKg > 0 ? 'text-coral font-bold' : ''}`}>
                        {dailyReductionRequiredKg === null
                          ? '—'
                          : formatEmissionNumber(dailyReductionRequiredKg, isTonnes)}
                      </span>
                      <span className="proj-metric-unit">{unitLabel}/day</span>
                    </div>
                  </div>
                </div>

                {activitiesError ? (
                  <div className="projection-chart-empty" role="alert">
                    Activity history could not be loaded: {activitiesError}
                  </div>
                ) : recentSeven.loggedDayCount < 3 ? (
                  <div className="daily-guidance-alert alert-insufficient" role="status">
                    <span className="daily-guidance-alert-title">Insufficient Activity Data</span>
                    <p className="daily-guidance-alert-body">
                      Log activities on at least 3 different days to calculate a reliable daily reduction and trend.
                      Current recorded days: {recentSeven.loggedDayCount} of 7.
                    </p>
                  </div>
                ) : dailyReductionRequiredKg > 0 ? (
                  <div className="daily-guidance-alert alert-reduction-needed" role="status">
                    <p className="daily-guidance-alert-body">
                      Reduce your average daily emissions by {formatEmissionNumber(dailyReductionRequiredKg, isTonnes)} {unitLabel}/day to stay within this goal budget.
                    </p>
                  </div>
                ) : (
                  <div className="daily-guidance-alert alert-within-allowance" role="status">
                    <p className="daily-guidance-alert-body">
                      Your seven-day average is within the daily allowance for this goal.
                    </p>
                  </div>
                )}

                <div className="projection-chart-section">
                  <div className="projection-chart-header">
                    <div className="projection-chart-header-left">
                      <BarChart2 size={15} className="text-forest" />
                      <span className="projection-chart-title">Seven-Day Daily Emissions Trend</span>
                    </div>
                    <span className="projection-chart-unit-tag">Units: {unitLabel}</span>
                  </div>

                  {activitiesLoading ? (
                    <div className="projection-chart-empty">
                      <LoadingSpinner size="sm" message="Loading recent activity…" />
                    </div>
                  ) : recentSeven.rows.length === 7 ? (
                    <div className="projection-chart-container" style={{ height: 190 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={recentSeven.rows} margin={{ top: 10, right: 14, left: 10, bottom: 4 }}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? '#273B2F' : '#E5F0DF'}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            stroke={isDark ? '#A3BBAA' : '#556B5B'}
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: isDark ? '#273B2F' : '#E5F0DF' }}
                          />
                          <YAxis
                            stroke={isDark ? '#A3BBAA' : '#556B5B'}
                            fontSize={11}
                            tickLine={false}
                            width={48}
                            axisLine={{ stroke: isDark ? '#273B2F' : '#E5F0DF' }}
                            tickFormatter={(value) => formatEmissionNumber(value * (isTonnes ? 1000 : 1), isTonnes)}
                          />
                          <Tooltip
                            cursor={{ fill: isDark ? 'rgba(61, 168, 104, 0.08)' : 'rgba(36, 75, 53, 0.05)' }}
                            isAnimationActive={false}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const item = payload[0].payload;
                              return (
                                <div className="projection-chart-tooltip">
                                  <span className="tooltip-range">{item.fullDate || item.label}</span>
                                  <span className="tooltip-value">
                                    <strong>{Number(item.emissions).toFixed(isTonnes ? 3 : 2)}</strong> {unitLabel}
                                  </span>
                                </div>
                              );
                            }}
                          />
                          <Bar
                            dataKey="emissions"
                            name="Daily emissions"
                            fill={isDark ? '#3DA868' : '#244B35'}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={38}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="projection-chart-empty">
                      <Calendar size={18} className="text-faint" />
                      <span>No daily activity data is available for this period yet.</span>
                    </div>
                  )}
                </div>
              </section>

              <button
                type="button"
                className={`projection-details-subtoggle-btn ${showDetails ? 'is-active' : ''}`}
                onClick={() => setShowDetails((previous) => !previous)}
                aria-expanded={showDetails}
                aria-controls={`goal-projection-details-${goalId}`}
              >
                <span>{showDetails ? 'Hide Weekly Chart & Analysis' : 'View Weekly Chart & Analysis'}</span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showDetails && (
                <div
                  id={`goal-projection-details-${goalId}`}
                  className="projection-secondary-details"
                >
                  {projection.explanation?.trim() ? (
                    <div className="projection-explanation-card">
                      <span className="projection-explanation-title">Analysis</span>
                      <p className="projection-explanation-body">{projection.explanation}</p>
                    </div>
                  ) : null}

                  <div className="projection-secondary-metric-row">
                    <span className="projection-secondary-metric-label">Avg Weekly Emissions:</span>
                    <span className="projection-secondary-metric-val">
                      <strong>{averageWeeklyFormatted ?? 'Not available'}</strong>
                      {averageWeeklyFormatted !== null && ` ${unitLabel} / wk`}
                    </span>
                  </div>

                  <div className="projection-chart-section">
                    <div className="projection-chart-header">
                      <div className="projection-chart-header-left">
                        <BarChart2 size={15} className="text-forest" />
                        <span className="projection-chart-title">Weekly Emissions Breakdown</span>
                      </div>
                      <span className="projection-chart-unit-tag">Units: {unitLabel}</span>
                    </div>

                    {weeklyChartData.length > 0 ? (
                      <div className="projection-chart-container">
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={weeklyChartData} margin={{ top: 12, right: 14, left: 10, bottom: 4 }}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={isDark ? '#273B2F' : '#E5F0DF'}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              stroke={isDark ? '#A3BBAA' : '#556B5B'}
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: isDark ? '#273B2F' : '#E5F0DF' }}
                            />
                            <YAxis
                              stroke={isDark ? '#A3BBAA' : '#556B5B'}
                              fontSize={11}
                              tickLine={false}
                              width={48}
                              axisLine={{ stroke: isDark ? '#273B2F' : '#E5F0DF' }}
                              tickFormatter={(value) =>
                                formatEmissionNumber(value * (isTonnes ? 1000 : 1), isTonnes)
                              }
                            />
                            <Tooltip
                              cursor={{ fill: isDark ? 'rgba(61, 168, 104, 0.08)' : 'rgba(36, 75, 53, 0.05)' }}
                              isAnimationActive={false}
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const item = payload[0].payload;
                                return (
                                  <div className="projection-chart-tooltip">
                                    <span className="tooltip-range">{item.fullRange}</span>
                                    <span className="tooltip-value">
                                      <strong>{Number(item.emissions).toFixed(isTonnes ? 3 : 2)}</strong> {unitLabel}
                                    </span>
                                  </div>
                                );
                              }}
                            />
                            <Bar
                              dataKey="emissions"
                              fill={isDark ? '#3DA868' : '#244B35'}
                              radius={[4, 4, 0, 0]}
                              maxBarSize={42}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="projection-chart-empty">
                        <Calendar size={18} className="text-faint" />
                        <span>No weekly emission intervals recorded during this period yet.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
