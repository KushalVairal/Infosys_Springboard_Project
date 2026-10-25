import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  Users,
  BarChart3,
  Flame,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Info,
  RotateCw,
  Award,
  Zap,
  ShoppingBag,
  Leaf,
  AlertCircle,
  Car,
  UtensilsCrossed
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { getCategoryColor } from '../data/categories';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

const CATEGORY_META = {
  TRANSPORT: {
    label: 'Transport',
    icon: Car,
    color: '#246B43'
  },
  ELECTRICITY: {
    label: 'Electricity',
    icon: Zap,
    color: '#D9822B'
  },
  FOOD: {
    label: 'Food & Dining',
    icon: UtensilsCrossed,
    color: '#5C946E'
  },
  SHOPPING: {
    label: 'Shopping & Waste',
    icon: ShoppingBag,
    color: '#1A7A82'
  }
};

export default function BenchmarkingPage() {
  const { preferredUnit } = useAuth();
  const { isDark } = useTheme();

  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTonnes = preferredUnit === 'TONNES_CO2E';
  const unitLabel = isTonnes ? 'Tonnes CO₂e' : 'kg CO₂e';

  // Value converter helper: kg to preferred unit
  const formatEmission = useCallback(
    (kgValue) => {
      if (kgValue === null || kgValue === undefined) return null;
      const num = Number(kgValue);
      if (isNaN(num)) return null;
      const converted = isTonnes ? num / 1000 : num;
      return Number(converted.toFixed(isTonnes ? 3 : 2));
    },
    [isTonnes]
  );

  const loadBenchmark = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.benchmarks.getMyBenchmark();
      setBenchmark(data);
    } catch (err) {
      setError(err.message || 'Unable to load peer benchmarking data from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBenchmark();
  }, [loadBenchmark]);

  // Chart data preparation for categories
  const categoryChartData = useMemo(() => {
    if (!benchmark || !Array.isArray(benchmark.categoryBenchmarks)) return [];

    return benchmark.categoryBenchmarks.map((item) => {
      const meta = CATEGORY_META[item.category] || { label: item.category };
      const userVal = formatEmission(item.userCo2eKg);
      const avgVal = formatEmission(item.platformAverageCo2eKg);

      return {
        key: item.category,
        category: meta.label,
        userCo2e: userVal !== null ? userVal : 0,
        platformAvg: avgVal !== null ? avgVal : 0,
        hasAvg: avgVal !== null,
        rawUserKg: item.userCo2eKg,
        rawAvgKg: item.platformAverageCo2eKg
      };
    });
  }, [benchmark, formatEmission]);

  if (loading) {
    return (
      <div className="page-loading-wrapper">
        <LoadingSpinner message="Calculating anonymous peer benchmark..." size="lg" />
      </div>
    );
  }

  const status = benchmark?.status || 'NO_USER_ACTIVITY';
  const isSufficient = status === 'SUFFICIENT_DATA';
  const isInsufficientPeers = status === 'INSUFFICIENT_PEERS';
  const isNoActivity = status === 'NO_USER_ACTIVITY' || (!isSufficient && !isInsufficientPeers && !benchmark?.userTotalCo2eKg);

  const userTotalDisplay = formatEmission(benchmark?.userTotalCo2eKg);
  const platformAvgDisplay = formatEmission(benchmark?.platformAverageCo2eKg);
  const ecoPercentile = benchmark?.ecoPercentile !== null && benchmark?.ecoPercentile !== undefined
    ? Number(Number(benchmark.ecoPercentile).toFixed(1))
    : null;

  // Comparison difference calculation
  let diffPercentage = null;
  let isGreenerThanAvg = false;
  if (benchmark?.userTotalCo2eKg !== null && benchmark?.platformAverageCo2eKg !== null && benchmark?.platformAverageCo2eKg !== undefined) {
    const userKg = Number(benchmark.userTotalCo2eKg);
    const avgKg = Number(benchmark.platformAverageCo2eKg);
    if (avgKg > 0) {
      const diff = ((userKg - avgKg) / avgKg) * 100;
      diffPercentage = Math.abs(Number(diff.toFixed(1)));
      isGreenerThanAvg = userKg <= avgKg;
    }
  }

  return (
    <div className="benchmark-page">
      {/* Page Header */}
      <div className="dashboard-header-row">
        <div>
          <div className="benchmark-badge-pill">
            <Users size={16} />
            <span>Peer Benchmarking • Rolling {benchmark?.periodDays || 30} Days</span>
          </div>
          <h1 className="dashboard-title">Peer Benchmarking</h1>
          <p className="dashboard-subtitle">
            Compare your environmental footprint against verified, anonymous platform members.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadBenchmark}
            title="Refresh benchmarking data"
          >
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
          <Link to="/activities" className="btn btn-primary">
            <Flame size={16} />
            <span>Log Activity</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert alert-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={loadBenchmark}>
            Retry
          </button>
        </div>
      )}

      {/* Date Range & Cohort Info Bar */}
      {benchmark && (
        <div className="benchmark-cohort-bar">
          <div className="cohort-item">
            <span className="cohort-label">Reporting Period</span>
            <span className="cohort-val">
              {formatDate(benchmark.startDate)} – {formatDate(benchmark.endDate)}
            </span>
          </div>
          <div className="cohort-divider" />
          <div className="cohort-item">
            <span className="cohort-label">Comparison Cohort</span>
            <span className="cohort-val">
              {benchmark.cohortSize ? `${benchmark.cohortSize} active participants` : 'Cohort pending'}
            </span>
          </div>
          <div className="cohort-divider" />
          <div className="cohort-item">
            <span className="cohort-label">Privacy Guard</span>
            <span className="cohort-val shield-text">
              <ShieldCheck size={14} /> 100% Anonymous Aggregates
            </span>
          </div>
        </div>
      )}

      {/* STATE 1: NO USER ACTIVITY */}
      {isNoActivity && (
        <div className="benchmark-state-container">
          <EmptyState
            title="No Activity Logged in the Last 30 Days"
            description="You need at least one recorded carbon activity in the 30-day reporting window to compute your footprint and unlock community benchmarking."
            actionText="Log Your First Activity"
            onAction={() => window.location.assign('/activities')}
            icon={<BarChart3 size={48} color="var(--forest-primary)" />}
          />
        </div>
      )}

      {/* STATE 2: INSUFFICIENT PEERS (Cohort < 3) */}
      {isInsufficientPeers && !isNoActivity && (
        <div className="benchmark-alert-banner warning">
          <div className="banner-icon-cluster">
            <ShieldCheck size={28} />
          </div>
          <div className="banner-content">
            <h3 className="banner-title">Awaiting Additional Active Peers</h3>
            <p className="banner-desc">
              {benchmark?.message ||
                'To safeguard individual user privacy, CarbonTrack requires at least 3 active participants in the last 30 days before calculating community averages and percentiles.'}
            </p>
            <div className="banner-meta-grid">
              <div className="banner-meta-card">
                <span className="meta-label">Your 30-Day Footprint</span>
                <span className="meta-val">
                  {userTotalDisplay !== null ? `${userTotalDisplay} ${unitLabel}` : 'No activity'}
                </span>
              </div>
              <div className="banner-meta-card">
                <span className="meta-label">Active Peers Recorded</span>
                <span className="meta-val">
                  {benchmark?.cohortSize || 0} / 3 needed
                </span>
              </div>
              <div className="banner-meta-card">
                <span className="meta-label">Platform Average</span>
                <span className="meta-val muted">Privacy Protected (N/A)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD CONTENT (SUFFICIENT_DATA or partial data display) */}
      {!isNoActivity && (
        <>
          {/* Key Metrics Grid */}
          <div className="metrics-grid">
            {/* User Emissions Card */}
            <div className="metric-card card-primary-highlight">
              <div className="metric-header">
                <span className="metric-title">Your 30-Day Footprint</span>
                <span className="metric-icon-bubble">
                  <Flame size={20} color="var(--forest-primary)" />
                </span>
              </div>
              <div className="metric-body">
                <span className="metric-value">
                  {userTotalDisplay !== null ? userTotalDisplay : '—'}
                </span>
                <span className="metric-unit">{unitLabel}</span>
              </div>
              <div className="metric-footer">
                <span className="metric-subtext">
                  Total emissions between {formatDate(benchmark?.startDate)} and {formatDate(benchmark?.endDate)}
                </span>
              </div>
            </div>

            {/* Platform Average Card */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Platform Average</span>
                <span className="metric-icon-bubble">
                  <Users size={20} color="var(--sage-secondary)" />
                </span>
              </div>
              <div className="metric-body">
                {platformAvgDisplay !== null ? (
                  <>
                    <span className="metric-value">{platformAvgDisplay}</span>
                    <span className="metric-unit">{unitLabel}</span>
                  </>
                ) : (
                  <div className="metric-unavailable">
                    <span className="unavailable-pill">Awaiting ≥ 3 Peers</span>
                    <span className="unavailable-sub">Confidential until cohort reaches 3</span>
                  </div>
                )}
              </div>
              <div className="metric-footer">
                {diffPercentage !== null && platformAvgDisplay !== null ? (
                  <div className={`metric-trend-tag ${isGreenerThanAvg ? 'trend-positive' : 'trend-caution'}`}>
                    {isGreenerThanAvg ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    <span>
                      {diffPercentage}% {isGreenerThanAvg ? 'lower than average' : 'above average'}
                    </span>
                  </div>
                ) : (
                  <span className="metric-subtext">Anonymous mean across active cohort</span>
                )}
              </div>
            </div>

            {/* Eco Percentile Card */}
            <div className="metric-card percentile-card">
              <div className="metric-header">
                <span className="metric-title">Eco Percentile</span>
                <span className="metric-icon-bubble">
                  <Award size={20} color="var(--forest-primary)" />
                </span>
              </div>
              <div className="metric-body">
                {ecoPercentile !== null ? (
                  <>
                    <span className="metric-value">{ecoPercentile}</span>
                    <span className="metric-unit">th percentile</span>
                  </>
                ) : (
                  <div className="metric-unavailable">
                    <span className="unavailable-pill">Not Available</span>
                    <span className="unavailable-sub">Requires ≥ 3 active peers</span>
                  </div>
                )}
              </div>
              <div className="metric-footer">
                {ecoPercentile !== null ? (
                  <span className="percentile-highlight">
                    Greener than <strong>{ecoPercentile}%</strong> of active members
                  </span>
                ) : (
                  <span className="metric-subtext">Higher rank = lower relative footprint</span>
                )}
              </div>
            </div>
          </div>

          {/* Eco Percentile Gauge & Explanation Section */}
          <div className="benchmark-percentile-banner">
            <div className="percentile-banner-content">
              <div className="percentile-title-row">
                <Leaf size={22} className="percentile-leaf-icon" />
                <h2 className="percentile-title">Understanding Your Eco Percentile</h2>
              </div>
              <p className="percentile-explanation">
                In CarbonTrack, <strong>a higher Eco Percentile represents superior environmental performance</strong>.
                Your rank reflects the percentage of active community members whose carbon emissions exceed yours.
                For example, an 80th percentile rank indicates your footprint is lower than 80% of active participants in this 30-day window.
              </p>
              {ecoPercentile !== null ? (
                <div className="percentile-meter-container">
                  <div className="percentile-meter-track">
                    <div
                      className="percentile-meter-fill"
                      style={{ width: `${Math.min(Math.max(ecoPercentile, 0), 100)}%` }}
                    />
                    <div
                      className="percentile-meter-pin"
                      style={{ left: `${Math.min(Math.max(ecoPercentile, 0), 100)}%` }}
                    >
                      <span className="pin-label">{ecoPercentile}%</span>
                    </div>
                  </div>
                  <div className="meter-labels-row">
                    <span className="meter-label">0% (Higher Footprint)</span>
                    <span className="meter-label center">50% (Median)</span>
                    <span className="meter-label right">100% (Lowest Footprint)</span>
                  </div>
                </div>
              ) : (
                <div className="percentile-meter-pending">
                  <Info size={16} />
                  <span>Percentile meter will activate once at least 3 peers have active logs in this period.</span>
                </div>
              )}
            </div>
          </div>

          {/* Category Benchmarks Breakdown */}
          <div className="benchmark-section">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">Category-by-Category Comparison</h2>
                <p className="section-subtitle">
                  Examine your sector emissions against anonymous platform averages across Transport, Electricity, Food, and Shopping.
                </p>
              </div>
            </div>

            {/* Visual Recharts Comparison Chart */}
            {isSufficient && categoryChartData.length > 0 && (
              <div className="dashboard-card chart-card-container">
                <div className="chart-header">
                  <h3 className="chart-title">Emissions by Sector ({unitLabel})</h3>
                  <span className="chart-subtitle">Your Footprint vs. Anonymous Cohort Average</span>
                </div>
                <div className="chart-body" style={{ height: 320, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryChartData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2D3748' : '#E5F0DF'} />
                      <XAxis
                        dataKey="category"
                        stroke={isDark ? '#A0AEC0' : '#556B5B'}
                        tick={{ fontSize: 13 }}
                      />
                      <YAxis
                        stroke={isDark ? '#A0AEC0' : '#556B5B'}
                        tick={{ fontSize: 12 }}
                        unit={` ${isTonnes ? 't' : 'kg'}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1A202C' : '#FFFFFF',
                          borderColor: isDark ? '#4A5568' : '#D7E6CE',
                          borderRadius: '10px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(val) => [`${val} ${unitLabel}`]}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="userCo2e"
                        name="Your Emissions"
                        fill="var(--forest-primary)"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="platformAvg"
                        name="Platform Average"
                        fill="var(--sage-secondary)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Category Comparison Cards Grid */}
            <div className="benchmark-category-grid">
              {['TRANSPORT', 'ELECTRICITY', 'FOOD', 'SHOPPING'].map((catKey) => {
                const meta = CATEGORY_META[catKey];
                const IconComponent = meta.icon;
                const catData = benchmark?.categoryBenchmarks?.find((b) => b.category === catKey);

                const userVal = catData ? formatEmission(catData.userCo2eKg) : 0;
                const avgVal = catData ? formatEmission(catData.platformAverageCo2eKg) : null;

                // Category-level comparison
                let catDiff = null;
                let isBetter = false;
                if (userVal !== null && avgVal !== null && avgVal > 0) {
                  const d = ((userVal - avgVal) / avgVal) * 100;
                  catDiff = Math.abs(Number(d.toFixed(1)));
                  isBetter = userVal <= avgVal;
                }

                return (
                  <div key={catKey} className="benchmark-category-card">
                    <div className="category-card-header">
                      <div className="cat-icon-cluster" style={{ color: getCategoryColor(catKey, isDark) }}>
                        <IconComponent size={22} />
                        <span className="cat-card-title">{meta.label}</span>
                      </div>
                      {avgVal !== null && catDiff !== null && (
                        <span className={`cat-status-pill ${isBetter ? 'better' : 'higher'}`}>
                          {isBetter ? 'Below Avg' : 'Above Avg'}
                        </span>
                      )}
                    </div>

                    <div className="category-card-body">
                      <div className="cat-stat-row">
                        <span className="stat-label">Your Footprint:</span>
                        <span className="stat-value user-val">
                          {userVal !== null ? `${userVal} ${unitLabel}` : `0.00 ${unitLabel}`}
                        </span>
                      </div>
                      <div className="cat-stat-row">
                        <span className="stat-label">Platform Average:</span>
                        <span className="stat-value avg-val">
                          {avgVal !== null ? (
                            `${avgVal} ${unitLabel}`
                          ) : (
                            <span className="stat-pending">Awaiting cohort</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="category-card-footer">
                      {avgVal !== null && catDiff !== null ? (
                        <span className={`cat-diff-text ${isBetter ? 'text-green' : 'text-amber'}`}>
                          {isBetter ? (
                            <>
                              <TrendingDown size={14} /> {catDiff}% cleaner than average
                            </>
                          ) : (
                            <>
                              <TrendingUp size={14} /> {catDiff}% higher than average
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="cat-diff-text muted">
                          Requires ≥ 3 active peers to calculate average
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy & Methodology Guarantee */}
          <div className="benchmark-privacy-card">
            <div className="privacy-header">
              <ShieldCheck size={20} color="var(--forest-primary)" />
              <h3 className="privacy-title">Data Privacy & Anonymous Benchmarking Guarantee</h3>
            </div>
            <p className="privacy-text">
              CarbonTrack strictly protects participant confidentiality. Peer comparisons use anonymized, aggregated
              statistics calculated over 30-day sliding windows. No member's name, email, individual habits, or personal
              locations are ever shared or visible to other users.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
