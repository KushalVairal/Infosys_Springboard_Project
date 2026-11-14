import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Calendar,
  Download,
  RotateCw,
  Users,
  Activity,
  Leaf,
  Clock,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertCircle,
  ShieldAlert,
  ArrowUpDown,
  Car,
  Zap,
  Utensils,
  ShoppingBag
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCategoryColor } from '../data/categories';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import '../styles/organisation.css';

const CATEGORY_ICONS = {
  TRANSPORT: Car,
  ELECTRICITY: Zap,
  FOOD: Utensils,
  SHOPPING: ShoppingBag
};

function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function getInitialDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: formatDate(start),
    endDate: formatDate(now)
  };
}

export default function OrganisationDashboardPage() {
  const { profile, user, loading: authLoading, preferredUnit } = useAuth();
  const { isDark } = useTheme();

  const isTonnes = preferredUnit === 'TONNES_CO2E';
  const unitLabel = isTonnes ? 'tonnes CO₂e' : 'kg CO₂e';

  const formatEmissions = useCallback((valKg) => {
    const num = Number(valKg ?? 0);
    const converted = isTonnes ? num / 1000 : num;
    return converted.toLocaleString(undefined, {
      minimumFractionDigits: isTonnes ? 3 : 2,
      maximumFractionDigits: isTonnes ? 3 : 2
    });
  }, [isTonnes]);

  const initialDates = useMemo(() => getInitialDates(), []);
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);
  const [activePreset, setActivePreset] = useState('THIS_MONTH');

  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noOrgAssigned, setNoOrgAssigned] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  // Employee sorting state
  const [sortKey, setSortKey] = useState('rank');
  const [sortAsc, setSortAsc] = useState(true);

  // Load dashboard data
  const loadDashboard = useCallback(async (start, end) => {
    try {
      setLoading(true);
      setError(null);
      setNoOrgAssigned(false);
      setAccessDenied(false);

      const [summaryRes, categoriesRes, trendsRes, employeesRes] = await Promise.all([
        api.organisation.getSummary(start, end),
        api.organisation.getCategories(start, end),
        api.organisation.getMonthlyTrends(),
        api.organisation.getEmployees(start, end)
      ]);

      setSummary(summaryRes);
      setCategories(categoriesRes || []);
      setMonthlyTrends(trendsRes || []);
      setEmployees(employeesRes || []);
    } catch (err) {
      if (err?.message?.includes('User does not belong to any organisation')) {
        setNoOrgAssigned(true);
      } else if (
        err?.status === 403 ||
        err?.status === 401 ||
        err?.message?.includes('Access denied') ||
        err?.message?.includes('Only organisation admins') ||
        err?.message?.includes('Organisation administrator') ||
        err?.message?.includes('Forbidden')
      ) {
        setAccessDenied(true);
        setAccessDeniedMessage(
          err?.message || 'Access denied: Only organisation admins can access this dashboard.'
        );
      } else {
        setError(err?.message || 'Failed to load organisation dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const currentRole = profile?.role || user?.role;
    if (currentRole && currentRole !== 'ORG_ADMIN' && currentRole !== 'ROLE_ORG_ADMIN') {
      setAccessDenied(true);
      setAccessDeniedMessage(
        `Your account currently has the standard ${currentRole} role. Access to the Organisation Dashboard is reserved for accounts with the ORG_ADMIN role.`
      );
      setLoading(false);
      return;
    }
    loadDashboard(startDate, endDate);
  }, [authLoading, profile?.role, user?.role, loadDashboard, startDate, endDate]);

  // Handle Preset Clicks
  const handlePreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();
    let start;
    let end = now;

    if (preset === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === 'LAST_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'LAST_90D') {
      start = new Date();
      start.setDate(now.getDate() - 89);
    } else if (preset === 'YTD') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    const startStr = formatDate(start);
    const endStr = formatDate(end);
    setStartDate(startStr);
    setEndDate(endStr);
  };

  const handleDateChange = (type, val) => {
    setActivePreset('CUSTOM');
    if (type === 'start') {
      setStartDate(val);
      if (val > endDate) {
        setEndDate(val);
      }
    } else {
      if (val < startDate) {
        setEndDate(startDate);
      } else {
        setEndDate(val);
      }
    }
  };

  // Sort employee comparison
  const sortedEmployees = useMemo(() => {
    const list = [...employees];
    list.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal ?? 0);
      bVal = Number(bVal ?? 0);
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [employees, sortKey, sortAsc]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'rank' || key === 'username');
    }
  };

  // CSR CSV Export
  const handleExportCsv = () => {
    if (!summary) return;

    const orgName = summary.organisationName || 'Organisation';
    const lines = [];

    // Header Metadata
    lines.push(`"CarbonTrack Corporate Sustainability Report (CSR)"`);
    lines.push(`"Organisation","${orgName}"`);
    lines.push(`"Reporting Period","${summary.startDate} to ${summary.endDate}"`);
    lines.push(`"Export Timestamp","${new Date().toISOString()}"`);
    lines.push(``);

    // Summary Section
    lines.push(`"--- SUMMARY KPIS ---"`);
    lines.push(`"Metric","Value","Unit"`);
    lines.push(`"Total Organisation Emissions",${summary.totalCo2eKg},"kg CO2e"`);
    lines.push(`"Active Members",${summary.activeEmployees},"count"`);
    lines.push(`"Total Members",${summary.totalEmployees},"count"`);
    lines.push(`"Total Activities Logged",${summary.totalActivities},"count"`);
    lines.push(`"Current Calendar Month Emissions",${summary.currentMonthCo2eKg},"kg CO2e"`);
    lines.push(`"Previous Calendar Month Emissions",${summary.previousMonthCo2eKg},"kg CO2e"`);
    lines.push(`"Month-over-Month Change",${summary.monthOverMonthChangePercentage}%,"%"`);
    lines.push(``);

    // Category Breakdown
    lines.push(`"--- CATEGORY BREAKDOWN ---"`);
    lines.push(`"Category","Emissions (kg CO2e)","Share (%)","Activity Count"`);
    categories.forEach((cat) => {
      lines.push(`"${cat.category}",${cat.totalCo2eKg},${cat.percentage}%,${cat.activityCount}`);
    });
    lines.push(``);

    // Monthly Trends (Last 6 Months)
    lines.push(`"--- 6-MONTH EMISSION TRENDS ---"`);
    lines.push(`"Year","Month","Period","Emissions (kg CO2e)","Active Members","Activities","MoM Change (%)"`);
    monthlyTrends.forEach((trend) => {
      lines.push(`${trend.year},${trend.month},"${trend.periodLabel}",${trend.totalCo2eKg},${trend.activeEmployees},${trend.totalActivities},${trend.changePercentage}%`);
    });
    lines.push(``);

    // Member Aggregates (Privacy Safe: Username, emissions, activities, share)
    lines.push(`"--- MEMBER PERFORMANCE AGGREGATES ---"`);
    lines.push(`"Rank","Username","Display Name","Total Emissions (kg CO2e)","Activities Logged","Share of Org Footprint (%)"`);
    employees.forEach((emp) => {
      lines.push(`${emp.rank},"${emp.username}","${emp.displayName || emp.username}",${emp.totalCo2eKg},${emp.totalActivities},${emp.percentageOfOrgEmissions}%`);
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CSR_Report_${orgName.replace(/\s+/g, '_')}_${summary.startDate}_to_${summary.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Recharts Chart Tooltip Style
  const tooltipStyle = {
    backgroundColor: isDark ? '#17241D' : '#FFFFFF',
    borderRadius: '8px',
    border: isDark ? '1px solid #273B2F' : '1px solid #D7E6CE',
    color: isDark ? '#EDF5EE' : '#1D2E24',
    boxShadow: 'var(--shadow-md)',
    fontSize: '0.8125rem'
  };

  // MoM Indicator
  const momPct = summary?.monthOverMonthChangePercentage ? Number(summary.monthOverMonthChangePercentage) : 0;
  const isReduction = momPct < 0;
  const isIncrease = momPct > 0;

  return (
    <main className="org-dashboard-page">
      {/* Header */}
      <header className="org-header">
        <div className="org-header-copy">
          <span className="org-eyebrow">
            <Building2 size={16} /> ORGANISATION AUDIT &amp; ESG
          </span>
          <div className="org-title-row">
            <h1 className="org-title">Organisation Dashboard</h1>
            {summary?.organisationName && (
              <span className="org-name-badge">
                <Building2 size={13} /> {summary.organisationName}
              </span>
            )}
          </div>
          <p className="org-subtitle">
            Enterprise carbon accounting, member engagement analysis, and CSR compliance tracking.
          </p>
        </div>

        <div className="org-actions-bar">
          <a
            href="/organisation/members"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            title="Manage Organisation Members & Invitations"
          >
            <Users size={14} />
            <span>Manage Members</span>
          </a>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadDashboard(startDate, endDate)}
            disabled={loading}
            title="Refresh Dashboard"
          >
            <RotateCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExportCsv}
            disabled={loading || !summary}
            title="Download CSR Compliance Report (CSV)"
          >
            <Download size={14} />
            <span>Export CSR CSV</span>
          </button>
        </div>
      </header>

      {/* Date Filter & Preset Controls */}
      <section className="org-filter-card" aria-label="Date filtering controls">
        <div className="org-filter-presets">
          <button
            type="button"
            className={`org-preset-btn ${activePreset === 'THIS_MONTH' ? 'active' : ''}`}
            onClick={() => handlePreset('THIS_MONTH')}
          >
            This Month
          </button>
          <button
            type="button"
            className={`org-preset-btn ${activePreset === 'LAST_MONTH' ? 'active' : ''}`}
            onClick={() => handlePreset('LAST_MONTH')}
          >
            Last Month
          </button>
          <button
            type="button"
            className={`org-preset-btn ${activePreset === 'LAST_90D' ? 'active' : ''}`}
            onClick={() => handlePreset('LAST_90D')}
          >
            Last 90 Days
          </button>
          <button
            type="button"
            className={`org-preset-btn ${activePreset === 'YTD' ? 'active' : ''}`}
            onClick={() => handlePreset('YTD')}
          >
            Year to Date
          </button>
        </div>

        <div className="org-date-inputs">
          <div className="org-date-field">
            <Calendar size={14} />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
              aria-label="Filter start date"
            />
          </div>
          <div className="org-date-field">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={formatDate(new Date())}
              onChange={(e) => handleDateChange('end', e.target.value)}
              aria-label="Filter end date"
            />
          </div>
        </div>
      </section>

      {/* Access Denied Alert */}
      {accessDenied && (
        <div className="org-alert error" role="alert">
          <ShieldAlert size={20} />
          <div>
            <strong>Access Denied: Organisation Admin Role Required</strong>
            <p style={{ margin: '0.2rem 0 0' }}>
              {accessDeniedMessage || 'Access to the Organisation Dashboard is restricted to users with the ORG_ADMIN role.'}
            </p>
          </div>
          <a
            href="/dashboard"
            className="btn btn-secondary btn-xs"
            style={{ marginLeft: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            Back to Dashboard
          </a>
        </div>
      )}

      {/* Warning State: Admin without Organisation */}
      {!accessDenied && noOrgAssigned && (
        <div className="org-alert warning" role="alert">
          <ShieldAlert size={20} />
          <div>
            <strong>No Organisation Assigned</strong>
            <p style={{ margin: '0.2rem 0 0' }}>
              Your account has Organisation Admin permissions, but has not yet been linked to a registered organisation in the system.
              Please contact your platform administrator to associate an organisation ID with your user profile.
            </p>
          </div>
        </div>
      )}

      {/* Generic Error Alert */}
      {!accessDenied && error && (
        <div className="org-alert error" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>Error Loading Data</strong>
            <p style={{ margin: '0.2rem 0 0' }}>{error}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => loadDashboard(startDate, endDate)}
            style={{ marginLeft: 'auto' }}
          >
            Retry
          </button>
        </div>
      )}

      {!accessDenied && loading && !summary ? (
        <div className="org-empty-state">
          <LoadingSpinner size="lg" />
          <p>Compiling organisation sustainability data...</p>
        </div>
      ) : !accessDenied && summary ? (
        <>
          {/* Section A: Summary Cards */}
          <section className="org-summary-grid" aria-label="Organisation metrics summary">
            {/* Card 1: Total Footprint */}
            <div className="org-metric-card highlight">
              <div className="org-metric-header">
                <span className="org-metric-label">Total Footprint</span>
                <span className="org-metric-icon">
                  <Leaf size={16} />
                </span>
              </div>
              <div className="org-metric-body">
                <span className="org-metric-num">{formatEmissions(summary.totalCo2eKg)}</span>
                <span className="org-metric-unit">{unitLabel}</span>
              </div>
              <span className="org-metric-footer">Across verified reporting window</span>
            </div>

            {/* Card 2: Active Members */}
            <div className="org-metric-card">
              <div className="org-metric-header">
                <span className="org-metric-label">Active Members</span>
                <span className="org-metric-icon">
                  <Users size={16} />
                </span>
              </div>
              <div className="org-metric-body">
                <span className="org-metric-num">{summary.activeEmployees}</span>
                <span className="org-metric-unit">/ {summary.totalEmployees}</span>
              </div>
              <span className="org-metric-footer">Members logged this period</span>
            </div>

            {/* Card 3: Total Activities */}
            <div className="org-metric-card">
              <div className="org-metric-header">
                <span className="org-metric-label">Logged Activities</span>
                <span className="org-metric-icon">
                  <Activity size={16} />
                </span>
              </div>
              <div className="org-metric-body">
                <span className="org-metric-num">{summary.totalActivities}</span>
                <span className="org-metric-unit">entries</span>
              </div>
              <span className="org-metric-footer">Across all 4 carbon sectors</span>
            </div>

            {/* Card 4: Current Month */}
            <div className="org-metric-card">
              <div className="org-metric-header">
                <span className="org-metric-label">Current Month</span>
                <span className="org-metric-icon">
                  <Calendar size={16} />
                </span>
              </div>
              <div className="org-metric-body">
                <span className="org-metric-num">{formatEmissions(summary.currentMonthCo2eKg)}</span>
                <span className="org-metric-unit">{unitLabel}</span>
              </div>
              <span className="org-metric-footer">Calendar month to date</span>
            </div>

            {/* Card 5: Previous Month */}
            <div className="org-metric-card">
              <div className="org-metric-header">
                <span className="org-metric-label">Previous Month</span>
                <span className="org-metric-icon">
                  <Clock size={16} />
                </span>
              </div>
              <div className="org-metric-body">
                <span className="org-metric-num">{formatEmissions(summary.previousMonthCo2eKg)}</span>
                <span className="org-metric-unit">{unitLabel}</span>
              </div>
              <span className="org-metric-footer">Full calendar baseline</span>
            </div>

            {/* Card 6: MoM Change */}
            <div className="org-metric-card">
              <div className="org-metric-header">
                <span className="org-metric-label">MoM Trend</span>
                <span className="org-metric-icon">
                  {isReduction ? <TrendingDown size={16} /> : isIncrease ? <TrendingUp size={16} /> : <Minus size={16} />}
                </span>
              </div>
              <div className="org-metric-body">
                <span
                  className={`org-mom-pill ${
                    isReduction ? 'reduction' : isIncrease ? 'increase' : 'neutral'
                  }`}
                >
                  {isReduction ? <TrendingDown size={13} /> : isIncrease ? <TrendingUp size={13} /> : null}
                  {isIncrease ? '+' : ''}
                  {summary.monthOverMonthChangePercentage != null ? `${summary.monthOverMonthChangePercentage}%` : '0.00%'}
                </span>
              </div>
              <span className="org-metric-footer">
                {isReduction ? 'Reduction achieved' : isIncrease ? 'Increase from last month' : 'No variance'}
              </span>
            </div>
          </section>

          {/* Section B & C: Charts Grid */}
          <section className="org-charts-grid">
            {/* Category Emissions (PieChart) */}
            <div className="org-chart-card">
              <div className="org-card-header">
                <h2 className="org-card-title">Category Emission Distribution</h2>
                <p className="org-card-sub">Sector contributions across the selected timeframe</p>
              </div>

              {categories.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="totalCo2eKg"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categories.map((entry) => (
                          <Cell
                            key={`cat-${entry.category}`}
                            fill={getCategoryColor(entry.category, isDark)}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val) => [`${formatEmissions(val)} ${unitLabel}`, 'Emissions']}
                        contentStyle={tooltipStyle}
                        itemStyle={{ color: isDark ? '#EDF5EE' : '#1D2E24' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="org-category-legend">
                    {categories.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.category] || Leaf;
                      return (
                        <div key={cat.category} className="org-cat-row">
                          <div className="org-cat-name-group">
                            <span
                              className="org-cat-swatch"
                              style={{ backgroundColor: getCategoryColor(cat.category, isDark) }}
                            />
                            <Icon size={14} className="text-muted" />
                            <span className="org-cat-name">{cat.category}</span>
                          </div>
                          <div className="org-cat-values">
                            <span className="org-cat-emissions">
                              {formatEmissions(cat.totalCo2eKg)} {unitLabel}
                            </span>
                            <span className="org-cat-pct">({cat.percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="org-empty-state">
                  <Leaf size={28} />
                  <p>No category emissions logged during this date range.</p>
                </div>
              )}
            </div>

            {/* Monthly Emission Trends (LineChart) */}
            <div className="org-chart-card">
              <div className="org-card-header">
                <h2 className="org-card-title">Six-Month Emission Trends</h2>
                <p className="org-card-sub">Continuous monthly trajectory including zero-emission intervals</p>
              </div>

              {monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={290}>
                  <LineChart
                    data={monthlyTrends}
                    margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#273B2F' : '#E5F0DF'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="periodLabel"
                      stroke={isDark ? '#A3BBAA' : '#556B5B'}
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#A3BBAA' : '#556B5B'}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => (isTonnes ? `${(val / 1000).toFixed(1)}t` : `${val}kg`)}
                    />
                    <RechartsTooltip
                      contentStyle={tooltipStyle}
                      formatter={(val, name) => {
                        if (name === 'totalCo2eKg') {
                          return [`${formatEmissions(val)} ${unitLabel}`, 'Emissions'];
                        }
                        return [val, name];
                      }}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        if (!item) return label;
                        return `${label} · Active: ${item.activeEmployees} members · MoM: ${item.changePercentage}%`;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalCo2eKg"
                      name="totalCo2eKg"
                      stroke={isDark ? '#78C78F' : '#244B35'}
                      strokeWidth={3}
                      dot={{ r: 4, fill: isDark ? '#78C78F' : '#244B35' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="org-empty-state">
                  <Calendar size={28} />
                  <p>No historical monthly data recorded yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Section D: Member Comparison Table */}
          <section className="org-table-card">
            <div className="org-table-header-row">
              <div>
                <h2 className="org-card-title">Member Contribution Comparison</h2>
                <p className="org-card-sub">
                  Ranked participation roster. Individual details and email addresses remain strictly private.
                </p>
              </div>
              <span className="org-name-badge">
                <Users size={13} /> {employees.length} MEMBERS ENROLLED
              </span>
            </div>

            {sortedEmployees.length > 0 ? (
              <div className="org-table-wrap">
                <table className="org-table" aria-label="Member sustainability comparison">
                  <thead>
                    <tr>
                      <th
                        className="sortable"
                        onClick={() => handleSort('rank')}
                        title="Sort by Rank"
                      >
                        Rank <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
                      </th>
                      <th
                        className="sortable"
                        onClick={() => handleSort('username')}
                        title="Sort by Member Name"
                      >
                        Member <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
                      </th>
                      <th
                        className="sortable"
                        onClick={() => handleSort('totalCo2eKg')}
                        title="Sort by Total Emissions"
                      >
                        Footprint ({unitLabel}) <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
                      </th>
                      <th
                        className="sortable"
                        onClick={() => handleSort('totalActivities')}
                        title="Sort by Activities Logged"
                      >
                        Activities <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
                      </th>
                      <th
                        className="sortable"
                        onClick={() => handleSort('percentageOfOrgEmissions')}
                        title="Sort by Percentage Contribution"
                      >
                        Org Share (%) <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEmployees.map((emp) => {
                      const rankClass =
                        emp.rank === 1 ? 'top-1' : emp.rank === 2 ? 'top-2' : emp.rank === 3 ? 'top-3' : '';
                      return (
                        <tr key={emp.username}>
                          <td className="org-rank-cell">
                            <span className={`org-rank-badge ${rankClass}`}>{emp.rank}</span>
                          </td>
                          <td>
                            <div className="org-user-cell" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Avatar
                                avatarSeed={emp.avatarSeed}
                                seed={emp.avatarSeed || emp.username}
                                username={emp.username}
                                name={emp.displayName || emp.username}
                                profileImageUrl={emp.profileImageUrl}
                                size={32}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="org-user-name">
                                  {emp.displayName || emp.username}
                                </span>
                                <span className="org-user-handle">@{emp.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{formatEmissions(emp.totalCo2eKg)}</strong> {unitLabel}
                          </td>
                          <td>{emp.totalActivities} entries</td>
                          <td className="org-pct-cell">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                              <span>{emp.percentageOfOrgEmissions}%</span>
                            </div>
                            <div className="org-pct-bar-bg">
                              <div
                                className="org-pct-bar-fill"
                                style={{ width: `${Math.min(Number(emp.percentageOfOrgEmissions || 0), 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="org-empty-state">
                <Users size={28} />
                <p>No member records found for this organisation.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

