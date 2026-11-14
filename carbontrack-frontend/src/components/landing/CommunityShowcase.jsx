import React, { useState } from 'react';
import { Award, Trophy, Medal, Leaf, Shield, Users, ArrowRight, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import goldLeafMedal from '../../assets/leaderboard-gold-leaf.png';
import silverLeafMedal from '../../assets/leaderboard-silver-leaf.png';
import bronzeLeafMedal from '../../assets/leaderboard-bronze-leaf.png';
import StarBorder from '../animations/StarBorder';

const MILESTONE_BADGES = [
  {
    name: '10 kg CO₂e Saved',
    type: 'Seedling Sprout',
    icon: Leaf,
    progress: 100,
    statusText: '100% Achieved · First verified milestone',
    desc: 'Awarded after achieving your first 10 kg verified carbon reduction.'
  },
  {
    name: '25 kg CO₂e Saved',
    type: 'Green Champion',
    icon: Medal,
    progress: 78,
    statusText: '78% · 19.5 kg of 25 kg logged',
    desc: 'Milestone for consistently logging activities and beating weekly baselines.'
  },
  {
    name: '50 kg CO₂e Saved',
    type: 'Planet Guardian',
    icon: Trophy,
    progress: 32,
    statusText: 'Elite · 16 kg of 50 kg logged',
    desc: 'Elite badge for sustained long-term emission reductions and habit shifts.'
  }
];

const COMMUNITY_LEADERBOARD = [
  {
    rank: 1,
    medal: goldLeafMedal,
    name: '@green_pioneer',
    activities: '14 activities logged',
    emissions: '0.25 kg',
    highlight: true
  },
  {
    rank: 2,
    medal: silverLeafMedal,
    name: '@eco_warrior',
    activities: '9 activities logged',
    emissions: '6.30 kg',
    highlight: false
  },
  {
    rank: 3,
    medal: bronzeLeafMedal,
    name: '@solar_hero',
    activities: '11 activities logged',
    emissions: '7.00 kg',
    highlight: false
  },
  {
    rank: 4,
    medal: null,
    name: '@transit_champion',
    activities: '6 activities logged',
    emissions: '12.40 kg',
    highlight: false
  }
];

const ORGANISATION_LEADERBOARD = [
  {
    rank: 1,
    medal: goldLeafMedal,
    name: 'Engineering & Systems',
    activities: '42 members · 189 activities',
    emissions: '184.2 kg',
    highlight: true
  },
  {
    rank: 2,
    medal: silverLeafMedal,
    name: 'Design & UX Studio',
    activities: '18 members · 94 activities',
    emissions: '210.5 kg',
    highlight: false
  },
  {
    rank: 3,
    medal: bronzeLeafMedal,
    name: 'Operations & Logistics',
    activities: '36 members · 142 activities',
    emissions: '268.0 kg',
    highlight: false
  },
  {
    rank: 4,
    medal: null,
    name: 'Marketing & Outreach',
    activities: '24 members · 88 activities',
    emissions: '312.4 kg',
    highlight: false
  }
];

export default function CommunityShowcase() {
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('community');

  const activeRows = activeLeaderboardTab === 'community' 
    ? COMMUNITY_LEADERBOARD 
    : ORGANISATION_LEADERBOARD;

  return (
    <section className="landing-community-section" id="community">
      <div className="landing-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <span className="section-eyebrow">Milestones & Motivation</span>
          <h2 className="section-title">Achievements, Badges & Dual Leaderboards</h2>
          <p className="section-description">
            Celebrate real progress. Earn authentic leaf medal artwork, collect verified milestone badges, and compare progress on community and organization leaderboards.
          </p>
        </div>

        {/* 2-Column Grid: Medals & Badges on Left, Leaderboard Preview on Right */}
        <div className="community-showcase-grid">
          {/* Column 1: Leaf Medals & Milestone Badges */}
          <div className="medals-showcase-card">
            <div className="card-badge-pill">
              <Trophy size={14} color="#b58a2c" />
              <span>Certified Leaf Medal Collection</span>
            </div>

            <h3 className="showcase-card-title">Gold, Silver & Bronze Leaf Awards</h3>
            <p className="showcase-card-desc">
              Participants who lead in weekly or monthly low emissions earn high-resolution certified leaf medal artwork.
            </p>

            {/* Medal Trio Showcase */}
            <div className="medal-trio-row">
              <div className="medal-item first" title="Awarded to the monthly 1st place champion">
                <div className="medal-glow gold-glow" />
                <img src={goldLeafMedal} alt="Gold Leaf Medal" className="medal-img" />
                <strong className="medal-title">Gold Leaf</strong>
                <span className="medal-rank">1st Place</span>
                <span className="medal-criteria-sub">Top 1% Lowest Net Emissions</span>
              </div>

              <div className="medal-item second" title="Awarded to the monthly 2nd place runner-up">
                <div className="medal-glow silver-glow" />
                <img src={silverLeafMedal} alt="Silver Leaf Medal" className="medal-img" />
                <strong className="medal-title">Silver Leaf</strong>
                <span className="medal-rank">2nd Place</span>
                <span className="medal-criteria-sub">Top 5% Net Reduction Pace</span>
              </div>

              <div className="medal-item third" title="Awarded to the monthly 3rd place achiever">
                <div className="medal-glow bronze-glow" />
                <img src={bronzeLeafMedal} alt="Bronze Leaf Medal" className="medal-img" />
                <strong className="medal-title">Bronze Leaf</strong>
                <span className="medal-rank">3rd Place</span>
                <span className="medal-criteria-sub">Top 10% Consistency Leader</span>
              </div>
            </div>

            {/* Milestone Badges List */}
            <div className="milestone-badges-list">
              <h4 className="badges-list-title">
                <Award size={16} />
                <span>Earnable Milestone Badges</span>
              </h4>

              <div className="badges-flex">
                {MILESTONE_BADGES.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div key={i} className="milestone-badge-pill" title={b.desc}>
                      <span className="badge-icon-box"><Icon size={14} /></span>
                      <div className="badge-text-box">
                        <div className="badge-title-row">
                          <strong>{b.name}</strong>
                          <span className="badge-type-label">{b.type}</span>
                        </div>
                        <div className="badge-progress-track">
                          <div 
                            className="badge-progress-fill" 
                            style={{ width: `${b.progress}%` }} 
                          />
                        </div>
                        <small className="badge-status-sub">{b.statusText}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Dual Leaderboard & Privacy Safeguards */}
          <div className="leaderboard-showcase-card">
            <div className="card-badge-pill">
              <Users size={14} color="var(--forest-primary, #2e7d32)" />
              <span>Dual Leaderboard Architecture</span>
            </div>

            <h3 className="showcase-card-title">Friendly, Transparent Accountability</h3>
            <p className="showcase-card-desc">
              Toggle seamlessly between the global Community Leaderboard and your private Organisation Leaderboard.
            </p>

            {/* Dual Tab Switcher */}
            <div className="leaderboard-toggle-row">
              <button
                type="button"
                className={`leaderboard-tab-btn ${activeLeaderboardTab === 'community' ? 'active' : ''}`}
                onClick={() => setActiveLeaderboardTab('community')}
              >
                <Users size={13} />
                <span>Global Community</span>
              </button>
              <button
                type="button"
                className={`leaderboard-tab-btn ${activeLeaderboardTab === 'organisation' ? 'active' : ''}`}
                onClick={() => setActiveLeaderboardTab('organisation')}
              >
                <Building size={13} />
                <span>Organisation Teams</span>
              </button>
            </div>

            {/* Simulated Leaderboard Rows */}
            <div className="simulated-leaderboard-box">
              {activeRows.map((row) => (
                <div key={row.rank} className={`sim-row ${row.highlight ? 'top-row' : ''}`}>
                  <div className="sim-rank">
                    {row.medal ? (
                      <img 
                        src={row.medal} 
                        alt={`Rank ${row.rank} Medal`} 
                        className="sim-medal rank-medal-icon-img" 
                      />
                    ) : (
                      <span className="sim-rank-num">#{row.rank}</span>
                    )}
                  </div>
                  <div className="sim-user">
                    <strong>{row.name}</strong>
                    <small>{row.activities}</small>
                  </div>
                  <div className="sim-emissions">
                    <strong>{row.emissions}</strong>
                    <small>CO₂e</small>
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy Promise */}
            <div className="community-privacy-box">
              <Shield size={16} className="privacy-icon" />
              <div>
                <strong>Strict Privacy Protection</strong>
                <p>
                  No member profile avatars, email addresses, or physical travel logs are ever shown publicly on leaderboards. Only usernames and verified net emissions are displayed.
                </p>
              </div>
            </div>

            <div className="community-cta-row">
              <StarBorder
                as={Link}
                to="/register"
                className="btn btn-primary btn-block"
                duration={4}
                stars={1}
                trailLength={0.3}
                thickness={1}
                radius={12}
                glow={0.5}
                hover="lap"
              >
                <span>Join The Community Leaderboard</span>
                <ArrowRight size={16} />
              </StarBorder>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
