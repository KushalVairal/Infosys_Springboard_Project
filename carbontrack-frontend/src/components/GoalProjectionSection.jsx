import React, { useState, useCallback, useMemo } from 'react';
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
    tone: 'positive',
    subtext: 'Within Target Budget'
  },
  AT_RISK: {
    label: 'At Risk',
    badgeClass: 'proj-status-atrisk',
    icon: AlertTriangle,
    tone: 'caution',
    subtext: 'Nearing Budget Limit'
  },
  OFF_TRACK: {
    label: 'Off Track',
    badgeClass: 'proj-status-offtrack',
    icon: AlertCircle,
    tone: 'warning',
    subtext: 'Budget Exceeded'
  },
  INSUFFICIENT_DATA: {
    label: 'Insufficient Data',
    badgeClass: 'proj-status-insufficient',
    icon: Info,
    tone: 'neutral',
    subtext: 'Awaiting sufficient logs'
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
  return (
    STATUS_CONFIGS[key] || {
      label: key ? key.replace(/_/g, ' ') : 'Pending',
      badgeClass: 'proj-status-insufficient',
      icon: HelpCircle,
      tone: 'neutral',
      subtext: ''
    }
  );
}

function getTrendConfig(trend) {
  const key = (trend || '').toUpperCase().trim();
  return (
    TREND_CONFIGS[key] || {
      label: key ? key.replace(/_/g, ' ') : 'N/A',
      icon: HelpCircle,
      badgeClass: 'trend-insufficient',
      ariaLabel: 'Trend information not available'
    }
  );
}

function formatEmissionNumber(valInKg, isTonnes) {
  if (valInKg === null || valInKg === undefined || isNaN(Number(valInKg))) {
    return null;
  }
  const raw = Number(valInKg);
  const converted = isTonnes ? raw / 1000 : raw;
  const decimals = isTonnes ? 3 : 2;
  return converted.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export default function GoalProjectionSection({ goal, preferredUnit }) {
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

  const loadProjection = useCallback(
    async (force = false) => {
      if (!goalId) return;
      if (hasFetched && !force) return;

      try {
        setLoading(true);
        setError(null);
        const data = await api.goals.getProjection(goalId);
        setProjection(data);
        setHasFetched(true);
      } catch (err) {
        setError(err.message || 'Failed to retrieve projection details for this goal.');
      } finally {
        setLoading(false);
      }
    },
    [goalId, hasFetched]
  );

  const handleToggle = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState && !hasFetched) {
      loadProjection();
    }
  };

  const handleRetry = (e) => {
    e.stopPropagation();
    loadProjection(true);
  };

  // Safe mappings
  const statusCfg = useMemo(
    () => getStatusConfig(projection?.projectionStatus),
    [projection?.projectionStatus]
  );
  const trendCfg = useMemo(
    () => getTrendConfig(projection?.recentTrend),
    [projection?.recentTrend]
  );

  const StatusIcon = statusCfg.icon;
  const TrendIcon = trendCfg.icon;

  // Chart data normalization
  const weeklyEmissions = projection?.weeklyEmissions;
  const chartData = useMemo(() => {
    if (!Array.isArray(weeklyEmissions) || weeklyEmissions.length === 0) {
      return [];
    }

    return weeklyEmissions.map((item, index) => {
      const rawKg = Number(item.totalCo2eKg) || 0;
      const converted = isTonnes ? Number((rawKg / 1000).toFixed(4)) : Number(rawKg.toFixed(2));

      let displayLabel = `W${index + 1}`;
      let dateRange = '';

      if (item.weekStart && item.weekEnd) {
        dateRange = `${item.weekStart} to ${item.weekEnd}`;
        try {
          const sParts = item.weekStart.split('-');
          if (sParts.length === 3) {
            const sDate = new Date(Number(sParts[0]), Number(sParts[1]) - 1, Number(sParts[2]));
            displayLabel = `${sDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
          }
        } catch {
          displayLabel = item.weekStart.slice(5);
        }
      }

      return {
        name: displayLabel,
        fullRange: dateRange,
        emissions: converted,
        rawKg
      };
    });
  }, [weeklyEmissions, isTonnes]);

  // Formatted Metric Values
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
              {/* Header status bar */}
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

              {/* Alert Message Banner (Rendered only when present and non-empty) */}
              {projection.alertMessage && projection.alertMessage.trim() ? (
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

              {/* Key Metrics Mini-Grid (4 cells: Current, Target, Remaining/Exceeded, Projected at End) */}
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
                    ) : projection.remainingBudgetKg !== null && Math.abs(Number(projection.remainingBudgetKg)) <= 0.0001 ? (
                      <>
                        <span className="proj-metric-val text-emerald font-bold">0.00</span>
                        <span className="proj-metric-unit">{unitLabel} (Used)</span>
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
                    <span
                      className={`proj-metric-val ${
                        projectedEndFormatted === null ? 'text-muted' : ''
                      }`}
                    >
                      {projectedEndFormatted ?? 'Not available'}
                    </span>
                    {projectedEndFormatted !== null && (
                      <span className="proj-metric-unit">{unitLabel}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Secondary Details Disclosure Toggle */}
              <button
                type="button"
                className="projection-details-subtoggle-btn"
                onClick={() => setShowDetails((prev) => !prev)}
                aria-expanded={showDetails}
                aria-controls={`goal-projection-details-${goalId}`}
              >
                <span>
                  {showDetails ? 'Hide Weekly Chart & Analysis' : 'View Weekly Chart & Analysis'}
                </span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {/* Secondary Details Section (Analysis, Weekly Avg, Weekly Recharts Chart) */}
              {showDetails && (
                <div
                  id={`goal-projection-details-${goalId}`}
                  className="projection-secondary-details"
                >
                  {/* Backend Analysis Explanation */}
                  {projection.explanation && projection.explanation.trim() ? (
                    <div className="projection-explanation-card">
                      <span className="projection-explanation-title">Analysis</span>
                      <p className="projection-explanation-body">{projection.explanation}</p>
                    </div>
                  ) : null}

                  {/* Average Weekly Rate */}
                  <div className="projection-secondary-metric-row">
                    <span className="projection-secondary-metric-label">Avg Weekly Emissions:</span>
                    <span className="projection-secondary-metric-val">
                      <strong>{averageWeeklyFormatted ?? 'Not available'}</strong>
                      {averageWeeklyFormatted !== null && ` ${unitLabel} / wk`}
                    </span>
                  </div>

                  {/* Weekly Emissions Chart */}
                  <div className="projection-chart-section">
                    <div className="projection-chart-header">
                      <div className="projection-chart-header-left">
                        <BarChart2 size={15} className="text-forest" />
                        <span className="projection-chart-title">Weekly Emissions Breakdown</span>
                      </div>
                      <span className="projection-chart-unit-tag">Units: {unitLabel}</span>
                    </div>

                    {chartData.length > 0 ? (
                      <div className="projection-chart-container">
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart
                            data={chartData}
                            margin={{ top: 12, right: 12, left: -15, bottom: 4 }}
                          >
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
                              width={38}
                              axisLine={{ stroke: isDark ? '#273B2F' : '#E5F0DF' }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const item = payload[0].payload;
                                return (
                                  <div className="projection-chart-tooltip">
                                    <span className="tooltip-range">
                                      {item.fullRange || item.name}
                                    </span>
                                    <span className="tooltip-value">
                                      <strong>{item.emissions}</strong> {unitLabel}
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
