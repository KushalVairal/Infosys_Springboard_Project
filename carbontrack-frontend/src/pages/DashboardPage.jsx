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
  ArrowRight
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

const CATEGORY_COLORS = {
  TRANSPORT: '#48724D',
  ELECTRICITY: '#D9822B',
  FOOD: '#668F63',
  SHOPPING: '#3C6E71',
  OTHER: '#889D8E'
};

export default function DashboardPage() {
  const { user, profile, preferredUnit } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.activities.getMyActivities();
        if (isMounted) {
          setActivities(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load activity history');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Monthly goal target benchmark (150 kg standard monthly budget)
  const monthlyGoalTarget = 150;
  const goalPercentage = Math.min(Math.round((metrics.totalKg / monthlyGoalTarget) * 100), 100);

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
              <Flame size={20} color="#244B35" />
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
              <Activity size={20} color="#48724D" />
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
              <Layers size={20} color="#D9822B" />
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
            <span className="metric-title">Monthly Benchmark</span>
            <span className="metric-icon-bubble">
              <Target size={20} color="#244B35" />
            </span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{goalPercentage}%</span>
            <span className="metric-unit">of 150 kg budget</span>
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
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#48724D" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#48724D" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#889D8E"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#E5F0DF' }}
                  />
                  <YAxis
                    stroke="#889D8E"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#E5F0DF' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #D7E6CE',
                      boxShadow: '0 8px 20px rgba(36, 75, 53, 0.1)'
                    }}
                    formatter={(val) => [`${val} kg CO₂e`, 'Emissions']}
                  />
                  <Area
                    type="monotone"
                    dataKey="co2e"
                    stroke="#244B35"
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
                          fill={CATEGORY_COLORS[entry.key] || '#48724D'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${val} kg`, 'Total']}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D7E6CE'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="category-legend-list">
                  {categoryChartData.map((item) => (
                    <div key={item.key} className="legend-row">
                      <span
                        className="legend-color-box"
                        style={{ backgroundColor: CATEGORY_COLORS[item.key] || '#48724D' }}
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
        <div className="card-header-clean">
          <div className="goals-header-left">
            <div className="goals-icon-circle">
              <Award size={22} color="#244B35" />
            </div>
            <div>
              <h2 className="card-heading">Eco Milestone & Goal Progress</h2>
              <p className="card-subheading">Personal emissions target: Keep monthly footprint under 150 kg CO₂e</p>
            </div>
          </div>
        </div>

        <div className="goals-body">
          <div className="goal-meter-row">
            <div className="goal-meter-info">
              <span>Current monthly total: <strong>{metrics.totalKg.toFixed(1)} kg</strong></span>
              <span>Budget remaining: <strong>{Math.max(0, 150 - metrics.totalKg).toFixed(1)} kg</strong></span>
            </div>
            <div className="goal-meter-track">
              <div
                className={`goal-meter-fill ${goalPercentage > 90 ? 'critical' : goalPercentage > 70 ? 'warning' : 'safe'}`}
                style={{ width: `${goalPercentage}%` }}
              />
            </div>
          </div>

          <div className="eco-suggestions-grid">
            <div className="suggestion-box">
              <span className="sugg-tag">Commute</span>
              <p>Choosing rail or public bus instead of solo driving can reduce travel emissions by up to 60%.</p>
            </div>
            <div className="suggestion-box">
              <span className="sugg-tag">Diet</span>
              <p>A plant-forward meal produces on average 80% fewer greenhouse emissions than beef.</p>
            </div>
            <div className="suggestion-box">
              <span className="sugg-tag">Power</span>
              <p>Switching unused electronics off standby saves approximately 15–20 kWh per month.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
