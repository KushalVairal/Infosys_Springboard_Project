import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { getCategoryColor, getCategoryForActivityType } from '../data/categories';
import { useTheme } from '../context/ThemeContext';

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.activities.getMyActivities();
        if (isMounted) setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch activity records.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute analytics strictly from real activity data
  const sectorData = useMemo(() => {
    const map = {};
    activities.forEach((act) => {
      const cat = (act.category || 'OTHER').toUpperCase();
      map[cat] = (map[cat] || 0) + (Number(act.co2eKg) || 0);
    });

    return Object.entries(map).map(([key, val]) => ({
      name: key.charAt(0) + key.slice(1).toLowerCase(),
      key,
      emissions: Number(val.toFixed(2))
    }));
  }, [activities]);

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
        type: item.type,
        category: item.category,
        emissions: Number(item.total.toFixed(2))
      }));
  }, [activities]);

  const monthlyRollup = useMemo(() => {
    const map = {};
    activities.forEach((act) => {
      if (!act.logDate) return;
      const month = act.logDate.slice(0, 7); // YYYY-MM
      map[month] = (map[month] || 0) + (Number(act.co2eKg) || 0);
    });

    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, val]) => ({
        month,
        emissions: Number(val.toFixed(2))
      }));
  }, [activities]);

  const totalCalculatedKg = useMemo(() => {
    return activities.reduce((sum, a) => sum + (Number(a.co2eKg) || 0), 0);
  }, [activities]);

  if (loading) {
    return (
      <div className="page-loading-wrapper">
        <LoadingSpinner message="Synthesizing carbon analytics from your records..." size="lg" />
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1 className="page-heading">Emissions Analytics & Intelligence</h1>
          <p className="page-subheading">
            Visual breakdown computed directly from your authenticated activity database records.
          </p>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}



      {activities.length > 0 ? (
        <>
          {/* Top Level Summary Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-title">Total Processed Footprint</span>
              <div className="metric-body">
                <span className="metric-value">{totalCalculatedKg.toFixed(1)}</span>
                <span className="metric-unit">kg CO₂e</span>
              </div>
              <span className="metric-subtext">Sum of all recorded emissions</span>
            </div>

            <div className="metric-card">
              <span className="metric-title">Active Time Span</span>
              <div className="metric-body">
                <span className="metric-value">{monthlyRollup.length}</span>
                <span className="metric-unit">months</span>
              </div>
              <span className="metric-subtext">From oldest to newest logged activity</span>
            </div>

            <div className="metric-card">
              <span className="metric-title">Unique Activity Types</span>
              <div className="metric-body">
                <span className="metric-value">{activityTypeBreakdown.length}</span>
                <span className="metric-unit">types</span>
              </div>
              <span className="metric-subtext">Diverse activity categories tracked</span>
            </div>
          </div>

          {/* Sector Share Row */}
          <div className="dashboard-card">
            <div className="card-header-clean">
              <div>
                <h2 className="card-heading">Sector Footprint Distribution</h2>
                <p className="card-subheading">Total cumulative emissions across verified economic categories</p>
              </div>
            </div>
            <div className="donut-chart-container">
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
                    formatter={(val) => [`${val} kg CO₂e`, 'Emissions']}
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
                    <span className="legend-amount">{s.emissions} kg</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="analytics-charts-grid">
            {/* Top Activity Types Bar Chart */}
            <div className="dashboard-card">
              <div className="card-header-clean">
                <div>
                  <h2 className="card-heading">Top High-Impact Activities</h2>
                  <p className="card-subheading">Aggregated kg CO₂e generated by specific activity types</p>
                </div>
              </div>

              <div className="chart-container-box">
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
                      formatter={(val) => [`${val} kg CO₂e`, 'Emissions']}
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
                    <Bar dataKey="emissions" radius={[6, 6, 0, 0]}>
                      {activityTypeBreakdown.map((entry) => (
                        <Cell
                          key={`impact-${entry.type}`}
                          fill={getCategoryColor(entry.category, isDark)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend Rollup */}
            <div className="dashboard-card">
              <div className="card-header-clean">
                <div>
                  <h2 className="card-heading">Monthly Generation Rollup</h2>
                  <p className="card-subheading">Historical totals per calendar month</p>
                </div>
              </div>

              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyRollup} margin={{ top: 20, right: 20, left: 15, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#273B2F' : '#E5F0DF'} vertical={false} />
                    <XAxis dataKey="month" stroke={isDark ? '#A3BBAA' : '#556B5B'} fontSize={12} tickLine={false} />
                    <YAxis stroke={isDark ? '#A3BBAA' : '#556B5B'} fontSize={12} tickLine={false} width={45} />
                    <Tooltip
                      formatter={(val) => [`${val} kg CO₂e`, 'Emissions']}
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
                    <Bar dataKey="emissions" fill={isDark ? '#3DA868' : '#244B35'} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
