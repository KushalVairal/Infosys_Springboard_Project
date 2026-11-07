import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import { CategoryBadge, EmissionBadge } from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import GoalTrackingWidget from '../components/GoalTrackingWidget';
import QuickLogCarousel from '../components/QuickLogCarousel';
import {
  PlusCircle,
  Activity,
  Flame,
  Target,
  Award,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { getCategoryColor } from '../data/categories';
import { ACTIVITY_CATALOG } from './ActivitiesPage';

export default function DashboardPage() {
  const { user, profile, preferredUnit } = useAuth();
  const { isDark } = useTheme();
  const isTonnes = preferredUnit === 'TONNES_CO2E';
  const unitLabel = isTonnes ? 't CO₂e' : 'kg CO₂e';

  // Data states
  const [activities, setActivities] = useState([]);
  const [dailyAnalytics, setDailyAnalytics] = useState([]);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Quick Log Modal State for Dashboard
  const [isQuickLogModalOpen, setIsQuickLogModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('TRANSPORT');
  const [modalActivityType, setModalActivityType] = useState('CAR_PETROL');
  const [modalQuantity, setModalQuantity] = useState('');
  const [modalUnit, setModalUnit] = useState('km');
  const [modalDate, setModalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState(null);

  const getTodayString = () => new Date().toISOString().slice(0, 10);

  // Main data loader
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      // 30 days ago for daily
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

      // 8 weeks ago for weekly
      const eightWeeksAgo = new Date(today);
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      const eightWeeksAgoStr = eightWeeksAgo.toISOString().slice(0, 10);

      // 6 months ago for monthly
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

      // Parallel fetch across all Spring Boot endpoints (Tasks 3.2 & 3.3)
      const [
        activityData,
        dailyData,
        weeklyData,
        monthlyData,
        goalData,
        recData
      ] = await Promise.all([
        api.activities.getMyActivities().catch(() => []),
        api.analytics.getDaily(thirtyDaysAgoStr, todayStr).catch(() => []),
        api.analytics.getWeekly(eightWeeksAgoStr, todayStr).catch(() => []),
        api.analytics.getMonthly(sixMonthsAgoStr, todayStr).catch(() => []),
        api.goals.getMyGoals().catch(() => []),
        api.recommendations.getWeekly().catch(() => null)
      ]);

      setActivities(Array.isArray(activityData) ? activityData : []);
      setDailyAnalytics(Array.isArray(dailyData) ? dailyData : []);
      setWeeklyAnalytics(Array.isArray(weeklyData) ? weeklyData : []);
      setMonthlyAnalytics(Array.isArray(monthlyData) ? monthlyData : []);
      setGoals(Array.isArray(goalData) ? goalData : []);

      if (recData && Array.isArray(recData.recommendations)) {
        setRecommendations(recData.recommendations);
      } else {
        setRecommendations([]);
      }

      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load your dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  // Requirement 1 & 2: Today's carbon footprint (total daily emissions in kg CO₂e)
  const todayMetrics = useMemo(() => {
    const todayStr = getTodayString();
    let todayKg = 0;
    const catMap = { TRANSPORT: 0, ELECTRICITY: 0, FOOD: 0, SHOPPING: 0 };

    // 1. Check daily analytics records for today
    const todayDaily = dailyAnalytics.filter((d) => d.date === todayStr);
    if (todayDaily.length > 0) {
      todayDaily.forEach((d) => {
        const val = Number(d.totalCo2eKg) || 0;
        todayKg += val;
        const cat = (d.category || 'OTHER').toUpperCase();
        if (catMap[cat] !== undefined) catMap[cat] += val;
      });
    } else {
      // 2. Fallback to direct activities for today if analytics aggregation cache is not yet warmed
      activities
        .filter((a) => a.logDate === todayStr)
        .forEach((a) => {
          const val = Number(a.co2eKg) || 0;
          todayKg += val;
          const cat = (a.category || 'OTHER').toUpperCase();
          if (catMap[cat] !== undefined) catMap[cat] += val;
        });
    }

    const displayToday = isTonnes ? (todayKg / 1000).toFixed(3) : todayKg.toFixed(2);
    return {
      todayKg,
      displayToday,
      catMap
    };
  }, [dailyAnalytics, activities, isTonnes]);

  // Total overall emissions metrics
  const overallMetrics = useMemo(() => {
    let totalKg = 0;
    const catMap = { TRANSPORT: 0, ELECTRICITY: 0, FOOD: 0, SHOPPING: 0 };

    activities.forEach((act) => {
      const co2 = Number(act.co2eKg) || 0;
      totalKg += co2;
      const cat = (act.category || 'OTHER').toUpperCase();
      if (catMap[cat] !== undefined) {
        catMap[cat] += co2;
      }
    });

    const displayTotal = isTonnes ? (totalKg / 1000).toFixed(3) : totalKg.toFixed(2);
    return {
      totalKg,
      displayTotal,
      activityCount: activities.length,
      catMap
    };
  }, [activities, isTonnes]);

  // Requirement 3 & 4: Category-wise footprint breakdown & Recharts Pie chart
  const categoryChartData = useMemo(() => {
    const data = Object.entries(overallMetrics.catMap)
      .filter(([, val]) => val > 0)
      .map(([name, value]) => ({
        name: name.charAt(0) + name.slice(1).toLowerCase(),
        key: name,
        value: Number(value.toFixed(2)),
        percentage: overallMetrics.totalKg > 0 ? ((value / overallMetrics.totalKg) * 100).toFixed(1) : 0
      }));

    return data;
  }, [overallMetrics]);

  // Requirement 5 & 6: Weekly emissions comparison (Current week vs Previous week)
  const weeklyComparison = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Current week day index (0 = Sun, 1 = Mon ... 6 = Sat)
    // Align with Monday as start of week
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon
    const daysSinceMon = (dayOfWeek + 6) % 7;

    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - daysSinceMon);

    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(currentWeekStart.getDate() - 7);

    const prevWeekEnd = new Date(currentWeekStart);
    prevWeekEnd.setDate(currentWeekStart.getDate() - 1);

    const currentWeekStartStr = currentWeekStart.toISOString().slice(0, 10);
    const prevWeekStartStr = prevWeekStart.toISOString().slice(0, 10);
    const prevWeekEndStr = prevWeekEnd.toISOString().slice(0, 10);

    let currentWeekKg = 0;
    let prevWeekKg = 0;

    // Day-by-day lookup maps (0=Mon ... 6=Sun)
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentWeekDays = [0, 0, 0, 0, 0, 0, 0];
    const prevWeekDays = [0, 0, 0, 0, 0, 0, 0];

    activities.forEach((act) => {
      const actDate = act.logDate;
      const co2 = Number(act.co2eKg) || 0;

      if (actDate >= currentWeekStartStr) {
        currentWeekKg += co2;
        const d = new Date(actDate);
        const dayIdx = (d.getDay() + 6) % 7;
        currentWeekDays[dayIdx] += co2;
      } else if (actDate >= prevWeekStartStr && actDate <= prevWeekEndStr) {
        prevWeekKg += co2;
        const d = new Date(actDate);
        const dayIdx = (d.getDay() + 6) % 7;
        prevWeekDays[dayIdx] += co2;
      }
    });

    // Also factor in weekly analytics if available
    if (weeklyAnalytics.length >= 2 && currentWeekKg === 0 && prevWeekKg === 0) {
      const sorted = [...weeklyAnalytics].sort((a, b) => new Date(b.weekStartDate) - new Date(a.weekStartDate));
      currentWeekKg = Number(sorted[0]?.totalCo2eKg) || 0;
      prevWeekKg = Number(sorted[1]?.totalCo2eKg) || 0;
    }

    // Chart dataset: Day-by-day comparison line chart
    const chartData = dayLabels.map((day, idx) => ({
      day,
      currentWeek: Number(currentWeekDays[idx].toFixed(2)),
      previousWeek: Number(prevWeekDays[idx].toFixed(2))
    }));

    // % Change calculation: negative is good (reduction!), positive is increase
    let pctChange = 0;
    let isReduction = true;
    if (prevWeekKg > 0) {
      pctChange = ((currentWeekKg - prevWeekKg) / prevWeekKg) * 100;
      isReduction = pctChange <= 0;
    }

    return {
      currentWeekKg,
      prevWeekKg,
      displayCurrentWeek: isTonnes ? (currentWeekKg / 1000).toFixed(3) : currentWeekKg.toFixed(2),
      displayPrevWeek: isTonnes ? (prevWeekKg / 1000).toFixed(3) : prevWeekKg.toFixed(2),
      pctChange: Math.abs(pctChange).toFixed(1),
      isReduction,
      chartData
    };
  }, [activities, weeklyAnalytics, isTonnes]);

  // Requirement 7, 8, 9: Monthly cumulative progress bar (total monthly emissions vs target)
  const monthlyProgress = useMemo(() => {
    const today = new Date();
    const currentYearMonth = today.toISOString().slice(0, 7); // "YYYY-MM"
    const currentMonthStart = `${currentYearMonth}-01`;

    let currentMonthKg = 0;

    // Check monthly analytics
    const monthlyRecord = monthlyAnalytics.find((m) => m.monthStartDate?.startsWith(currentYearMonth));
    if (monthlyRecord) {
      currentMonthKg = Number(monthlyRecord.totalCo2eKg) || 0;
    } else {
      // Sum from activities within this month
      activities
        .filter((a) => a.logDate && a.logDate.startsWith(currentYearMonth))
        .forEach((a) => {
          currentMonthKg += Number(a.co2eKg) || 0;
        });
    }

    // User's monthly target
    // Check if user has an active goal that sets a target
    const activeGoal = goals.find((g) => g.status === 'ACTIVE' || !g.completed);
    const targetMonthlyKg = activeGoal ? Number(activeGoal.targetCo2eKg) : 150.0; // default 150 kg CO₂e

    const pctUsed = targetMonthlyKg > 0 ? (currentMonthKg / targetMonthlyKg) * 100 : 0;
    const clampedPct = Math.min(100, Math.round(pctUsed));
    const budgetRemainingKg = targetMonthlyKg - currentMonthKg;

    const displayMonthKg = isTonnes ? (currentMonthKg / 1000).toFixed(3) : currentMonthKg.toFixed(2);
    const displayTargetKg = isTonnes ? (targetMonthlyKg / 1000).toFixed(3) : targetMonthlyKg.toFixed(1);
    const displayRemainingKg = isTonnes
      ? (Math.abs(budgetRemainingKg) / 1000).toFixed(3)
      : Math.abs(budgetRemainingKg).toFixed(1);

    const tone = pctUsed > 90 ? 'danger' : pctUsed > 70 ? 'warning' : 'safe';

    const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

    return {
      monthName,
      currentMonthKg,
      targetMonthlyKg,
      displayMonthKg,
      displayTargetKg,
      displayRemainingKg,
      budgetRemainingKg,
      pctUsed: Math.round(pctUsed),
      clampedPct,
      tone,
      isExceeded: budgetRemainingKg < 0
    };
  }, [monthlyAnalytics, activities, goals, isTonnes]);

  // Requirement 14: Refresh dashboard after successful activity logging
  const handleActivityLogged = async (createdActivity) => {
    setActionSuccessNotice(
      `Activity recorded: ${createdActivity.activityType} (${createdActivity.quantity} ${createdActivity.unit}) produced ${createdActivity.co2eKg} kg CO₂e.`
    );
    // Refresh all analytics and activity data from backend
    await loadDashboardData(true);
    setTimeout(() => setActionSuccessNotice(null), 5000);
  };

  // Quick Modal Form category change
  const handleModalCategoryChange = (catKey) => {
    setModalCategory(catKey);
    const firstType = ACTIVITY_CATALOG[catKey]?.types[0];
    if (firstType) {
      setModalActivityType(firstType.id);
      setModalUnit(firstType.unit);
    }
  };

  const handleModalTypeChange = (typeId) => {
    setModalActivityType(typeId);
    const cat = ACTIVITY_CATALOG[modalCategory];
    const match = cat?.types.find((t) => t.id === typeId);
    if (match) setModalUnit(match.unit);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const q = parseFloat(modalQuantity);
    if (isNaN(q) || q <= 0) {
      setModalError('Quantity must be greater than zero.');
      return;
    }

    if (!modalDate || modalDate > getTodayString()) {
      setModalError('Date cannot be empty or in the future.');
      return;
    }

    setModalSubmitting(true);
    try {
      const created = await api.activities.create({
        category: modalCategory,
        activityType: modalActivityType,
        quantity: q,
        unit: modalUnit,
        logDate: modalDate
      });

      setIsQuickLogModalOpen(false);
      setModalQuantity('');
      await handleActivityLogged(created);
    } catch (err) {
      setModalError(err.message || 'Failed to log activity.');
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading-wrapper">
        <LoadingSpinner message="Calculating your comprehensive carbon footprint dashboard..." size="lg" />
      </div>
    );
  }

  const displayName = profile?.fullName || user?.username || profile?.username || 'Eco Champion';

  return (
    <div className="dashboard-page">
      {/* Welcome Banner & Action Row */}
      <div className="dashboard-header-row">
        <div>
          <h1 className="dashboard-title">Welcome back, {displayName}</h1>
          <p className="dashboard-subtitle">
            Personal sustainability dashboard powered by real-time Spring Boot analytics.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Sync'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setModalError('');
              setIsQuickLogModalOpen(true);
            }}
          >
            <PlusCircle size={18} />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessNotice && (
        <div className="activity-success-banner mb-6">
          <div className="success-banner-content">
            <CheckCircle2 size={20} color="var(--forest-primary)" />
            <div>
              <strong>Dashboard Updated!</strong>
              <p>{actionSuccessNotice}</p>
            </div>
          </div>
          <button
            type="button"
            className="banner-dismiss-btn"
            onClick={() => setActionSuccessNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="dashboard-alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards: Today's Footprint + Core Metrics (Requirement 1 & 2) */}
      <div className="metrics-grid">
        {/* Requirement 1 & 2: Today's Carbon Footprint */}
        <div className="metric-card card-primary-highlight">
          <div className="metric-header">
            <span className="metric-title">Today's Footprint</span>
            <span className="metric-icon-bubble">
              <Calendar size={20} color="var(--forest-primary)" />
            </span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{todayMetrics.displayToday}</span>
            <span className="metric-unit">{unitLabel}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">
              {todayMetrics.todayKg > 0
                ? 'Emissions logged today'
                : 'No activities logged today yet'}
            </span>
          </div>
        </div>

        {/* Current Week KPI */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Current Week</span>
            <span className="metric-icon-bubble">
              <Activity size={20} color="var(--forest-primary)" />
            </span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{weeklyComparison.displayCurrentWeek}</span>
            <span className="metric-unit">{unitLabel}</span>
          </div>
          <div className="metric-footer">
            <span className={`trend-badge-inline ${weeklyComparison.isReduction ? 'text-good' : 'text-danger'}`}>
              {weeklyComparison.isReduction ? (
                <TrendingDown size={14} />
              ) : (
                <TrendingUp size={14} />
              )}
              {weeklyComparison.pctChange}% vs last week
            </span>
          </div>
        </div>

        {/* Total Historical Emissions */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Emissions</span>
            <span className="metric-icon-bubble">
              <Flame size={20} color="var(--accent-coral)" />
            </span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{overallMetrics.displayTotal}</span>
            <span className="metric-unit">{unitLabel}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">Across {overallMetrics.activityCount} recorded activities</span>
          </div>
        </div>

        {/* Monthly Target Status */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Monthly Budget Status</span>
            <span className="metric-icon-bubble">
              <Target size={20} color="var(--forest-primary)" />
            </span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{monthlyProgress.pctUsed}%</span>
            <span className="metric-unit">of {monthlyProgress.displayTargetKg} {unitLabel}</span>
          </div>
          <div className="metric-footer">
            <span className={`metric-subtext ${monthlyProgress.isExceeded ? 'text-coral font-medium' : ''}`}>
              {monthlyProgress.isExceeded
                ? `Exceeded by ${monthlyProgress.displayRemainingKg} ${unitLabel}`
                : `${monthlyProgress.displayRemainingKg} ${unitLabel} remaining`}
            </span>
          </div>
        </div>
      </div>

      {/* Requirement 7, 8, 9: Monthly Cumulative Progress Bar Card */}
      <div className="dashboard-card monthly-progress-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-heading">Monthly Cumulative Progress ({monthlyProgress.monthName})</h2>
            <p className="card-subheading">
              Actual monthly emissions compared to your personal target budget
            </p>
          </div>
          <div className="monthly-progress-badge">
            <span className="font-semibold">{monthlyProgress.displayMonthKg}</span> / {monthlyProgress.displayTargetKg} {unitLabel}
          </div>
        </div>

        <div className="monthly-progress-container">
          <div className="progress-bar-large-track" role="progressbar" aria-valuenow={monthlyProgress.clampedPct} aria-valuemin="0" aria-valuemax="100">
            <div
              className={`progress-bar-large-fill tone-${monthlyProgress.tone}`}
              style={{ width: `${monthlyProgress.clampedPct}%` }}
            />
          </div>
          <div className="progress-labels-row">
            <span>0 {unitLabel}</span>
            <span className="progress-status-highlight">
              {monthlyProgress.isExceeded ? (
                <strong className="text-coral">⚠️ Target exceeded by {monthlyProgress.displayRemainingKg} {unitLabel}</strong>
              ) : (
                <strong className="text-forest">✅ {monthlyProgress.displayRemainingKg} {unitLabel} budget remaining ({100 - monthlyProgress.pctUsed}%)</strong>
              )}
            </span>
            <span>Monthly Target: {monthlyProgress.displayTargetKg} {unitLabel}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid: Weekly Comparison (Req 5, 6) + Category Breakdown Pie (Req 3, 4) */}
      <div className="dashboard-charts-grid">
        {/* Requirement 5 & 6: Weekly Emissions Trend Line Chart (Current Week vs Previous Week) */}
        <div className="dashboard-card trend-chart-card">
          <div className="card-header-clean">
            <div>
              <h2 className="card-heading">Weekly Emissions Trend & Comparison</h2>
              <p className="card-subheading">Day-by-day comparison of Current Week vs Previous Week</p>
            </div>
            <div className="weekly-stats-chip">
              <span className="chip-label">Current: <strong>{weeklyComparison.displayCurrentWeek}</strong></span>
              <span className="chip-sep">|</span>
              <span className="chip-label">Prev: <strong>{weeklyComparison.displayPrevWeek}</strong> {unitLabel}</span>
            </div>
          </div>

          <div className="chart-container-box">
            {overallMetrics.activityCount > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={weeklyComparison.chartData} margin={{ top: 15, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#273B2F' : '#E5F0DF'} />
                  <XAxis
                    dataKey="day"
                    stroke={isDark ? '#A3BBAA' : '#556B5B'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: isDark ? '#273B2F' : '#E5F0DF' }}
                  />
                  <YAxis
                    stroke={isDark ? '#A3BBAA' : '#556B5B'}
                    fontSize={12}
                    tickLine={false}
                    width={40}
                    axisLine={{ stroke: isDark ? '#273B2F' : '#E5F0DF' }}
                  />
                  <Tooltip
                    formatter={(val, name) => [`${val} ${unitLabel}`, name === 'currentWeek' ? 'Current Week' : 'Previous Week']}
                    contentStyle={{
                      backgroundColor: isDark ? '#17241D' : '#FFFFFF',
                      borderRadius: '10px',
                      border: isDark ? '1px solid #273B2F' : '1px solid #D7E6CE',
                      color: isDark ? '#EDF5EE' : '#1D2E24',
                      fontSize: '13px'
                    }}
                  />
                  {/* Previous Week: Subtle dashed line */}
                  <Line
                    type="monotone"
                    dataKey="previousWeek"
                    name="Previous Week"
                    stroke={isDark ? '#7D9283' : '#94A3B8'}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                  {/* Current Week: Solid bold forest line */}
                  <Line
                    type="monotone"
                    dataKey="currentWeek"
                    name="Current Week"
                    stroke={isDark ? '#34D399' : '#246B43'}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-placeholder">
                <Calendar size={32} color="#889D8E" />
                <p>No activity records logged yet. Log activities to view weekly comparisons.</p>
              </div>
            )}
          </div>

          <div className="chart-footer-legend">
            <div className="legend-item">
              <span className="legend-line line-current" />
              <span>Current Week ({weeklyComparison.displayCurrentWeek} {unitLabel})</span>
            </div>
            <div className="legend-item">
              <span className="legend-line line-prev" />
              <span>Previous Week ({weeklyComparison.displayPrevWeek} {unitLabel})</span>
            </div>
          </div>
        </div>

        {/* Requirement 3 & 4: Category-Wise Footprint Breakdown Pie Chart */}
        <div className="dashboard-card category-breakdown-card">
          <div className="card-header-clean">
            <div>
              <h2 className="card-heading">Category Breakdown</h2>
              <p className="card-subheading">Emission share across verified categories</p>
            </div>
          </div>

          <div className="donut-chart-container">
            {categoryChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry) => (
                        <Cell
                          key={`cell-${entry.key}`}
                          fill={getCategoryColor(entry.key, isDark)}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [
                        `${val} ${unitLabel} (${item.payload.percentage}%)`,
                        item.payload.name
                      ]}
                      contentStyle={{
                        backgroundColor: isDark ? '#17241D' : '#FFFFFF',
                        borderRadius: '8px',
                        border: isDark ? '1px solid #273B2F' : '1px solid #D7E6CE',
                        color: isDark ? '#EDF5EE' : '#1D2E24',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="category-legend-list">
                  {categoryChartData.map((item) => (
                    <div key={item.key} className="legend-row">
                      <span
                        className="legend-color-box"
                        style={{ backgroundColor: getCategoryColor(item.key, isDark) }}
                      />
                      <span className="legend-name">{item.name}</span>
                      <span className="legend-pct font-semibold">{item.percentage}%</span>
                      <span className="legend-amount">{item.value} {unitLabel}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="chart-empty-placeholder">
                <Layers size={32} color="#889D8E" />
                <p>Log Transport, Electricity, Food, or Shopping entries to see category breakdown.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task 3.3: Goal Tracking Widget (Dedicated Component) */}
      <div className="dashboard-section-block mb-6">
        <GoalTrackingWidget
          goals={goals}
          onGoalUpdated={() => loadDashboardData(true)}
        />
      </div>

      {/* Quick-Log Carousel on Dashboard for convenience */}
      <div className="dashboard-section-block mb-6">
        <QuickLogCarousel
          onQuickLogged={handleActivityLogged}
          className="dashboard-quicklog-wrap"
        />
      </div>

      {/* Recent Activities Ledger Table */}
      <div className="dashboard-card recent-activities-card">
        <div className="card-header-with-action">
          <div>
            <h2 className="card-heading">Recent Activities</h2>
            <p className="card-subheading">Latest authenticated submissions to your carbon ledger</p>
          </div>
          <Link to="/activities" className="btn btn-ghost btn-sm">
            <span>View All ({activities.length})</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {activities.length > 0 ? (
          <div className="table-responsive">
            <table className="activities-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Activity Type</th>
                  <th>Quantity</th>
                  <th>Emissions</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 6).map((act) => (
                  <tr key={act.id}>
                    <td>
                      <CategoryBadge category={act.category} />
                    </td>
                    <td className="font-semibold text-forest">{act.activityType}</td>
                    <td>
                      {act.quantity} <span className="unit-text">{act.unit}</span>
                    </td>
                    <td>
                      <EmissionBadge value={act.co2eKg} unit="kg" />
                    </td>
                    <td className="date-cell">{act.logDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No activities recorded yet"
            description="Your carbon ledger is currently empty. Record your first travel, energy, or diet activity to view real-time estimates."
            actionText="Record First Activity"
            onAction={() => setIsQuickLogModalOpen(true)}
          />
        )}
      </div>

      {/* Quick Log Modal Triggerable from Dashboard Header */}
      {isQuickLogModalOpen && (
        <div className="modal-backdrop" onClick={() => !modalSubmitting && setIsQuickLogModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-bubble">
                  <Plus size={20} color="var(--forest-primary)" />
                </span>
                <div>
                  <h2 className="modal-title">Record Activity</h2>
                  <p className="modal-subtitle">Instant logging directly to Spring Boot backend</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsQuickLogModalOpen(false)}
                disabled={modalSubmitting}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="auth-alert alert-error mb-4" role="alert">
                <AlertCircle size={18} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="modal-form">
              {/* Category Selection Tabs */}
              <div className="form-group">
                <label className="form-label">Sector Category</label>
                <div className="category-selector-grid">
                  {Object.entries(ACTIVITY_CATALOG).map(([key, cat]) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`cat-select-btn ${modalCategory === key ? 'selected' : ''}`}
                        onClick={() => handleModalCategoryChange(key)}
                        disabled={modalSubmitting}
                      >
                        <span className="cat-btn-icon"><Icon size={18} /></span>
                        <span className="cat-btn-text">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Activity Type Selector */}
              <div className="form-group">
                <label htmlFor="dash-modal-type" className="form-label">
                  Activity Type
                </label>
                <select
                  id="dash-modal-type"
                  className="form-select"
                  value={modalActivityType}
                  onChange={(e) => handleModalTypeChange(e.target.value)}
                  disabled={modalSubmitting}
                  required
                >
                  {ACTIVITY_CATALOG[modalCategory]?.types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label} ({type.unit}) — Factor: {type.factor} kg CO₂e/{type.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity and Unit */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="dash-modal-quantity" className="form-label">
                    Quantity
                  </label>
                  <input
                    id="dash-modal-quantity"
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="e.g. 15"
                    className="form-input"
                    value={modalQuantity}
                    onChange={(e) => setModalQuantity(e.target.value)}
                    disabled={modalSubmitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dash-modal-unit" className="form-label">
                    Unit
                  </label>
                  <input
                    id="dash-modal-unit"
                    type="text"
                    className="form-input read-only-input"
                    value={modalUnit}
                    readOnly
                  />
                </div>
              </div>

              {/* Activity Date */}
              <div className="form-group">
                <label htmlFor="dash-modal-date" className="form-label">
                  Activity Date
                </label>
                <input
                  id="dash-modal-date"
                  type="date"
                  max={getTodayString()}
                  className="form-input"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  disabled={modalSubmitting}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsQuickLogModalOpen(false)}
                  disabled={modalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? (
                    <LoadingSpinner size="sm" message="" />
                  ) : (
                    <span>Save & Update Dashboard</span>
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
