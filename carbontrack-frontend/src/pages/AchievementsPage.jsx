import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api, { getBadgeIconUrl } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import '../styles/achievements.css';
import {
  Award,
  Trophy,
  Flame,
  Target,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Leaf
} from 'lucide-react';

// All 5 known badge milestones in CarbonTrack
const BADGE_DEFINITIONS = {
  STREAK_7_DAYS: {
    key: 'STREAK_7_DAYS',
    title: '7-Day Streak Master',
    fallbackDescription: 'Log daily activities for 7 consecutive calendar days.',
    icon: Flame,
    colorScheme: 'badge-amber',
    badgeGradient: 'linear-gradient(135deg, #FF9900 0%, #E06D53 100%)',
    category: 'Consistency'
  },
  FIRST_GOAL_COMPLETED: {
    key: 'FIRST_GOAL_COMPLETED',
    title: 'Goal Crusher',
    fallbackDescription: 'Successfully complete your first sustainability reduction goal.',
    icon: Target,
    colorScheme: 'badge-emerald',
    badgeGradient: 'linear-gradient(135deg, #244B35 0%, #668F63 100%)',
    category: 'Milestones'
  },
  REDUCTION_10_KG: {
    key: 'REDUCTION_10_KG',
    title: '10 kg Carbon Reducer',
    fallbackDescription: 'Achieve at least 10 kg CO₂e verified emissions reduction.',
    icon: Leaf,
    colorScheme: 'badge-mint',
    badgeGradient: 'linear-gradient(135deg, #2A9D8F 0%, #B8D8B0 100%)',
    category: 'Emissions'
  },
  REDUCTION_25_KG: {
    key: 'REDUCTION_25_KG',
    title: '25 kg Carbon Reducer',
    fallbackDescription: 'Achieve at least 25 kg CO₂e verified emissions reduction.',
    icon: ShieldCheck,
    colorScheme: 'badge-cyan',
    badgeGradient: 'linear-gradient(135deg, #1A7A82 0%, #38BDF8 100%)',
    category: 'Emissions'
  },
  REDUCTION_50_KG: {
    key: 'REDUCTION_50_KG',
    title: '50 kg Climate Champion',
    fallbackDescription: 'Achieve at least 50 kg CO₂e verified emissions reduction.',
    icon: Trophy,
    colorScheme: 'badge-gold',
    badgeGradient: 'linear-gradient(135deg, #D9822B 0%, #F59E0B 100%)',
    category: 'Emissions'
  }
};

function formatAwardedDate(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Resilient Badge Icon component with automatic graceful fallback
function BadgeIconDisplay({ iconUrl, badgeKey, title }) {
  const [imgError, setImgError] = useState(false);
  const def = BADGE_DEFINITIONS[badgeKey] || {
    icon: Award,
    badgeGradient: 'linear-gradient(135deg, #668F63 0%, #244B35 100%)'
  };
  const IconComponent = def.icon;
  const resolvedUrl = getBadgeIconUrl(iconUrl);

  if (resolvedUrl && !imgError) {
    return (
      <div className="badge-icon-frame" style={{ background: def.badgeGradient }}>
        <img
          src={resolvedUrl}
          alt={title || 'Badge Icon'}
          className="badge-image"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="badge-icon-frame" style={{ background: def.badgeGradient }}>
      <IconComponent size={32} color="#FFFFFF" className="badge-fallback-icon" />
    </div>
  );
}

export default function AchievementsPage() {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'EARNED' | 'CATALOG'
  const [rewardPeriod, setRewardPeriod] = useState('MONTHLY');
  const [leaderboard, setLeaderboard] = useState(null);
  const [myRewards, setMyRewards] = useState([]);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [rewardError, setRewardError] = useState('');
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  const loadBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.badges.getMyBadges();
      setEarnedBadges(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load your achievements from the server.');
    } finally {
      setLoading(false);
    }
  }, []);

    const loadRewards = useCallback(async () => {
    try {
      setRewardLoading(true);
      setRewardError('');

      const [leaderboardData, rewardData] = await Promise.all([
        api.leaderboard.getLeaderboard(rewardPeriod),
        api.achievements.getMyAchievements()
      ]);

      setLeaderboard(leaderboardData);
      setMyRewards(Array.isArray(rewardData) ? rewardData : []);
    } catch (err) {
      setRewardError(
        err.message || 'Unable to load leaderboard rewards.'
      );
    } finally {
      setRewardLoading(false);
    }
  }, [rewardPeriod]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const myRank = leaderboard?.myRank;
  const isEligible = myRank >= 1 && myRank <= 3;

  const claimedForPeriod = myRewards.some(
    (reward) =>
      reward.leaderboardPeriod === rewardPeriod &&
      reward.periodStartDate === leaderboard?.startDate
  );

  const claimReward = async () => {
    if (!isEligible || claimedForPeriod || claiming) return;

    try {
      setClaiming(true);
      setRewardError('');

      await api.achievements.claim(rewardPeriod);

      // Reload database records after successful claim.
      await loadRewards();
    } catch (err) {
      setRewardError(
        err.message || 'Unable to claim your reward.'
      );
    } finally {
      setClaiming(false);
    }
  };

  const rewardDetails = {
    GOLD_LEAF: {
      title: 'Gold Leaf',
      emoji: '🥇'
    },
    SILVER_LEAF: {
      title: 'Silver Leaf',
      emoji: '🥈'
    },
    BRONZE_LEAF: {
      title: 'Bronze Leaf',
      emoji: '🥉'
    }
  };

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  // Map each standard definition to earned or unearned status
  const catalogList = useMemo(() => {
    const knownKeys = Object.keys(BADGE_DEFINITIONS);
    return knownKeys.map((key) => {
      const def = BADGE_DEFINITIONS[key];
      const earned = earnedBadges.find((b) => b.name === key);
      return {
        ...def,
        isEarned: !!earned,
        earnedData: earned || null
      };
    });
  }, [earnedBadges]);

  if (loading) {
    return (
      <div className="page-loading-wrapper">
        <LoadingSpinner message="Loading your badges and climate achievements..." size="lg" />
      </div>
    );
  }

  const earnedCount = earnedBadges.length;
  const totalCount = Object.keys(BADGE_DEFINITIONS).length;

  return (
    <div className="achievements-page">
      {/* Page Header */}
      <div className="dashboard-header-row">
        <div>
          <div className="benchmark-badge-pill">
            <Trophy size={16} />
            <span>Badges & Achievements</span>
          </div>
          <h1 className="dashboard-title">My Achievements</h1>
          <p className="dashboard-subtitle">
            Earn verified recognition badges by logging daily activities, meeting sustainability goals, and cutting emissions.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadBadges}
            title="Refresh achievements"
          >
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
          <Link to="/activities" className="btn btn-primary">
            <Zap size={16} />
            <span>Log Activity</span>
          </Link>
        </div>
      </div>

            {/* Leaderboard Rewards */}
      <section className="leaderboard-rewards-section">
        <div className="leaderboard-rewards-header">
          <div>
            <h2>Leaderboard Rewards</h2>
            <p>
              Earn Gold, Silver and Bronze Leaf rewards by reaching
              the top three positions.
            </p>
          </div>

          <select
            value={rewardPeriod}
            onChange={(e) => setRewardPeriod(e.target.value)}
            className="reward-period-select"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>

        {rewardError && (
          <div className="dashboard-alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{rewardError}</span>
            <button
              type="button"
              onClick={loadRewards}
              className="btn btn-sm btn-ghost"
            >
              Retry
            </button>
          </div>
        )}

        {rewardLoading ? (
          <p>Loading leaderboard rewards...</p>
        ) : (
          <>
            <div className="reward-current-status">
              <div>
                <span>Your current rank</span>
                <h3>
                  {myRank ? `#${myRank}` : 'Not ranked'}
                </h3>
              </div>

              <div>
                <span>Your emissions</span>
                <h3>
                  {Number(
                    leaderboard?.myEmissionsKg || 0
                  ).toFixed(3)} kg
                </h3>
              </div>

              <div>
                <span>Participants</span>
                <h3>
                  {leaderboard?.totalParticipants ?? 0}
                </h3>
              </div>
            </div>

            <div className="reward-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isEligible || claimedForPeriod || claiming}
                onClick={claimReward}
              >
                {claiming
                  ? 'Claiming...'
                  : claimedForPeriod
                  ? 'Reward Claimed'
                  : isEligible
                  ? 'Claim Rewards'
                  : 'Top 3 Required'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCelebrationOpen(true)}
              >
                <Sparkles size={16} />
                Celebrate Progress
              </button>
            </div>
          </>
        )}
      </section>

      {/* Personal Reward Collection */}
      <section className="personal-reward-collection">
        <h2>My Reward Collection</h2>
        <p>Your claimed leaderboard rewards, saved to your account.</p>

        {myRewards.length === 0 ? (
          <div className="empty-achievements-container">
            <EmptyState
              title="No Rewards Collected Yet"
              description="Reach the top three in a leaderboard period and claim your first Leaf reward."
              icon={<Trophy size={42} color="var(--forest-primary)" />}
            />
          </div>
        ) : (
          <div className="badges-grid">
            {myRewards.map((reward) => {
              const details = rewardDetails[reward.achievementType] || {
                title: reward.achievementType,
                emoji: '🏆'
              };

              return (
                <div className="badge-card badge-card-earned" key={reward.id}>
                  <div className="badge-card-top">
                    <span style={{ fontSize: 42 }}>
                      {details.emoji}
                    </span>
                    <span className="badge-status-pill earned">
                      <CheckCircle2 size={13} />
                      Claimed
                    </span>
                  </div>

                  <div className="badge-card-body">
                    <h3 className="badge-card-title">
                      {details.title}
                    </h3>
                    <p className="badge-card-desc">
                      {reward.leaderboardPeriod} leaderboard · Rank #{reward.rankAtClaim}
                    </p>
                    <p>
                      {Number(reward.emissionsKgAtClaim).toFixed(3)} kg CO₂e
                    </p>
                  </div>

                  <div className="badge-card-footer">
                    <span>
                      {reward.periodStartDate} – {reward.periodEndDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Celebration Popup - Does not call the claim API */}
      {celebrationOpen && (
        <div
          className="reward-celebration-overlay"
          onClick={() => setCelebrationOpen(false)}
        >
          <div
            className="reward-celebration-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="reward-celebration-close"
              onClick={() => setCelebrationOpen(false)}
              aria-label="Close celebration"
            >
              ×
            </button>

            <div className="celebration-medal">🏆</div>

            <h2>LEADING THE WAY!</h2>
            <p>
              Every sustainable action moves you forward.
              Keep reducing your carbon footprint!
            </p>

            <div className="celebration-stats">
              <span>Your Rank</span>
              <strong>
                {myRank ? `#${myRank}` : 'Keep progressing'}
              </strong>

              <span>Emissions</span>
              <strong>
                {Number(leaderboard?.myEmissionsKg || 0).toFixed(3)} kg CO₂e
              </strong>

              <span>Period</span>
              <strong>{rewardPeriod}</strong>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCelebrationOpen(false)}
            >
              Keep It Up!
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="dashboard-alert alert-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={loadBadges}>
            Retry
          </button>
        </div>
      )}

      {/* Progress & Showcase Banner */}
      <div className="achievement-hero-card">
        <div className="hero-content">
          <div className="hero-text-cluster">
            <span className="hero-tag">Achievement Status</span>
            <h2 className="hero-title">
              {earnedCount === 0
                ? 'Begin Your Climate Journey'
                : earnedCount === totalCount
                ? 'Grand Master: All Badges Unlocked!'
                : `${earnedCount} of ${totalCount} Milestones Achieved`}
            </h2>
            <p className="hero-desc">
              Every action counts. As you consistently log footprint data and crush emissions reduction targets,
              your verified badges are unlocked and stored securely on your profile.
            </p>
          </div>
          <div className="hero-stat-bubble">
            <span className="stat-big-num">{earnedCount}</span>
            <span className="stat-sub-label">Unlocked</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="achievement-progress-wrapper">
          <div className="achievement-progress-track">
            <div
              className="achievement-progress-bar"
              style={{ width: `${Math.round((earnedCount / totalCount) * 100)}%` }}
            />
          </div>
          <div className="progress-labels">
            <span>{earnedCount} Badges Earned</span>
            <span>{Math.round((earnedCount / totalCount) * 100)}% Milestone Completion</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="achievement-filter-row">
        <button
          type="button"
          className={`filter-tab-btn ${filterTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterTab('ALL')}
        >
          All Badges ({totalCount})
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${filterTab === 'EARNED' ? 'active' : ''}`}
          onClick={() => setFilterTab('EARNED')}
        >
          Earned ({earnedCount})
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${filterTab === 'CATALOG' ? 'active' : ''}`}
          onClick={() => setFilterTab('CATALOG')}
        >
          Locked Milestones ({Math.max(totalCount - earnedCount, 0)})
        </button>
      </div>

      {/* EMPTY STATE: When user has 0 earned badges and is on EARNED tab or has no badges at all */}
      {earnedCount === 0 && filterTab === 'EARNED' && (
        <div className="empty-achievements-container">
          <EmptyState
            title="No Badges Earned Yet"
            description="You haven't unlocked any badges yet. Log your daily travels, complete a goal, or cut emissions by 10 kg to earn your first recognition badge!"
            actionText="Log An Activity Now"
            onAction={() => window.location.assign('/activities')}
            icon={<Trophy size={48} color="var(--forest-primary)" />}
          />
        </div>
      )}

      {/* BADGES GRID */}
      <div className="badges-grid">
        {/* Render Earned or All Badges depending on selected tab */}
        {catalogList
          .filter((item) => {
            if (filterTab === 'EARNED') return item.isEarned;
            if (filterTab === 'CATALOG') return !item.isEarned;
            return true;
          })
          .map((item) => {
            const isEarned = item.isEarned;
            const badgeData = item.earnedData;
            const title = badgeData?.name
              ? (BADGE_DEFINITIONS[badgeData.name]?.title || badgeData.name)
              : item.title;
            const description = badgeData?.description || item.fallbackDescription;
            const iconUrl = badgeData?.iconUrl || null;
            const awardedAt = badgeData?.awardedAt;

            return (
              <div
                key={item.key}
                className={`badge-card ${isEarned ? 'badge-card-earned' : 'badge-card-locked'}`}
              >
                <div className="badge-card-top">
                  <BadgeIconDisplay
                    iconUrl={iconUrl}
                    badgeKey={item.key}
                    title={title}
                  />
                  <div className="badge-status-tag-wrapper">
                    {isEarned ? (
                      <span className="badge-status-pill earned">
                        <CheckCircle2 size={13} />
                        <span>Earned</span>
                      </span>
                    ) : (
                      <span className="badge-status-pill locked">
                        <Lock size={13} />
                        <span>Milestone</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="badge-card-body">
                  <h3 className="badge-card-title">{title}</h3>
                  <p className="badge-card-desc">{description}</p>
                </div>

                <div className="badge-card-footer">
                  {isEarned && awardedAt ? (
                    <div className="awarded-date-row">
                      <Calendar size={14} />
                      <span>Unlocked {formatAwardedDate(awardedAt)}</span>
                    </div>
                  ) : (
                    <div className="locked-requirement-row">
                      <Lock size={14} />
                      <span>Complete milestone to unlock</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Community Recognition Notice */}
      <div className="achievements-info-notice">
        <Sparkles size={20} color="var(--forest-primary)" />
        <div className="notice-text">
          <strong>Verified Environmental Milestones</strong>
          <p>
            Badges are automatically awarded by the CarbonTrack Achievement Engine upon activity logging and goal completion.
            Awarded badges are permanently preserved in your personal achievement ledger.
          </p>
        </div>
      </div>
    </div>
  );
}
