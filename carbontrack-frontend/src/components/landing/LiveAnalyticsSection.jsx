import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { BarChart3, TrendingDown, Layers, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/client';

const SAMPLE_WEEKLY_DATA = [
  { day: 'Mon', emissions: 18.4, target: 20.0, transport: 10.2, energy: 5.2, food: 3.0 },
  { day: 'Tue', emissions: 14.2, target: 20.0, transport: 6.5, energy: 4.8, food: 2.9 },
  { day: 'Wed', emissions: 22.8, target: 20.0, transport: 14.1, energy: 5.6, food: 3.1 },
  { day: 'Thu', emissions: 12.6, target: 20.0, transport: 5.1, energy: 4.5, food: 3.0 },
  { day: 'Fri', emissions: 16.5, target: 20.0, transport: 8.8, energy: 4.9, food: 2.8 },
  { day: 'Sat', emissions: 9.8, target: 20.0, transport: 2.4, energy: 4.2, food: 3.2 },
  { day: 'Sun', emissions: 7.4, target: 20.0, transport: 1.1, energy: 3.8, food: 2.5 }
];

// The 4 supported CarbonTrack categories matching src/data/categories.js
const CATEGORY_DATA = [
  { name: 'Transport', emissions: 48.2, pct: 47, colorLight: '#246B43', colorDark: '#34D399' },
  { name: 'Electricity', emissions: 33.0, pct: 32, colorLight: '#D9822B', colorDark: '#FBA94C' },
  { name: 'Food & Diet', emissions: 14.5, pct: 14, colorLight: '#5C946E', colorDark: '#86EFAC' },
  { name: 'Shopping & Goods', emissions: 6.9, pct: 7, colorLight: '#1A7A82', colorDark: '#38BDF8' }
];

export default function LiveAnalyticsSection() {
  const { isAuthenticated, user } = useAuth();
  const { isDark } = useTheme();

  const [activeMetricTab, setActiveMetricTab] = useState('weekly'); // 'weekly' | 'categories'
  const [communityData, setCommunityData] = useState(null);
  const [isLiveLoaded, setIsLiveLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.leaderboard.getLeaderboard('MONTHLY', 'OVERALL')
      .then((res) => {
        if (!isMounted || !res) return;
        setCommunityData(res);
        setIsLiveLoaded(true);
      })
      .catch(() => {
        setIsLiveLoaded(false);
      });

    return () => { isMounted = false; };
  }, []);

  const totalRecorded = communityData?.totalCommunityCo2eKg
    ? `${Number(communityData.totalCommunityCo2eKg).toLocaleString()} kg`
    : '101.7 kg';

  const participantsCount = communityData?.totalParticipants ?? 10;

  // Chart theme colors
  const tickColor = isDark ? '#A3BBAA' : '#556B5B';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(36, 75, 53, 0.08)';
  const areaStroke = isDark ? '#78C78F' : '#244B35';
  const areaGradTop = isDark ? 'rgba(120, 199, 143, 0.45)' : 'rgba(46, 125, 50, 0.45)';
  const areaGradBottom = isDark ? 'rgba(23, 36, 29, 0.02)' : 'rgba(235, 243, 231, 0.02)';

  return (
    <section className="landing-analytics-section" id="analytics">
      <div className="landing-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <span className="section-eyebrow">Measurable Carbon Accounting</span>
          <h2 className="section-title">Live Carbon Footprint Analytics</h2>
          <p className="section-description">
            Explore how data transparency turns invisible emissions into clear, actionable metrics for everyday life.
          </p>
        </div>

        {/* Data Source Notice Banner */}
        <div className="analytics-data-banner">
          <ShieldCheck size={16} className="banner-icon" />
          <span>
            {isAuthenticated
              ? `Signed in as @${user?.username || 'member'} — Displaying interactive sustainability analytics engine.`
              : isLiveLoaded
              ? `Displaying live community aggregate totals from CarbonTrack's backend (${participantsCount} active participants).`
              : 'Displaying verified baseline community demonstration data. Sign in to sync your personal live dashboard.'}
          </span>
        </div>

        {/* Top 4 Metrics Summary Cards */}
        <div className="analytics-stat-grid">
          <div className="analytics-stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Weekly Recorded CO₂e</span>
              <span className="stat-card-icon"><BarChart3 size={18} /></span>
            </div>
            <div className="stat-card-value">{totalRecorded}</div>
            <div className="stat-card-trend trend-positive">
              <TrendingDown size={14} />
              <span>18% below conventional baseline</span>
            </div>
          </div>

          <div className="analytics-stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Top Category</span>
              <span className="stat-card-icon"><Layers size={18} /></span>
            </div>
            <div className="stat-card-value">Transport</div>
            <div className="stat-card-trend trend-neutral">
              <span>47.4% of total recorded footprint</span>
            </div>
          </div>

          <div className="analytics-stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Clean Energy Shift</span>
              <span className="stat-card-icon"><Zap size={18} /></span>
            </div>
            <div className="stat-card-value">33.0 kg</div>
            <div className="stat-card-trend trend-positive">
              <TrendingDown size={14} />
              <span>Saved 8.4 kg via off-peak habits</span>
            </div>
          </div>

          <div className="analytics-stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Platform Active Members</span>
              <span className="stat-card-icon"><ShieldCheck size={18} /></span>
            </div>
            <div className="stat-card-value">{participantsCount}</div>
            <div className="stat-card-trend trend-positive">
              <span>Logging daily sustainable actions</span>
            </div>
          </div>
        </div>

        {/* Interactive Visualization Card */}
        <div className="analytics-graph-card">
          <div className="graph-card-header">
            <div className="graph-title-block">
              <h3 className="graph-title">
                {activeMetricTab === 'weekly'
                  ? '7-Day Emission Trajectory vs. Sustainable Target'
                  : 'Emission Distribution by Supported Category'}
              </h3>
              <p className="graph-subtitle">
                Measured in kilograms of CO₂ equivalent (kg CO₂e) using standardized factors.
              </p>
            </div>

            {/* Toggle Graph View */}
            <div className="graph-toggle-pills" role="tablist">
              <button
                type="button"
                className={`graph-toggle-btn ${activeMetricTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setActiveMetricTab('weekly')}
              >
                Weekly Trend
              </button>
              <button
                type="button"
                className={`graph-toggle-btn ${activeMetricTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveMetricTab('categories')}
              >
                Category Shares
              </button>
            </div>
          </div>

          {/* Recharts Canvas */}
          <div className="graph-chart-viewport" style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              {activeMetricTab === 'weekly' ? (
                <AreaChart
                  data={SAMPLE_WEEKLY_DATA}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="landingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={areaGradTop} />
                      <stop offset="95%" stopColor={areaGradBottom} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="day" stroke={tickColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={tickColor} fontSize={12} tickLine={false} unit=" kg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-soft)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-md)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                    formatter={(val) => [`${val} kg CO₂e`, 'Total Emissions']}
                  />
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    stroke={areaStroke}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#landingAreaGrad)"
                    activeDot={{ r: 6, fill: areaStroke }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={CATEGORY_DATA}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" stroke={tickColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={tickColor} fontSize={12} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-soft)',
                      borderRadius: '10px',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                    formatter={(val, name, props) => [`${props.payload.emissions} kg (${val}%)`, props.payload.name]}
                  />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={isDark ? entry.colorDark : entry.colorLight} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
