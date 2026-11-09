import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { CategoryBadge, EmissionBadge } from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  PlusCircle,
  Activity,
  Flame,
  Target,
  Award,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getCategoryColor } from '../data/categories';
import { useTheme } from '../context/ThemeContext';

export default function DashboardPage() {
  const { user, profile, preferredUnit } = useAuth();
  const { isDark } = useTheme();
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recPeriodDays, setRecPeriodDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [activityData, goalData, recData] = await Promise.all([
          api.activities.getMyActivities().catch(() => []),
          api.goals.getMyGoals().catch(() => []),
          api.recommendations.getWeekly().catch(() => null)
        ]);

        if (isMounted) {
          setActivities(Array.isArray(activityData) ? activityData : []);
          setGoals(Array.isArray(goalData) ? goalData : []);
          if (recData && Array.isArray(recData.recommendations)) {
            setRecommendations(recData.recommendations);
            setRecPeriodDays(recData.periodDays || 30);
          } else {
            setRecommendations([]);
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeGoal = useMemo(() => {
    return goals.find((g) => g.status === 'ACTIVE') || goals[0] || null;
  }, [goals]);

  // Compute metrics from actual activities
  const metrics = useMemo(() => {
    let totalKg = 0;
    const catMap = { TRANSPORT: 0, ELECTRICITY: 0, FOOD: 0, SHOPPING: 0 };

    activities.forEach((act) => {
      const co2 = Number(act.co2eKg) || 0;
      totalKg += co2;
      const cat = (act.category || 'OTHER').toUpperCase();
      if (catMap[cat] !== undefined) {
        catMap[cat] += co2;
      } else {
        catMap.OTHER = (catMap.OTHER || 0) + co2;
      }
    });

    // Top category
    let topCat = 'None';
    let topCatVal = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topCatVal) {
        topCatVal = val;
        topCat = cat;
      }
    });

    const isTonnes = preferredUnit === 'TONNES_CO2E';
    const displayTotal = isTonnes ? (totalKg / 1000).toFixed(3) : totalKg.toFixed(2);
    const unitLabel = isTonnes ? 'Tonnes CO₂e' : 'kg CO₂e';

    const avgPerActivity = activities.length > 0 ? (totalKg / activities.length).toFixed(2) : '0.00';

    return {
      totalKg,
      displayTotal,
      unitLabel,
      activityCount: activities.length,
      avgPerActivity,
      topCat,
      topCatVal,
      catMap
    };
  }, [activities, preferredUnit]);

  // Aggregate daily emissions for trend chart
  const trendData = useMemo(() => {
    if (activities.length === 0) return [];

    // Group by logDate
    const dateMap = {};
    activities.forEach((act) => {
      const dateStr = act.logDate || 'Unknown';
      dateMap[dateStr] = (dateMap[dateStr] || 0) + (Number(act.co2eKg) || 0);
    });

    // Sort by date ascending
    return Object.entries(dateMap)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, val]) => ({
        date,
        co2e: Number(val.toFixed(2))
      }));
  }, [activities]);

  // Category breakdown for donut chart
  const categoryChartData = useMemo(() => {
    return Object.entries(metrics.catMap)
      .filter(([, val]) => val > 0)
      .map(([name, value]) => ({
        name: name.charAt(0) + name.slice(1).toLowerCase(),
        key: name,
        value: Number(value.toFixed(2))
      }));
  }, [metrics.catMap]);

  // Monthly goal target benchmark (computed from active goal or 150 kg default)
  const isTonnes = preferredUnit === 'TONNES_CO2E';
  const targetBudgetKg = activeGoal ? Number(activeGoal.targetCo2eKg) : 150;
  const currentBudgetKg = activeGoal ? Number(activeGoal.currentCo2eKg) : metrics.totalKg;
  const goalPercentage = Math.min(
    Math.round(activeGoal ? activeGoal.progressPercentage : (metrics.totalKg / 150) * 100),
    100
  );

  if (loading) {
    return (
      <div className="page-loading-wrapper">
        <LoadingSpinner message="Calculating your carbon footprint summary..." size="lg" />
      </div>
    );
  }

  const displayName = profile?.fullName || user?.username || profile?.username || 'Eco Champion';

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-header-row">
        <div>
          <h1 className="dashboard-title">Welcome, {displayName}</h1>
          <p className="dashboard-subtitle">
            Here is your verified carbon footprint and emissions reduction tracker.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/activities" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Log Activity</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card card-primary-highlight">
          <div className="metric-header">
            <span className="metric-title">Total Emissions</span>
            <span className="metric-icon-bubble">
              <Flame size={20} color="var(--forest-primary)" />
            </span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{metrics.displayTotal}</span>
            <span className="metric-unit">{metrics.unitLabel}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">Across {metrics.activityCount} recorded actions</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Activities Logged</span>
            <span className="metric-icon-bubble">
              <Activity size={20} color="var(--forest-primary)" />
            </span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{metrics.activityCount}</span>
            <span className="metric-unit">events</span>
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">Average {metrics.avgPerActivity} kg / activity</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Primary Emission Source</span>
            <span className="metric-icon-bubble">
              <Layers size={20} color="var(--accent-amber)" />
            </span>
          </div>
          <div className="metric-body">
            <span className="metric-value top-cat-text">
              {metrics.topCat !== 'None' ? metrics.topCat : 'No Data'}
            </span>
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">
              {metrics.topCatVal > 0 ? `${metrics.topCatVal.toFixed(1)} kg CO₂e accumulated` : 'Record activities to reveal'}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{activeGoal ? 'Active Goal Progress' : 'Monthly Benchmark'}</span>
            <span className="metric-icon-bubble">
              <Target size={20} color="var(--forest-primary)" />
            </span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{goalPercentage}%</span>
            <span className="metric-unit">
              of {isTonnes ? (targetBudgetKg / 1000).toFixed(2) : targetBudgetKg.toFixed(0)} {isTonnes ? 't' : 'kg'} budget
            </span>
          </div>
          <div className="metric-footer">
            <div className="mini-progress-bar">
              <div
                className={`mini-progress-fill ${goalPercentage > 90 ? 'danger' : goalPercentage > 70 ? 'warn' : 'good'}`}
                style={{ width: `${goalPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts-grid">
        {/* Footprint Trends Chart */}
        <div className="dashboard-card trend-chart-card">
          <div className="card-header-clean">
            <div>
              <h2 className="card-heading">Emission Timeline</h2>
              <p className="card-subheading">Daily kg CO₂e generation across your logged activity dates</p>
            </div>
            <div className="chart-legend-indicator">
              <span className="legend-dot" />
              <span>CO₂e (kg)</span>
            </div>
          </div>

          <div className="chart-container-box">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? '#3DA868' : '#246B43'} stopOpacity={isDark ? 0.45 : 0.4} />
                      <stop offset="95%" stopColor={isDark ? '#3DA868' : '#246B43'} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke={isDark ? '#A3BBAA' : '#556B5B'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: isDark ? '#273B2F' : '#E5F0DF' }}
                  />
                  <YAxis
                    stroke={isDark ? '#A3BBAA' : '#556B5B'}
                    fontSize={12}
                    tickLine={false}
                    width={45}
                    axisLine={{ stroke: isDark ? '#273B2F' : '#E5F0DF' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#17241D' : '#FFFFFF',
                      borderRadius: '12px',
                      border: isDark ? '1px solid #273B2F' : '1px solid #D7E6CE',
                      color: isDark ? '#EDF5EE' : '#1D2E24',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    itemStyle={{ color: isDark ? '#EDF5EE' : '#1D2E24' }}
                    labelStyle={{ color: isDark ? '#EDF5EE' : '#1D2E24', fontWeight: 600 }}
                    formatter={(val) => [`${val} kg CO₂e`, 'Emissions']}
                  />
                  <Area
                    type="monotone"
                    dataKey="co2e"
                    stroke={isDark ? '#3DA868' : 'var(--forest-primary)'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCo2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-placeholder">
                <Calendar size={32} color="#889D8E" />
                <p>No activity dates logged yet. Start recording activities to see your timeline.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="dashboard-card category-breakdown-card">
          <div className="card-header-clean">
            <div>
              <h2 className="card-heading">Category Breakdown</h2>
              <p className="card-subheading">Emission share across verified sectors</p>
            </div>
          </div>

          <div className="donut-chart-container">
            {categoryChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
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
                      formatter={(val) => [`${val} kg`, 'Total']}
                      contentStyle={{
                        backgroundColor: isDark ? '#17241D' : '#FFFFFF',
                        borderRadius: '8px',
                        border: isDark ? '1px solid #273B2F' : '1px solid #D7E6CE',
                        color: isDark ? '#EDF5EE' : '#1D2E24',
                        boxShadow: 'var(--shadow-md)'
                      }}
                      itemStyle={{ color: isDark ? '#EDF5EE' : '#1D2E24' }}
                      labelStyle={{ color: isDark ? '#EDF5EE' : '#1D2E24', fontWeight: 600 }}
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
                      <span className="legend-amount">{item.value} kg</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="chart-empty-placeholder">
                <Layers size={32} color="#889D8E" />
                <p>Add Transport, Electricity, Food, or Shopping entries to see category breakdown.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
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
                {activities.slice(0, 5).map((act) => (
                  <tr key={act.id}>
                    <td>
                      <CategoryBadge category={act.category} />
                    </td>
                    <td className="font-medium">{act.activityType}</td>
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
            onAction={() => (window.location.href = '/activities')}
          />
        )}
      </div>

      {/* Environmental Goals & Benchmarks Card */}
      <div className="dashboard-card goals-benchmark-card">
        <div className="card-header-with-action">
          <div className="goals-header-left">
            <div className="goals-icon-circle">
              <Award size={22} color="var(--forest-primary)" />
            </div>
            <div>
              <h2 className="card-heading">{activeGoal ? activeGoal.title : 'Eco Milestone & Goal Progress'}</h2>
              <p className="card-subheading">
                {activeGoal
                  ? `Active target window: ${activeGoal.startDate} to ${activeGoal.endDate}`
                  : 'Personal emissions target: Keep monthly footprint under 150 kg CO₂e'}
              </p>
            </div>
          </div>
          <Link to="/goals" className="btn btn-secondary btn-sm">
            <span>{activeGoal ? 'View All Goals' : 'Set Custom Goal'}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="goals-body">
          <div className="goal-meter-row">
            <div className="goal-meter-info">
              <span>
                Current accumulated:{' '}
                <strong>
                  {isTonnes ? (currentBudgetKg / 1000).toFixed(3) : currentBudgetKg.toFixed(1)} {isTonnes ? 't CO₂e' : 'kg CO₂e'}
                </strong>
              </span>
              <span>
                Budget remaining:{' '}
                <strong>
                  {isTonnes
                    ? Math.max(0, (targetBudgetKg - currentBudgetKg) / 1000).toFixed(3)
                    : Math.max(0, targetBudgetKg - currentBudgetKg).toFixed(1)}{' '}
                  {isTonnes ? 't CO₂e' : 'kg CO₂e'}
                </strong>
              </span>
            </div>
            <div className="goal-meter-track">
              <div
                className={`goal-meter-fill ${goalPercentage > 90 ? 'critical' : goalPercentage > 70 ? 'warning' : 'safe'}`}
                style={{ width: `${goalPercentage}%` }}
              />
            </div>
          </div>

          <div className="recommendations-section-header">
            <h3 className="recommendations-title">
              <Sparkles size={18} color="var(--forest-primary)" />
              <span>Personalised Reduction Recommendations</span>
            </h3>
            <span className="recommendations-period-tag">
              Rolling {recPeriodDays}-day activity analysis
            </span>
          </div>

          {recommendations.length > 0 ? (
            <div className="eco-suggestions-grid">
              {recommendations.map((rec, idx) => {
                const formattedType = (rec.activityType || 'Activity')
                  .replace(/_/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={rec.activityType || idx} className="suggestion-box personalized-box">
                    <div className="sugg-header-row">
                      <span className="sugg-tag">{formattedType}</span>
                      <span className="sugg-impact-badge" title="30-day recorded emissions">
                        {isTonnes
                          ? (Number(rec.totalCo2eKg || 0) / 1000).toFixed(3) + ' t CO₂e'
                          : Number(rec.totalCo2eKg || 0).toFixed(1) + ' kg CO₂e'}
                      </span>
                    </div>
                    {rec.tips && rec.tips.length > 0 ? (
                      <ul className="sugg-tips-list">
                        {rec.tips.map((tip, tipIdx) => (
                          <li key={tipIdx}>{tip}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Continue logging activities to receive targeted reduction tips for this category.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="recommendations-empty-card">
              <p>
                No activity recorded in the rolling {recPeriodDays}-day window. Log your travel, energy, or diet activities to generate tailored reduction recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
