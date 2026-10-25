import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  AlertCircle,
  Calendar,
  RotateCw
} from 'lucide-react';
import { getCategoryColor, getCategoryForActivityType } from '../data/categories';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function computeDateRange(preset) {
  const end = new Date();
  const endStr = end.toISOString().slice(0, 10);
  const start = new Date();

  if (preset === '30D') {
    start.setDate(end.getDate() - 29);
  } else if (preset === '90D') {
    start.setDate(end.getDate() - 89);
  } else if (preset === 'YTD') {
    start.setMonth(0, 1);
  } else if (preset === '1Y') {
    start.setDate(end.getDate() - 364);
  }

  const startStr = start.toISOString().slice(0, 10);
  return { startDate: startStr, endDate: endStr };
}

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const { preferredUnit } = useAuth();
  const [intervalView, setIntervalView] = useState('DAILY'); // 'DAILY' | 'WEEKLY' | 'MONTHLY'
  const [datePreset, setDatePreset] = useState('90D'); // '30D' | '90D' | 'YTD' | '1Y'
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTonnes = preferredUnit === 'TONNES_CO2E';
  const unitLabel = isTonnes ? 'Tonnes CO₂e' : 'kg CO₂e';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { startDate, endDate } = computeDateRange(datePreset);

      const [daily, weekly, monthly, acts] = await Promise.all([
        api.analytics.getDaily(startDate, endDate).catch(() => []),
        api.analytics.getWeekly(startDate, endDate).catch(() => []),
        api.analytics.getMonthly(startDate, endDate).catch(() => []),
        api.activities.getMyActivities().catch(() => [])
      ]);

      setDailyData(Array.isArray(daily) ? daily : []);
      setWeeklyData(Array.isArray(weekly) ? weekly : []);
      setMonthlyData(Array.isArray(monthly) ? monthly : []);
      setActivities(Array.isArray(acts) ? acts : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch carbon analytics from server.');
    } finally {
      setLoading(false);
    }
  }, [datePreset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate category sector distribution directly from backend data
  const sectorData = useMemo(() => {
    const map = {};
    const source = dailyData.length > 0 ? dailyData : monthlyData.length > 0 ? monthlyData : [];

    source.forEach((act) => {
      const cat = (act.category || 'OTHER').toUpperCase();
      map[cat] = (map[cat] || 0) + (Number(act.totalCo2eKg) || 0);
    });

    return Object.entries(map).map(([key, val]) => ({
      name: key.charAt(0) + key.slice(1).toLowerCase(),
      key,
      emissions: Number((isTonnes ? val / 1000 : val).toFixed(isTonnes ? 3 : 2)),
      rawKg: val
    }));
  }, [dailyData, monthlyData, isTonnes]);

  // Timeline series based on interval view (Daily, Weekly, Monthly)
  const timelineSeries = useMemo(() => {
    if (intervalView === 'DAILY') {
      const dateMap = {};
      dailyData.forEach((item) => {
        if (!item.date) return;
        const d = item.date;
        if (!dateMap[d]) {
          dateMap[d] = { label: d.slice(5), fullDate: d, total: 0 };
        }
        dateMap[d].total += Number(item.totalCo2eKg) || 0;
      });

      return Object.values(dateMap)
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
        .map((d) => ({
          name: d.label,
          fullDate: d.fullDate,
          emissions: Number((isTonnes ? d.total / 1000 : d.total).toFixed(isTonnes ? 3 : 2))
        }));
    }

    if (intervalView === 'WEEKLY') {
      const weekMap = {};
      weeklyData.forEach((item) => {
        if (!item.weekStartDate) return;
        const d = item.weekStartDate;
        if (!weekMap[d]) {
          weekMap[d] = { label: `W ${d.slice(5)}`, fullDate: d, total: 0 };
        }
        weekMap[d].total += Number(item.totalCo2eKg) || 0;
      });

      return Object.values(weekMap)
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
        .map((w) => ({
          name: w.label,
          fullDate: w.fullDate,
          emissions: Number((isTonnes ? w.total / 1000 : w.total).toFixed(isTonnes ? 3 : 2))
        }));
    }

    // MONTHLY
    const monthMap = {};
    monthlyData.forEach((item) => {
      if (!item.monthStartDate) return;
      const d = item.monthStartDate;
      const mLabel = d.slice(0, 7);
      if (!monthMap[mLabel]) {
        monthMap[mLabel] = { label: mLabel, fullDate: d, total: 0 };
      }
      monthMap[mLabel].total += Number(item.totalCo2eKg) || 0;
    });

    return Object.values(monthMap)
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
      .map((m) => ({
        name: m.label,
        fullDate: m.fullDate,
        emissions: Number((isTonnes ? m.total / 1000 : m.total).toFixed(isTonnes ? 3 : 2))
      }));
  }, [intervalView, dailyData, weeklyData, monthlyData, isTonnes]);

  // Breakdown of top emission-generating activity types
  const activityTypeBreakdown = useMemo(() => {
    const map = {};
    activities.forEach((act) => {
      const type = act.activityType || 'Unknown';
      const cat = (act.category || getCategoryForActivityType(type)).toUpperCase();
      if (!map[type]) {
        map[type] = { type, category: cat, total: 0 };
      }
      map[type].total += (Number(act.co2eKg) || 0);
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 7)
      .map((item) => ({
        type: item.type.replace(/_/g, ' '),
        category: item.category,
        emissions: Number((isTonnes ? item.total / 1000 : item.total).toFixed(isTonnes ? 3 : 2))
      }));
  }, [activities, isTonnes]);

  // Total processed kg
  const totalCalculatedKg = useMemo(() => {
    if (dailyData.length > 0) {
      return dailyData.reduce((sum, a) => sum + (Number(a.totalCo2eKg) || 0), 0);
    }
    if (monthlyData.length > 0) {
      return monthlyData.reduce((sum, a) => sum + (Number(a.totalCo2eKg) || 0), 0);
    }
    return activities.reduce((sum, a) => sum + (Number(a.co2eKg) || 0), 0);
  }, [dailyData, monthlyData, activities]);

  const displayTotal = isTonnes ? (totalCalculatedKg / 1000).toFixed(3) : totalCalculatedKg.toFixed(2);

  // Dominant category
  const dominantCategory = useMemo(() => {
    if (sectorData.length === 0) return 'None';
    return [...sectorData].sort((a, b) => b.rawKg - a.rawKg)[0]?.name || 'None';
  }, [sectorData]);

  if (loading && dailyData.length === 0 && weeklyData.length === 0) {
    return (
      <div className="page-loading-wrapper">
        <LoadingSpinner message="Synthesizing carbon analytics from verified backend records..." size="lg" />
      </div>
    );
  }

  const hasData = dailyData.length > 0 || weeklyData.length > 0 || monthlyData.length > 0 || activities.length > 0;

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1 className="page-heading">Emissions Analytics & Intelligence</h1>
          <p className="page-subheading">
            Live footprint aggregations directly computed by the Spring Boot analytics engine.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadData}
          disabled={loading}
          title="Refresh Analytics"
        >
          <RotateCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="dashboard-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={loadData}
            style={{ marginLeft: 'auto' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Aggregation Interval & Timeframe Controls */}
      <div className="analytics-filter-row">
        <div className="filter-group">
          <span className="filter-label">Interval:</span>
          <div className="filter-pills">
            <button
              type="button"
              className={`filter-pill ${intervalView === 'DAILY' ? 'active' : ''}`}
              onClick={() => setIntervalView('DAILY')}
            >
              Daily Breakdown
            </button>
            <button
              type="button"
              className={`filter-pill ${intervalView === 'WEEKLY' ? 'active' : ''}`}
              onClick={() => setIntervalView('WEEKLY')}
            >
              Weekly Rollup
            </button>
            <button
              type="button"
              className={`filter-pill ${intervalView === 'MONTHLY' ? 'active' : ''}`}
              onClick={() => setIntervalView('MONTHLY')}
            >
              Monthly Rollup
            </button>
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Timeframe:</span>
          <div className="filter-pills">
            <button
              type="button"
              className={`filter-pill ${datePreset === '30D' ? 'active' : ''}`}
              onClick={() => setDatePreset('30D')}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              className={`filter-pill ${datePreset === '90D' ? 'active' : ''}`}
              onClick={() => setDatePreset('90D')}
            >
              Last 90 Days
            </button>
            <button
              type="button"
              className={`filter-pill ${datePreset === 'YTD' ? 'active' : ''}`}
              onClick={() => setDatePreset('YTD')}
            >
              Year to Date
            </button>
            <button
              type="button"
              className={`filter-pill ${datePreset === '1Y' ? 'active' : ''}`}
              onClick={() => setDatePreset('1Y')}
            >
              Last 1 Year
            </button>
          </div>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Top Level Summary Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-title">Period Emissions Total</span>
              <div className="metric-body">
                <span className="metric-value">{displayTotal}</span>
                <span className="metric-unit">{unitLabel}</span>
              </div>
              <span className="metric-subtext">Sum of verified emissions in selected range</span>
            </div>

            <div className="metric-card">
              <span className="metric-title">Recorded Periods</span>
              <div className="metric-body">
                <span className="metric-value">{timelineSeries.length}</span>
                <span className="metric-unit">
                  {intervalView === 'DAILY' ? 'days' : intervalView === 'WEEKLY' ? 'weeks' : 'months'}
                </span>
              </div>
              <span className="metric-subtext">Active interval units logged in this window</span>
            </div>

            <div className="metric-card">
              <span className="metric-title">Dominant Category</span>
              <div className="metric-body">
                <span className="metric-value">{dominantCategory}</span>
                <span className="metric-unit">sector</span>
              </div>
              <span className="metric-subtext">Highest emitting activity category</span>
            </div>
          </div>

          {/* Sector Share Row */}
          <div className="dashboard-card">
            <div className="card-header-clean">
              <div>
                <h2 className="card-heading">Sector Footprint Distribution</h2>
                <p className="card-subheading">Aggregated category share calculated by backend repository</p>
              </div>
            </div>
            <div className="donut-chart-container">
              {sectorData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="emissions"
                      >
                        {sectorData.map((entry) => (
                          <Cell
                            key={`sector-${entry.key}`}
                            fill={getCategoryColor(entry.key, isDark)}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`${val} ${unitLabel}`, 'Emissions']}
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
                    {sectorData.map((s) => (
                      <div key={s.key} className="legend-row">
                        <span
                          className="legend-color-box"
                          style={{ backgroundColor: getCategoryColor(s.key, isDark) }}
                        />
                        <span className="legend-name">{s.name}</span>
                        <span className="legend-amount">{s.emissions} {unitLabel}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="chart-empty-placeholder">
                  <Calendar size={24} className="text-faint" />
                  <p>No category records in this timeframe.</p>
                </div>
              )}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="analytics-charts-grid">
            {/* Main Interval Timeline Chart */}
            <div className="dashboard-card">
              <div className="card-header-clean">
                <div>
                  <h2 className="card-heading">
                    {intervalView === 'DAILY'
                      ? 'Daily Emission Timeline'
                      : intervalView === 'WEEKLY'
                      ? 'Weekly Emission Summaries'
                      : 'Monthly Footprint Rollup'}
                  </h2>
                  <p className="card-subheading">
                    Backend aggregated {intervalView.toLowerCase()} totals ({unitLabel})
                  </p>
                </div>
              </div>

              <div className="chart-container-box">
                {timelineSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={timelineSeries}
                      margin={{ top: 20, right: 20, left: 15, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#273B2F' : '#E5F0DF'} vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke={isDark ? '#A3BBAA' : '#556B5B'}
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis stroke={isDark ? '#A3BBAA' : '#556B5B'} fontSize={12} tickLine={false} width={45} />
                      <Tooltip
                        formatter={(val) => [`${val} ${unitLabel}`, 'Emissions']}
                        labelFormatter={(_, items) => items?.[0]?.payload?.fullDate || ''}
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
                      <Bar dataKey="emissions" fill={isDark ? '#3DA868' : '#244B35'} radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty-placeholder">
                    <Calendar size={28} className="text-faint" />
                    <p>No {intervalView.toLowerCase()} records recorded for this timeframe.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Activity Types Bar Chart */}
            <div className="dashboard-card">
              <div className="card-header-clean">
                <div>
                  <h2 className="card-heading">Top High-Impact Activities</h2>
                  <p className="card-subheading">Aggregated {unitLabel} by specific activity types</p>
                </div>
              </div>

              <div className="chart-container-box">
                {activityTypeBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={activityTypeBreakdown}
                      margin={{ top: 20, right: 20, left: 15, bottom: 35 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#273B2F' : '#E5F0DF'} vertical={false} />
                      <XAxis
                        dataKey="type"
                        stroke={isDark ? '#A3BBAA' : '#556B5B'}
                        fontSize={11}
                        angle={-20}
                        textAnchor="end"
                        tickLine={false}
                      />
                      <YAxis stroke={isDark ? '#A3BBAA' : '#556B5B'} fontSize={12} tickLine={false} width={45} />
                      <Tooltip
                        formatter={(val) => [`${val} ${unitLabel}`, 'Emissions']}
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
                      <Bar dataKey="emissions" radius={[6, 6, 0, 0]} maxBarSize={42}>
                        {activityTypeBreakdown.map((entry) => (
                          <Cell
                            key={`impact-${entry.type}`}
                            fill={getCategoryColor(entry.category, isDark)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty-placeholder">
                    <Calendar size={28} className="text-faint" />
                    <p>No activity records available to rank impacts.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="No analytics available"
          description="Record your travel, electricity, or food activities to generate meaningful visual analytics."
          actionText="Log New Activity"
          onAction={() => (window.location.href = '/activities')}
        />
      )}
    </div>
  );
}
