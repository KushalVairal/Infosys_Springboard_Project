import React, { useCallback, useEffect, useState } from 'react';
import {
  Award, RefreshCw, Trophy, Medal, Leaf, Zap, Car, Utensils,
  ShoppingBag, Lightbulb, Users, CalendarDays, TrendingDown, AlertCircle
} from 'lucide-react';
import api, { getBadgeIconUrl } from '../api/client';
import '../styles/leaderboard.css';
import goldLeafMedal from '../assets/leaderboard-gold-leaf.png';
import silverLeafMedal from '../assets/leaderboard-silver-leaf.png';
import bronzeLeafMedal from '../assets/leaderboard-bronze-leaf.png';

const CATEGORY_META = {
  TRANSPORT: { label: 'Transport', icon: Car },
  ELECTRICITY: { label: 'Electricity', icon: Zap },
  FOOD: { label: 'Food', icon: Utensils },
  SHOPPING: { label: 'Shopping', icon: ShoppingBag }
};

const PODIUM_MEDALS = {
  1: goldLeafMedal,
  2: silverLeafMedal,
  3: bronzeLeafMedal
};

const BADGE_FALLBACKS = {
  REDUCTION_10_KG: Leaf,
  REDUCTION_25_KG: Medal,
  REDUCTION_50_KG: Trophy
};

function formatKg(value) {
  return `${Number(value ?? 0).toLocaleString(undefined, {
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

function BadgeItem({ badge }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = BADGE_FALLBACKS[badge.name] || Award;
  const iconUrl = getBadgeIconUrl(badge.iconUrl);

  return (
    <span className="lb-badge" title={badge.description || badge.name}>
      {iconUrl && !imageFailed
        ? <img src={iconUrl} alt="" onError={() => setImageFailed(true)} />
        : <Icon size={14} />}
      <span>{badge.name.replaceAll('_', ' ')}</span>
    </span>
  );
}

function CategoryStrength({ item }) {
  const meta = CATEGORY_META[item.category] || { label: item.category, icon: Leaf };
  const Icon = meta.icon;
  const amount = Number(item.totalCo2eKg ?? 0);
  const status = amount === 0
    ? 'No recorded emissions'
    : item.belowCommunityAverage ? 'Below community average' : 'At/above community average';

  return (
    <div className="lb-category-row">
      <span className="lb-category-label"><Icon size={15} />{meta.label}</span>
      <strong>{formatKg(amount)}</strong>
      <span className={`lb-status ${amount === 0 ? 'neutral' : item.belowCommunityAverage ? 'good' : 'higher'}`}>
        {status}
      </span>
    </div>
  );
}

function Podium({ entries }) {
  const first = entries.find(item => item.rank === 1);
  const second = entries.find(item => item.rank === 2);
  const third = entries.find(item => item.rank === 3);
  const slots = [
    { entry: second, place: 2, className: 'second', icon: Leaf },
    { entry: first, place: 1, className: 'first', icon: Leaf },
    { entry: third, place: 3, className: 'third', icon: Leaf }
  ];

  return (
    <section className="lb-podium-section" aria-label="Top three participants">
      <div className="lb-section-heading">
        <div>
          <span className="lb-eyebrow">TOP PERFORMERS</span>
          <h2>Leading the way</h2>
        </div>
        <Trophy size={23} />
      </div>
      <div className="lb-podium">
        {slots.map(({ entry, place, className, icon: Icon }) => (
          <div className={`lb-podium-slot ${className}`} key={place}>
            {entry ? (
              <>
                <div className="lb-avatar">
                  <img src={PODIUM_MEDALS[place]} alt={`${place === 1 ? 'Gold' : place === 2 ? 'Silver' : 'Bronze'} leaf medal`} />
                </div>
                <strong className="lb-podium-name" title={entry.username}>{entry.username}</strong>
                <span className="lb-podium-emissions">{formatKg(entry.totalCo2eKg)}</span>
                <div className="lb-podium-block">
                  <span className="lb-podium-number">{place}</span>
                  <span className="lb-podium-caption">{place === 1 ? 'WINNER' : place === 2 ? '2ND' : '3RD'}</span>
                </div>
              </>
            ) : (
              <div className="lb-podium-empty">
                <span>{place}</span>
                <small>Awaiting participant</small>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="lb-podium-note"><Leaf size={14} /> Lower recorded emissions earn a higher position.</p>
    </section>
  );
}

function ParticipantRow({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const rankClass = entry.rank <= 3 ? `top-${entry.rank}` : '';

  return (
    <article className={`lb-participant ${rankClass}`}>
      <button
        type="button"
        className="lb-participant-main"
        onClick={() => setExpanded(value => !value)}
        aria-expanded={expanded}
      >
        <span className={`lb-rank ${rankClass}`}>
          {entry.rank <= 3
            ? <img className="lb-rank-medal" src={PODIUM_MEDALS[entry.rank]} alt="" />
            : `#${entry.rank}`}
        </span>
        <span className="lb-user">
          <strong>{entry.username}</strong>
          <small>{entry.totalActivities} {Number(entry.totalActivities) === 1 ? 'activity' : 'activities'}</small>
        </span>
        <span className="lb-user-total">
          <strong>{formatKg(entry.totalCo2eKg)}</strong>
          <small>CO₂e</small>
        </span>
        <span className={`lb-chevron ${expanded ? 'open' : ''}`}>⌄</span>
      </button>

      {expanded && (
        <div className="lb-expanded">
          <section>
            <h3><Award size={16} /> Badges earned</h3>
            {entry.badges?.length
              ? <div className="lb-badges">{entry.badges.map(badge =>
                  <BadgeItem key={`${badge.badgeId}-${badge.awardedAt}`} badge={badge} />
                )}</div>
              : <p className="lb-muted">No badges earned yet.</p>}
          </section>
          <section>
            <h3><Leaf size={16} /> Category breakdown</h3>
            <div className="lb-category-list">
              {(entry.categoryStrengths || []).map(item =>
                <CategoryStrength key={item.category} item={item} />
              )}
            </div>
          </section>
          {entry.habitTips?.length > 0 && (
            <section className="lb-insights">
              <h3><Lightbulb size={16} /> Habit insights</h3>
              <ul>{entry.habitTips.map((tip, index) => <li key={`${index}-${tip}`}>{tip}</li>)}</ul>
            </section>
          )}
        </div>
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

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const entries = data?.leaderboard || [];

  return (
    <main className="leaderboard-page">
      <header className="lb-header">
        <div>
          <span className="lb-eyebrow"><Users size={15} /> CARBONTRACK COMMUNITY</span>
          <h1>Leaderboard</h1>
          <p>Small everyday choices add up. See how the community is reducing its footprint.</p>
        </div>
        <button type="button" className="lb-refresh" onClick={loadLeaderboard} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'lb-spin' : ''} />
          Refresh
        </button>
      </header>

      {loading && !data ? (
        <div className="lb-state" role="status">
          <span className="lb-loader" />
          <strong>Loading leaderboard...</strong>
          <p>Fetching the latest community results.</p>
        </div>
      ) : error && !data ? (
        <div className="lb-state lb-error" role="alert">
          <AlertCircle size={30} />
          <strong>Could not load leaderboard</strong>
          <p>{error}</p>
          <button type="button" onClick={loadLeaderboard}>Try again</button>
        </div>
      ) : (
        <>
          {error && <div className="lb-inline-error" role="alert">{error}</div>}

          <section className="lb-stats">
            <div className="lb-stat-card">
              <span className="lb-stat-icon"><Users size={19} /></span>
              <div><strong>{data?.totalParticipants ?? 0}</strong><small>Active participants</small></div>
            </div>
            <div className="lb-stat-card">
              <span className="lb-stat-icon"><CalendarDays size={19} /></span>
              <div><strong>{data?.periodDays ?? 30} days</strong><small>Reporting period</small></div>
            </div>
            <div className="lb-stat-card">
              <span className="lb-stat-icon"><TrendingDown size={19} /></span>
              <div><strong>{entries.length}</strong><small>Ranked participants</small></div>
            </div>
          </section>

          <div className="lb-period">
            <CalendarDays size={15} />
            <span>Reporting period:</span>
            <strong>{formatDate(data?.startDate)}</strong>
            <span>to</span>
            <strong>{formatDate(data?.endDate)}</strong>
          </div>

          {entries.length === 0 ? (
            <div className="lb-state">
              <Leaf size={30} />
              <strong>No leaderboard entries yet</strong>
              <p>Users with activity during this reporting period will appear here.</p>
            </div>
          ) : (
            <>
              <Podium entries={entries.slice(0, 3)} />
              <section className="lb-list-section">
                <div className="lb-section-heading">
                  <div><span className="lb-eyebrow">COMMUNITY RANKINGS</span><h2>All participants</h2></div>
                  <span className="lb-count">TOP {entries.length}</span>
                </div>
                <div className="lb-list">
                  {entries.map(entry => (
                    <ParticipantRow key={`${entry.rank}-${entry.username}`} entry={entry} />
                  ))}
                </div>
              </section>
            </>
          )}
          <p className="lb-privacy"><Leaf size={14} /> Only usernames and sustainability statistics are displayed. Personal contact details are private.</p>
        </>
      )}
    </main>
  );
}
