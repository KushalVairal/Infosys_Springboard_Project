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
  Info,
  AlertCircle
} from 'lucide-react';

const SECTOR_COLORS = {
  TRANSPORT: '#48724D',
  ELECTRICITY: '#D9822B',
  FOOD: '#668F63',
  SHOPPING: '#3C6E71',
  OTHER: '#889D8E'
};

export default function AnalyticsPage() {
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
      map[type] = (map[type] || 0) + (Number(act.co2eKg) || 0);
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([type, total]) => ({
        type,
        emissions: Number(total.toFixed(2))
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

      {/* Honest Backend Architectural Notice */}
      <div className="backend-gap-notice-card">
        <div className="gap-notice-header">
          <Info size={20} color="#244B35" />
          <span className="gap-notice-title">System Architecture & Backend API Transparency</span>
        </div>
        <p className="gap-notice-body">
          The charts below are computed client-side in real time from your authentic activity log entries (<code>GET /api/activities/me</code>).
          Dedicated backend server-side aggregate endpoints (e.g., <code>GET /api/analytics/summary</code>, <code>GET /api/analytics/trends</code>) are not yet implemented in the Spring Boot backend.
        </p>
        <div className="gap-recommendations">
          <strong>Recommended Backend Enhancements for Milestone 2:</strong>
          <ul>
            <li>Add <code>AnalyticsController.java</code> with SQL database rollups (<code>GROUP BY DATE_FORMAT(log_date, '%Y-%m')</code>)</li>
            <li>Implement organizational peer benchmarking queries</li>
            <li>Add automated annual carbon accounting PDF/CSV export endpoints</li>
          </ul>
        </div>
      </div>

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
                        fill={SECTOR_COLORS[entry.key] || '#48724D'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} kg CO₂e`, 'Emissions']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #D7E6CE'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="category-legend-list">
                {sectorData.map((s) => (
                  <div key={s.key} className="legend-row">
                    <span
                      className="legend-color-box"
                      style={{ backgroundColor: SECTOR_COLORS[s.key] || '#48724D' }}
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
                    margin={{ top: 20, right: 10, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5F0DF" vertical={false} />
                    <XAxis
                      dataKey="type"
                      stroke="#889D8E"
                      fontSize={11}
                      angle={-20}
                      textAnchor="end"
                      tickLine={false}
                    />
                    <YAxis stroke="#889D8E" fontSize={12} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val} kg CO₂e`, 'Emissions']}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D7E6CE'
                      }}
                    />
                    <Bar dataKey="emissions" fill="#48724D" radius={[6, 6, 0, 0]} />
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
                  <BarChart data={monthlyRollup} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5F0DF" vertical={false} />
                    <XAxis dataKey="month" stroke="#889D8E" fontSize={12} tickLine={false} />
                    <YAxis stroke="#889D8E" fontSize={12} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val} kg CO₂e`, 'Emissions']}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D7E6CE'
                      }}
                    />
                    <Bar dataKey="emissions" fill="#D9822B" radius={[6, 6, 0, 0]} />
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
