import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  RefreshCw,
  Trophy,
  Medal,
  Leaf,
  Zap,
  Car,
  Utensils,
  ShoppingBag,
  Lightbulb,
  Users,
  CalendarDays,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import api, { getBadgeIconUrl } from '../api/client';
import '../styles/leaderboard.css';

const CATEGORY_META = {
  TRANSPORT: { label: 'Transport', icon: Car },
  ELECTRICITY: { label: 'Electricity', icon: Zap },
  FOOD: { label: 'Food', icon: Utensils },
  SHOPPING: { label: 'Shopping', icon: ShoppingBag }
};

const BADGE_FALLBACKS = {
  REDUCTION_10_KG: Leaf,
  REDUCTION_25_KG: Medal,
  REDUCTION_50_KG: Trophy
};

function formatKg(value) {
  const number = Number(value ?? 0);
  return `${number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} kg`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function RankMark({ rank }) {
  if (rank === 1) return <span className="leaderboard-rank rank-gold"><Trophy size={17} /> 1</span>;
  if (rank === 2) return <span className="leaderboard-rank rank-silver"><Medal size={17} /> 2</span>;
  if (rank === 3) return <span className="leaderboard-rank rank-bronze"><Medal size={17} /> 3</span>;
  return <span className="leaderboard-rank">#{rank}</span>;
}

function BadgeItem({ badge }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = BADGE_FALLBACKS[badge.name] || Award;
  const iconUrl = getBadgeIconUrl(badge.iconUrl);

  return (
    <span className="leaderboard-badge" title={badge.description || badge.name}>
      {iconUrl && !imageFailed ? (
        <img
          src={iconUrl}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon size={15} />
      )}
      <span>{badge.name.replaceAll('_', ' ')}</span>
    </span>
  );
}

function CategoryStrength({ item }) {
  const meta = CATEGORY_META[item.category] || { label: item.category, icon: Leaf };
  const Icon = meta.icon;
  const amount = Number(item.totalCo2eKg ?? 0);
  let status = 'No recorded emissions';
  let statusClass = 'neutral';
  if (amount > 0 && item.belowCommunityAverage) {
    status = 'Below average';
    statusClass = 'good';
  } else if (amount > 0) {
    status = 'At/above average';
    statusClass = 'higher';
  }

  return (
    <div className="leaderboard-category-row">
      <span className="leaderboard-category-name"><Icon size={15} /> {meta.label}</span>
      <strong>{formatKg(amount)}</strong>
      <span className={`leaderboard-category-status ${statusClass}`}>{status}</span>
    </div>
  );
}

function ParticipantCard({ entry }) {
  return (
    <article className="leaderboard-participant-card">
      <div className="leaderboard-participant-heading">
        <RankMark rank={entry.rank} />
        <div className="leaderboard-participant-identity">
          <strong>{entry.username}</strong>
          <span>{entry.totalActivities} {Number(entry.totalActivities) === 1 ? 'activity' : 'activities'}</span>
        </div>
        <div className="leaderboard-participant-total">
          <strong>{formatKg(entry.totalCo2eKg)}</strong>
          <span>CO₂e</span>
        </div>
      </div>

      <div className="leaderboard-detail-grid">
        <section>
          <h3>Badges</h3>
          {entry.badges?.length ? (
            <div className="leaderboard-badges-list">
              {entry.badges.map((badge) => (
                <BadgeItem key={`${badge.badgeId}-${badge.awardedAt}`} badge={badge} />
              ))}
            </div>
          ) : (
            <p className="leaderboard-muted">No badges earned yet</p>
          )}
        </section>

        <section>
          <h3>Category strengths</h3>
          <div className="leaderboard-category-list">
            {(entry.categoryStrengths || []).map((item) => (
              <CategoryStrength key={item.category} item={item} />
            ))}
          </div>
        </section>
      </div>

      {entry.habitTips?.length > 0 && (
        <section className="leaderboard-tips">
          <h3><Lightbulb size={16} /> Habit insights</h3>
          <ul>
            {entry.habitTips.map((tip, index) => <li key={`${index}-${tip}`}>{tip}</li>)}
          </ul>
        </section>
      )}
    </article>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.leaderboard.getLeaderboard();
      setData(response);
    } catch (err) {
      setError(err?.message || 'Unable to load the community leaderboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const entries = data?.leaderboard || [];

  return (
    <div className="leaderboard-page">
      <header className="leaderboard-page-header">
        <div>
          <div className="leaderboard-eyebrow"><Users size={15} /> COMMUNITY</div>
          <h1>Community Leaderboard</h1>
          <p>Compare recent carbon footprints and see how the community is doing.</p>
        </div>
        <button
          type="button"
          className="leaderboard-refresh-button"
          onClick={loadLeaderboard}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'leaderboard-spinning' : ''} />
          Refresh
        </button>
      </header>

      {loading && !data ? (
        <div className="leaderboard-state-card" role="status">
          <span className="leaderboard-loader" />
          <strong>Loading leaderboard...</strong>
          <p>Fetching the latest 30-day community results.</p>
        </div>
      ) : error && !data ? (
        <div className="leaderboard-state-card leaderboard-error-state" role="alert">
          <AlertCircle size={30} />
          <strong>Could not load leaderboard</strong>
          <p>{error}</p>
          <button type="button" onClick={loadLeaderboard}>Try again</button>
        </div>
      ) : (
        <>
          {error && <div className="leaderboard-inline-error" role="alert">{error}</div>}

          <section className="leaderboard-summary-grid" aria-label="Leaderboard summary">
            <div className="leaderboard-summary-card">
              <span className="summary-icon"><Users size={19} /></span>
              <div><strong>{data?.totalParticipants ?? 0}</strong><span>Active participants</span></div>
            </div>
            <div className="leaderboard-summary-card">
              <span className="summary-icon"><CalendarDays size={19} /></span>
              <div><strong>{data?.periodDays ?? 30} days</strong><span>Reporting period</span></div>
            </div>
            <div className="leaderboard-summary-card">
              <span className="summary-icon"><TrendingDown size={19} /></span>
              <div><strong>{entries.length}</strong><span>Ranked users shown</span></div>
            </div>
          </section>

          <div className="leaderboard-period-note">
            <CalendarDays size={15} />
            Reporting period: <strong>{formatDate(data?.startDate)}</strong> to <strong>{formatDate(data?.endDate)}</strong>
          </div>

          {entries.length === 0 ? (
            <div className="leaderboard-state-card">
              <Leaf size={30} />
              <strong>No leaderboard entries yet</strong>
              <p>Users with activity in this reporting period will appear here.</p>
            </div>
          ) : (
            <>
              <div className="leaderboard-list-heading">
                <div><h2>Top participants</h2><p>Lower total emissions receive a higher rank.</p></div>
                <span>Top {entries.length}</span>
              </div>
              <div className="leaderboard-participant-list">
                {entries.map((entry) => <ParticipantCard key={`${entry.rank}-${entry.username}`} entry={entry} />)}
              </div>
            </>
          )}
          <p className="leaderboard-privacy-note">Only usernames and sustainability statistics are displayed. Personal contact details are not shown.</p>
        </>
      )}
    </div>
  );
}
