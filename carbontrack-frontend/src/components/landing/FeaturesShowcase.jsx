import React, { useRef, useState } from 'react';
import {
  Activity,
  BarChart2,
  Target,
  Sparkles,
  Trophy,
  Building2,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Users,
  ShieldCheck,
  Zap,
  Car,
  Utensils,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ALL_FEATURES = [
  {
    id: 'activity-tracking',
    tag: 'Core Engine',
    title: 'Precision Activity Tracking',
    subtitle: 'From Everyday Motion to Precise CO₂e Quantities',
    desc: 'Log commutes, utility meters, meals, and purchases with one-click presets or custom quantities. CarbonTrack matches each entry against validated regional emission factors in real time.',
    icon: Activity,
    color: '#2A9D8F',
    stats: 'Verified emission factors supported',
    previewType: 'activity'
  },
  {
    id: 'analytics',
    tag: 'Deep Insights',
    title: 'Interactive Multi-Period Analytics',
    subtitle: 'Daily, Weekly & Monthly Trajectory Analysis',
    desc: 'View your emissions through responsive interactive charts. Track month-over-month reductions, identify peak emission days, and discover your personal emission breakdown across 4 primary categories.',
    icon: BarChart2,
    color: '#3A86C8',
    stats: 'Real-time trend computations',
    previewType: 'analytics'
  },
  {
    id: 'goals',
    tag: 'Accountability',
    title: 'Category-Specific Goals',
    subtitle: 'Actionable Reduction Milestones with Visual Targets',
    desc: 'Establish targeted reduction goals for Transport, Electricity, Food, or Shopping. Animated progress rings and projected trajectories keep you accountable, signaling when you are on pace.',
    icon: Target,
    color: '#E06D53',
    stats: 'Custom targets & progress rings',
    previewType: 'goals'
  },
  {
    id: 'recommendations',
    tag: 'Smart Automation',
    title: 'Personalised Recommendations',
    subtitle: 'Tailored Suggestions Based on Your Highest Impact Hotspots',
    desc: 'The intelligent recommendation engine detects spikes in specific domains and generates practical, step-by-step swaps with estimated CO₂e savings. One click converts any recommendation into an active tracked goal.',
    icon: Sparkles,
    color: '#7C3AED',
    stats: 'Linked 1-click goal creation',
    previewType: 'recommendations'
  },
  {
    id: 'community',
    tag: 'Gamification & Peer Benchmarks',
    title: 'Community & Peer Benchmarks',
    subtitle: 'Dual Leaderboards & Certified Leaf Medals',
    desc: 'Compare progress anonymously against regional community averages. Climb the leaderboard, unlock verified achievement badges, and earn certified Gold, Silver, and Bronze leaf medals.',
    icon: Trophy,
    color: '#D9822B',
    stats: 'Certified podium medals & badges',
    previewType: 'community'
  },
  {
    id: 'organisation',
    tag: 'Enterprise & Teams',
    title: 'Organisation Sustainability Portal',
    subtitle: 'Collective Footprints, Team Comparisons & ESG Reporting',
    desc: 'Empower companies, universities, and sustainability teams to track collective scope emissions. Admins invite members, manage participation, export CSV rollups, and celebrate team sustainability leaders.',
    icon: Building2,
    color: '#2E7D32',
    stats: 'Dual member & org management',
    previewType: 'organisation'
  }
];

export default function FeaturesShowcase() {
  const [activeTab, setActiveTab] = useState('activity-tracking');
  const activeFeature = ALL_FEATURES.find((f) => f.id === activeTab) || ALL_FEATURES[0];
  const tabRefs = useRef({});

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    if (tabRefs.current[tabId]) {
      tabRefs.current[tabId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  return (
    <section className="landing-features-section" id="features">
      <div className="landing-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <span className="section-eyebrow">Comprehensive Platform Capabilities</span>
          <h2 className="section-title">Engineered for Lasting Climate Impact</h2>
          <p className="section-description">
            A complete suite of scientific tools designed to help individuals, households, and teams measure and reduce emissions.
          </p>
        </div>

        {/* Feature Navigation Tabs - Scrollable on mobile */}
        <div className="feature-nav-scroll-wrapper">
          <div className="feature-nav-row" role="tablist">
            {ALL_FEATURES.map((item) => {
              const Icon = item.icon;
              const isSelected = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[item.id] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`feature-tab-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleTabSelect(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Feature Interactive Showcase Panel */}
        <div className="feature-showcase-panel">
          <div className="feature-showcase-grid">
            {/* Left Narrative Column */}
            <div className="feature-desc-col">
              <span className="feature-tag-badge">{activeFeature.tag}</span>
              <h3 className="feature-main-heading">{activeFeature.title}</h3>
              <h4 className="feature-sub-heading">{activeFeature.subtitle}</h4>
              <p className="feature-paragraph">{activeFeature.desc}</p>

              <div className="feature-stats-pill">
                <CheckCircle2 size={15} color="var(--forest-primary, #2e7d32)" />
                <span>{activeFeature.stats}</span>
              </div>

              <div className="feature-cta-row">
                <Link to="/register" className="btn btn-primary btn-md">
                  <span>Explore {activeFeature.title}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Right Mockup Visualization Column */}
            <div className="feature-mockup-col">
              {/* 1. Activity Tracking Visualization */}
              {activeFeature.previewType === 'activity' && (
                <div className="mockup-frame activity-mockup">
                  <div className="mockup-header-bar">
                    <span className="mockup-dot red" />
                    <span className="mockup-dot yellow" />
                    <span className="mockup-dot green" />
                    <span className="mockup-title-text">Live Activity Logging Engine</span>
                  </div>
                  <div className="mockup-body">
                    <div className="mockup-live-indicator">
                      <span className="live-pulse-dot" />
                      <span>Real-Time DEFRA Emission Matching</span>
                    </div>

                    <div className="mockup-preset-card active">
                      <div className="preset-icon-wrap icon-car">
                        <Car size={16} />
                      </div>
                      <div className="preset-info">
                        <div className="preset-name">Car Commute (Petrol)</div>
                        <div className="preset-val">25 km → <strong>4.80 kg CO₂e</strong></div>
                      </div>
                      <span className="preset-status verified">Verified</span>
                    </div>

                    <div className="mockup-preset-card">
                      <div className="preset-icon-wrap icon-zap">
                        <Zap size={16} />
                      </div>
                      <div className="preset-info">
                        <div className="preset-name">Grid Electricity</div>
                        <div className="preset-val">10 kWh → <strong>7.08 kg CO₂e</strong></div>
                      </div>
                      <span className="preset-status">National Grid</span>
                    </div>

                    <div className="mockup-preset-card">
                      <div className="preset-icon-wrap icon-food">
                        <Utensils size={16} />
                      </div>
                      <div className="preset-info">
                        <div className="preset-name">Plant-Based Lunch</div>
                        <div className="preset-val">1 meal → <strong>0.80 kg CO₂e</strong> (Saved 1.4 kg)</div>
                      </div>
                      <span className="preset-status eco">Eco Swap</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Analytics Visualization */}
              {activeFeature.previewType === 'analytics' && (
                <div className="mockup-frame analytics-mockup">
                  <div className="mockup-header-bar">
                    <span className="mockup-dot red" />
                    <span className="mockup-dot yellow" />
                    <span className="mockup-dot green" />
                    <span className="mockup-title-text">Trajectory Analytics · Multi-Period</span>
                  </div>
                  <div className="mockup-body">
                    <div className="analytics-trend-indicator">
                      <span className="trend-pct">↓ 21.4% MoM</span>
                      <span className="trend-msg">Footprint Reduction vs Baseline</span>
                    </div>

                    {/* Mini SVG Sparkline Bars */}
                    <div className="analytics-mini-bars">
                      {[38, 52, 45, 60, 48, 35, 28].map((val, idx) => (
                        <div key={idx} className="mini-bar-col">
                          <div className="mini-bar-fill" style={{ height: `${val}%` }} />
                          <span className="mini-bar-day">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}</span>
                        </div>
                      ))}
                    </div>

                    <div className="analytics-bar-stack">
                      <div className="mockup-bar-row">
                        <span className="bar-lbl"><Car size={13} /> Transport</span>
                        <div className="mockup-bar-track">
                          <div className="mockup-bar-fill fill-transport" style={{ width: '48%' }} />
                        </div>
                        <span className="bar-val">48%</span>
                      </div>
                      <div className="mockup-bar-row">
                        <span className="bar-lbl"><Zap size={13} /> Electricity</span>
                        <div className="mockup-bar-track">
                          <div className="mockup-bar-fill fill-energy" style={{ width: '32%' }} />
                        </div>
                        <span className="bar-val">32%</span>
                      </div>
                      <div className="mockup-bar-row">
                        <span className="bar-lbl"><Utensils size={13} /> Food</span>
                        <div className="mockup-bar-track">
                          <div className="mockup-bar-fill fill-food" style={{ width: '14%' }} />
                        </div>
                        <span className="bar-val">14%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Goals Progress Ring Visualization */}
              {activeFeature.previewType === 'goals' && (
                <div className="mockup-frame goals-mockup">
                  <div className="mockup-header-bar">
                    <span className="mockup-dot red" />
                    <span className="mockup-dot yellow" />
                    <span className="mockup-dot green" />
                    <span className="mockup-title-text">Active Sustainability Goals</span>
                  </div>
                  <div className="mockup-body">
                    <div className="goal-mockup-card">
                      <div className="goal-progress-centerpiece">
                        {/* Animated SVG Progress Ring */}
                        <div className="goal-svg-ring-wrap">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="var(--border-soft, rgba(120, 199, 143, 0.2))"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="var(--forest-primary, #2e7d32)"
                              strokeWidth="8"
                              strokeDasharray="251.2"
                              strokeDashoffset="65.3"
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="goal-ring-label">
                            <strong className="ring-pct">74%</strong>
                            <small className="ring-sub">On Track</small>
                          </div>
                        </div>

                        <div className="goal-info-right">
                          <strong className="goal-title-txt">Monthly Commute Budget</strong>
                          <span className="goal-target-txt">Target: 120 kg CO₂e</span>
                          <span className="goal-allowance-txt">Remaining: <strong>31.2 kg</strong></span>
                          <span className="goal-daily-burn">Daily allowance: ~2.6 kg/day</span>
                        </div>
                      </div>

                      <div className="goal-status-strip">
                        <span className="status-badge on-track">Projected: -18% Below Target</span>
                        <span className="status-days">12 days remaining</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Recommendations Visualization */}
              {activeFeature.previewType === 'recommendations' && (
                <div className="mockup-frame reco-mockup">
                  <div className="mockup-header-bar">
                    <span className="mockup-dot red" />
                    <span className="mockup-dot yellow" />
                    <span className="mockup-dot green" />
                    <span className="mockup-title-text">Personalised AI Recommendations</span>
                  </div>
                  <div className="mockup-body">
                    <div className="reco-glowing-banner">
                      <Sparkles size={14} className="reco-sparkle" />
                      <span>Hotspot detected: Transport accounts for 58% of this week's emissions</span>
                    </div>

                    <div className="reco-item-card featured">
                      <div className="reco-badge-row">
                        <span className="reco-badge high">High Impact</span>
                        <span className="reco-saving-pill">-18.5 kg CO₂e / week</span>
                      </div>
                      <h5 className="reco-card-title">Switch 2 office commute days to train</h5>
                      <p className="reco-card-desc">
                        Replaces 64 km of petrol driving with electrified intercity rail.
                      </p>
                      <button type="button" className="btn btn-primary btn-sm reco-cta">
                        <span>Adopt & Create Goal</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Community & Benchmarks Visualization */}
              {activeFeature.previewType === 'community' && (
                <div className="mockup-frame community-mockup">
                  <div className="mockup-header-bar">
                    <span className="mockup-dot red" />
                    <span className="mockup-dot yellow" />
                    <span className="mockup-dot green" />
                    <span className="mockup-title-text">Community Benchmarks & Podiums</span>
                  </div>
                  <div className="mockup-body">
                    <div className="community-peer-stat">
                      <Users size={16} className="stat-ico" />
                      <span>Greener than <strong>84%</strong> of regional active participants</span>
                    </div>

                    <div className="community-podium-preview">
                      <div className="podium-item podium-gold">
                        <span className="medal-rank">🥇 1st</span>
                        <span className="medal-name">Sowndarya M.</span>
                        <span className="medal-score">28.4 kg</span>
                      </div>
                      <div className="podium-item podium-silver">
                        <span className="medal-rank">🥈 2nd</span>
                        <span className="medal-name">Marcus Chen</span>
                        <span className="medal-score">34.1 kg</span>
                      </div>
                      <div className="podium-item podium-bronze">
                        <span className="medal-rank">🥉 3rd</span>
                        <span className="medal-name">Elena Rostova</span>
                        <span className="medal-score">39.8 kg</span>
                      </div>
                    </div>

                    <div className="community-leaf-award-strip">
                      <Trophy size={16} color="#D9822B" />
                      <span>Certified Leaf Medal Collection available for top 3 rankers</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Organisation Sustainability Portal — Animated Dashboard Preview (Requirement 7) */}
              {activeFeature.previewType === 'organisation' && (
                <div className="mockup-frame org-dashboard-mockup">
                  <div className="mockup-header-bar">
                    <span className="mockup-dot red" />
                    <span className="mockup-dot yellow" />
                    <span className="mockup-dot green" />
                    <span className="mockup-title-text">Organisation Sustainability Portal</span>
                  </div>
                  <div className="mockup-body">
                    {/* Illustrative sample data watermark / disclosure */}
                    <div className="org-sample-watermark">
                      <ShieldCheck size={13} />
                      <span>Sample preview data for demonstration</span>
                    </div>

                    {/* Animated KPI numbers with Active Member Indicator */}
                    <div className="org-kpi-row-animated">
                      <div className="org-kpi-pill">
                        <div className="org-kpi-top">
                          <span className="org-live-beacon" />
                          <span className="kpi-lbl">Active Members</span>
                        </div>
                        <span className="kpi-num">48</span>
                        <small className="kpi-sub">8 departments participating</small>
                      </div>

                      <div className="org-kpi-pill">
                        <div className="org-kpi-top">
                          <TrendingDown size={14} color="var(--forest-accent, #4ade80)" />
                          <span className="kpi-lbl">Total CO₂e Tracked</span>
                        </div>
                        <span className="kpi-num">1.4 t</span>
                        <small className="kpi-sub">-28% vs previous quarter</small>
                      </div>
                    </div>

                    {/* Compact Analytics Dashboard: Donut Chart + Monthly Trendline */}
                    <div className="org-dashboard-charts-grid">
                      {/* Compact Category-wise Donut Chart */}
                      <div className="org-donut-container">
                        <div className="donut-chart-svg-wrap">
                          <svg width="84" height="84" viewBox="0 0 84 84">
                            {/* Transport: 42% (dash: 92.3, offset: 0) */}
                            <circle
                              cx="42"
                              cy="42"
                              r="35"
                              fill="none"
                              stroke="#2A9D8F"
                              strokeWidth="8"
                              strokeDasharray="92.3 220"
                              strokeDashoffset="0"
                              transform="rotate(-90 42 42)"
                            />
                            {/* Electricity: 35% (dash: 77.0, offset: -92.3) */}
                            <circle
                              cx="42"
                              cy="42"
                              r="35"
                              fill="none"
                              stroke="#F59E0B"
                              strokeWidth="8"
                              strokeDasharray="77.0 220"
                              strokeDashoffset="-92.3"
                              transform="rotate(-90 42 42)"
                            />
                            {/* Food: 15% (dash: 33.0, offset: -169.3) */}
                            <circle
                              cx="42"
                              cy="42"
                              r="35"
                              fill="none"
                              stroke="#668F63"
                              strokeWidth="8"
                              strokeDasharray="33.0 220"
                              strokeDashoffset="-169.3"
                              transform="rotate(-90 42 42)"
                            />
                            {/* Procurement: 8% (dash: 17.6, offset: -202.3) */}
                            <circle
                              cx="42"
                              cy="42"
                              r="35"
                              fill="none"
                              stroke="#E06D53"
                              strokeWidth="8"
                              strokeDasharray="17.6 220"
                              strokeDashoffset="-202.3"
                              transform="rotate(-90 42 42)"
                            />
                          </svg>
                          <div className="donut-center-metric">
                            <strong>1.4t</strong>
                            <small>Scope 1-3</small>
                          </div>
                        </div>

                        {/* Legends */}
                        <div className="org-donut-legends">
                          <div className="donut-legend-row">
                            <span className="legend-dot" style={{ background: '#2A9D8F' }} />
                            <span>Transport</span>
                            <strong>42%</strong>
                          </div>
                          <div className="donut-legend-row">
                            <span className="legend-dot" style={{ background: '#F59E0B' }} />
                            <span>Electricity</span>
                            <strong>35%</strong>
                          </div>
                          <div className="donut-legend-row">
                            <span className="legend-dot" style={{ background: '#668F63' }} />
                            <span>Food</span>
                            <strong>15%</strong>
                          </div>
                        </div>
                      </div>

                      {/* Small Monthly Emissions Trend Graph */}
                      <div className="org-trend-container">
                        <div className="trend-header-row">
                          <span className="trend-title">6-Month Trend</span>
                          <span className="trend-change-badge">↓ 33%</span>
                        </div>
                        <div className="org-trend-sparkline-wrap">
                          <svg width="100%" height="45" viewBox="0 0 160 45" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="orgTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2e7d32" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#2e7d32" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M0,40 L0,15 L32,22 L64,18 L96,28 L128,20 L160,32 L160,45 L0,45 Z"
                              fill="url(#orgTrendGrad)"
                            />
                            <path
                              d="M0,15 L32,22 L64,18 L96,28 L128,20 L160,32"
                              fill="none"
                              stroke="#2e7d32"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx="160" cy="32" r="3.5" fill="#4ade80" />
                          </svg>
                        </div>
                        <div className="trend-months-row">
                          <span>Jan</span>
                          <span>Feb</span>
                          <span>Mar</span>
                          <span>Apr</span>
                          <span>May</span>
                          <span>Jun</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6-Card Distinct Feature Grid (Requirement 6) */}
        <div className="features-showcase-grid-cards">
          {ALL_FEATURES.map((item) => {
            const Icon = item.icon;
            const isSelected = item.id === activeTab;

            return (
              <div
                key={item.id}
                className={`feature-distinction-card card-${item.id} ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleTabSelect(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleTabSelect(item.id);
                  }
                }}
              >
                <div className="card-top-header">
                  <div className="card-icon-bubble" style={{ background: `${item.color}15`, color: item.color }}>
                    <Icon size={20} />
                  </div>
                  <span className="card-tag">{item.tag}</span>
                </div>

                <h4 className="card-title">{item.title}</h4>
                <p className="card-desc">{item.desc}</p>

                {/* Specific Visual Accent for each card */}
                {item.id === 'activity-tracking' && (
                  <div className="card-mini-visual visual-activity">
                    <span className="mini-pulse-dot" />
                    <span>🚗 25 km Commute · 4.8 kg CO₂e</span>
                  </div>
                )}

                {item.id === 'analytics' && (
                  <div className="card-mini-visual visual-analytics">
                    <span className="spark-trend">↓ 21.4% MoM</span>
                    <div className="mini-bar-spark">
                      <span style={{ height: '40%' }} />
                      <span style={{ height: '70%' }} />
                      <span style={{ height: '55%' }} />
                      <span style={{ height: '85%' }} />
                      <span style={{ height: '35%' }} />
                    </div>
                  </div>
                )}

                {item.id === 'goals' && (
                  <div className="card-mini-visual visual-goals">
                    <div className="mini-progress-track">
                      <div className="mini-progress-bar" style={{ width: '74%' }} />
                    </div>
                    <span className="mini-badge on-track">74% Target Reached</span>
                  </div>
                )}

                {item.id === 'recommendations' && (
                  <div className="card-mini-visual visual-reco">
                    <Sparkles size={13} color="#7C3AED" />
                    <span>Save ~18.5 kg CO₂e with Train Swap</span>
                  </div>
                )}

                {item.id === 'community' && (
                  <div className="card-mini-visual visual-community">
                    <Trophy size={13} color="#D9822B" />
                    <span>Top 16% · Certified Leaf Podium</span>
                  </div>
                )}

                {item.id === 'organisation' && (
                  <div className="card-mini-visual visual-org">
                    <span className="mini-beacon" />
                    <span>48 Members · 1.4t Tracked (Sample)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
