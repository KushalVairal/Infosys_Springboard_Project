import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award, RefreshCw, Trophy, Medal, Leaf, Zap, Car, Utensils,
  ShoppingBag, Lightbulb, Users, CalendarDays, TrendingDown,
  AlertCircle, X, Download, Share2, Crown, Sparkles, LockKeyhole
} from 'lucide-react';
import api, { getBadgeIconUrl } from '../api/client';
import '../styles/leaderboard.css';
import goldLeafMedal from '../assets/leaderboard-gold-leaf.png';
import silverLeafMedal from '../assets/leaderboard-silver-leaf.png';
import bronzeLeafMedal from '../assets/leaderboard-bronze-leaf.png';

const PERIODS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' }
];

const CATEGORY_META = {
  TRANSPORT: { label: 'Transport', icon: Car },
  ELECTRICITY: { label: 'Electricity', icon: Zap },
  FOOD: { label: 'Food', icon: Utensils },
  SHOPPING: { label: 'Shopping', icon: ShoppingBag }
};

const PODIUM_MEDALS = { 1: goldLeafMedal, 2: silverLeafMedal, 3: bronzeLeafMedal };
const MEDAL_NAMES = { 1: 'Gold', 2: 'Silver', 3: 'Bronze' };
const BADGE_FALLBACKS = {
  REDUCTION_10_KG: Leaf,
  REDUCTION_25_KG: Medal,
  REDUCTION_50_KG: Trophy
};

function formatKg(value) {
  return `${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  })} kg`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function periodDescription(data, period) {
  if (data?.startDate && data?.endDate) {
    return data.startDate === data.endDate
      ? formatDate(data.startDate)
      : `${formatDate(data.startDate)} – ${formatDate(data.endDate)}`;
  }
  return period === 'DAILY' ? 'Today' : 'This month';
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
  const status = amount === 0 ? 'No recorded emissions'
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
  const first = entries.find(item => Number(item.rank) === 1);
  const second = entries.find(item => Number(item.rank) === 2);
  const third = entries.find(item => Number(item.rank) === 3);
  const slots = [
    { entry: second, place: 2, className: 'second' },
    { entry: first, place: 1, className: 'first' },
    { entry: third, place: 3, className: 'third' }
  ];
  return (
    <section className="lb-podium-section" aria-label="Top three participants">
      <div className="lb-section-heading">
        <div><span className="lb-eyebrow">TOP PERFORMERS</span><h2>Leading the way</h2></div>
        <Trophy size={23} />
      </div>
      <div className="lb-podium">
        {slots.map(({ entry, place, className }) => (
          <div className={`lb-podium-slot ${className}`} key={place}>
            {entry ? <>
              <div className="lb-avatar">
                <img src={PODIUM_MEDALS[place]} alt={`${MEDAL_NAMES[place]} leaf medal`} />
              </div>
              <strong className="lb-podium-name" title={entry.username}>{entry.username}</strong>
              <span className="lb-podium-emissions">{formatKg(entry.totalCo2eKg)}</span>
              <div className="lb-podium-block">
                <span className="lb-podium-number">{place}</span>
                <span className="lb-podium-caption">{place === 1 ? 'WINNER' : place === 2 ? '2ND' : '3RD'}</span>
              </div>
            </> : <div className="lb-podium-empty"><span>{place}</span><small>Awaiting participant</small></div>}
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
      <button type="button" className="lb-participant-main"
        onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
        <span className={`lb-rank ${rankClass}`}>
          {entry.rank <= 3
            ? <img className="lb-rank-medal" src={PODIUM_MEDALS[entry.rank]} alt="" />
            : `#${entry.rank}`}
        </span>
        <span className="lb-user">
          <strong>{entry.username}</strong>
          <small>{entry.totalActivities} {Number(entry.totalActivities) === 1 ? 'activity' : 'activities'}</small>
        </span>
        <span className="lb-user-total"><strong>{formatKg(entry.totalCo2eKg)}</strong><small>CO₂e</small></span>
        <span className={`lb-chevron ${expanded ? 'open' : ''}`}>⌄</span>
      </button>
      {expanded && <div className="lb-expanded">
        <section>
          <h3><Award size={16} /> Badges earned</h3>
          {entry.badges?.length
            ? <div className="lb-badges">{entry.badges.map(badge =>
                <BadgeItem key={`${badge.badgeId}-${badge.awardedAt}`} badge={badge} />)}</div>
            : <p className="lb-muted">No badges earned yet.</p>}
        </section>
        <section>
          <h3><Leaf size={16} /> Category breakdown</h3>
          <div className="lb-category-list">
            {(entry.categoryStrengths || []).map(item =>
              <CategoryStrength key={item.category} item={item} />)}
          </div>
        </section>
        {entry.habitTips?.length > 0 && <section className="lb-insights">
          <h3><Lightbulb size={16} /> Habit insights</h3>
          <ul>{entry.habitTips.map((tip, index) => <li key={`${index}-${tip}`}>{tip}</li>)}</ul>
        </section>}
      </div>}
    </article>
  );
}

function AchievementModal({ achievement, onClose }) {
  const [shareMessage, setShareMessage] = useState('');
  const medalImage = PODIUM_MEDALS[achievement.rank];
  const title = `${MEDAL_NAMES[achievement.rank]} Leaf Achievement`;
  const shareText = `I earned the ${title} in CarbonTrack ${achievement.periodLabel}! My rank: #${achievement.rank}. My recorded emissions: ${formatKg(achievement.emissionsKg)}.`;

  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
const downloadAchievement = async () => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1080;
    canvas.height = 1080;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, '#f7e8b5');
    gradient.addColorStop(1, '#f7fbf6');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Load the EXACT medal image used in the popup
    const medal = new Image();
    medal.src = medalImage;

    await new Promise((resolve, reject) => {
      medal.onload = resolve;
      medal.onerror = reject;
    });

    // Draw original medal
    ctx.drawImage(medal, 390, 90, 300, 300);

    // Text settings
    ctx.textAlign = 'center';
    ctx.fillStyle = '#174d35';

    ctx.font = 'bold 38px Arial';
    ctx.fillText('CARBONTRACK ACHIEVEMENT', 540, 470);

    ctx.fillStyle = '#20352a';
    ctx.font = 'bold 65px Arial';
    ctx.fillText(
      `${MEDAL_NAMES[achievement.rank]} Leaf Achievement`,
      540,
      565
    );

    ctx.fillStyle = '#315b40';
    ctx.font = '42px Arial';
    ctx.fillText(
      `${achievement.username} - Rank #${achievement.rank}`,
      540,
      650
    );

    ctx.fillStyle = '#52685a';
    ctx.font = '34px Arial';
    ctx.fillText(
      `${achievement.periodLabel} - ${formatKg(achievement.emissionsKg)} CO2e`,
      540,
      725
    );

    ctx.font = '28px Arial';
    ctx.fillText('Every lower footprint counts.', 540, 840);

    // Download as PNG
    canvas.toBlob((blob) => {
      if (!blob) {
        setShareMessage('Could not generate achievement image.');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download =
        `CarbonTrack-${MEDAL_NAMES[achievement.rank]}-Achievement.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
      setShareMessage('Original medal achievement downloaded!');
    }, 'image/png');

  } catch (error) {
    console.error('Achievement download error:', error);
    setShareMessage('Unable to download achievement. Please try again.');
  }
};


  const shareAchievement = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText });
        setShareMessage('Share sheet opened.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareMessage('Achievement text copied. Paste it into your social post.');
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
        setShareMessage('WhatsApp share opened.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setShareMessage('Sharing was not available. Download the artwork instead.');
    }
  };

  return (
    <div className="lb-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="lb-achievement-modal" role="dialog" aria-modal="true" aria-labelledby="lb-achievement-title">
        <button className="lb-modal-close" type="button" onClick={onClose} aria-label="Close achievement"><X size={20} /></button>
        <div className="lb-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) =>
          <span key={i} style={{ '--i': i }} />)}</div>
        <span className="lb-modal-kicker"><Sparkles size={15} /> ACHIEVEMENT UNLOCKED</span>
        <img className="lb-modal-medal" src={medalImage} alt={`${MEDAL_NAMES[achievement.rank]} leaf medal`} />
        <h2 id="lb-achievement-title">{title}</h2>
        <p className="lb-modal-name">{achievement.username}</p>
        <p className="lb-modal-rank">You are ranked <strong>#{achievement.rank}</strong> for {achievement.periodLabel}.</p>
        <div className="lb-modal-emissions"><span>Your recorded emissions</span><strong>{formatKg(achievement.emissionsKg)} CO₂e</strong></div>
        <div className="lb-modal-actions">
          <button type="button" className="lb-download-btn" onClick={downloadAchievement}><Download size={17} /> Download achievement</button>
          <button type="button" className="lb-share-btn" onClick={shareAchievement}><Share2 size={17} /> Share</button>
        </div>
        {shareMessage && <p className="lb-share-message" role="status">{shareMessage}</p>}
      </section>
    </div>
  );
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('MONTHLY');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAchievement, setModalAchievement] = useState(null);
  const [collection, setCollection] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [collectionError, setCollectionError] = useState('');
  const [claiming, setClaiming] = useState(false);

  const loadLeaderboard = useCallback(async (selectedPeriod = period) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.leaderboard.getLeaderboard(selectedPeriod);
      setData(response);
    } catch (err) {
      setError(err?.message || 'Unable to load the community leaderboard.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadLeaderboard(period); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMyRewards = useCallback(async () => {
    setCollectionLoading(true);
    setCollectionError('');
    try {
      const rewards = await api.achievements.getMyAchievements();
      setCollection(Array.isArray(rewards) ? rewards : []);
    } catch (err) {
      setCollectionError(err?.message || 'Unable to load your personal rewards.');
    } finally {
      setCollectionLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyRewards();
  }, [loadMyRewards]);

  const entries = data?.leaderboard || [];
  const myRank = data?.myRank == null ? null : Number(data.myRank);
  const isTopThree = myRank !== null && myRank >= 1 && myRank <= 3;
  const currentUserEntry = entries.find(entry => Number(entry.rank) === myRank);

  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('carbontrack_user') || localStorage.getItem('ct_user');
      if (!raw) return 'CarbonTrack member';
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
      return parsed?.username || parsed?.email || 'CarbonTrack member';
    } catch {
      return localStorage.getItem('carbontrack_user') || 'CarbonTrack member';
    }
  })();

  const username = currentUserEntry?.username || storedUser;
  const periodLabel = PERIODS.find(item => item.value === period)?.label || period;
  const achievement = isTopThree ? {
    rank: myRank,
    username,
    period,
    periodLabel,
    emissionsKg: Number(data?.myEmissionsKg ?? 0)
  } : null;

  const claimedForPeriod = collection.some(item =>
    item.leaderboardPeriod === period &&
    item.periodStartDate === data?.startDate
  );

  const handleClaimAchievement = async () => {
    if (!achievement || claimedForPeriod || claiming) return;

    try {
      setClaiming(true);
      setError('');
      const saved = await api.achievements.claim(period);
      await loadMyRewards();

      setModalAchievement({
        rank: Number(saved.rankAtClaim),
        username,
        period: saved.leaderboardPeriod,
        periodLabel: PERIODS.find(item => item.value === saved.leaderboardPeriod)?.label || saved.leaderboardPeriod,
        emissionsKg: Number(saved.emissionsKgAtClaim)
      });
    } catch (err) {
      setError(err?.message || 'Unable to claim your reward.');
      // Refresh in case another request already claimed this period.
      await loadMyRewards();
    } finally {
      setClaiming(false);
    }
  };

  // Celebration is presentation only; it never calls the claim endpoint.
  const handleCelebrate = () => {
    if (achievement) setModalAchievement(achievement);
  };

  const earnedCollection = useMemo(() => collection.map(item => ({
    id: item.id,
    rank: Number(item.rankAtClaim),
    period: item.leaderboardPeriod,
    periodLabel: PERIODS.find(p => p.value === item.leaderboardPeriod)?.label || item.leaderboardPeriod,
    username,
    emissionsKg: Number(item.emissionsKgAtClaim),
    earnedAt: item.claimedAt
  })).sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()), [collection, username]);

  return (
    <main className="leaderboard-page">
      <header className="lb-header">
        <div>
          <span className="lb-eyebrow"><Users size={15} /> CARBONTRACK COMMUNITY</span>
          <h1>Leaderboard</h1>
          <p>Small everyday choices add up. See how the community is reducing its footprint.</p>
        </div>
        <button type="button" className="lb-refresh" onClick={() => loadLeaderboard(period)} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'lb-spin' : ''} /> Refresh
        </button>
      </header>

      <nav className="lb-period-tabs" aria-label="Leaderboard reporting period">
        {PERIODS.map(item => <button key={item.value} type="button"
          className={period === item.value ? 'active' : ''}
          aria-pressed={period === item.value}
          onClick={() => { setModalAchievement(null); setPeriod(item.value); }}>
          {item.label}
        </button>)}
      </nav>

      {loading && !data ? <div className="lb-state" role="status">
        <span className="lb-loader" /><strong>Loading leaderboard...</strong>
        <p>Fetching the latest community results.</p>
      </div> : error && !data ? <div className="lb-state lb-error" role="alert">
        <AlertCircle size={30} /><strong>Could not load leaderboard</strong><p>{error}</p>
        <button type="button" onClick={() => loadLeaderboard(period)}>Try again</button>
      </div> : <>
        {error && <div className="lb-inline-error" role="alert">{error}</div>}
        <section className="lb-stats">
          <div className="lb-stat-card">
            <span className="lb-stat-icon"><Crown size={19} /></span>
            <div><strong>{myRank ? `#${myRank}` : '—'}</strong><small>Your rank</small></div>
          </div>
          <div className="lb-stat-card">
            <span className="lb-stat-icon"><Leaf size={19} /></span>
            <div><strong>{formatKg(data?.myEmissionsKg)}</strong><small>Your emissions</small></div>
          </div>
          <div className="lb-stat-card">
            <span className="lb-stat-icon"><Users size={19} /></span>
            <div><strong>{data?.totalParticipants ?? 0}</strong><small>Active participants</small></div>
          </div>
        </section>
        <div className="lb-period">
          <CalendarDays size={15} /><span>Reporting period:</span>
          <strong>{periodDescription(data, period)}</strong>
          {data?.periodDays != null && <span className="lb-period-days">({data.periodDays} {Number(data.periodDays) === 1 ? 'day' : 'days'})</span>}
        </div>
<section className={`lb-my-rank-card ${isTopThree ? 'is-winner' : ''}`}>
  <div className="lb-my-rank-copy">
    <span className="lb-eyebrow">YOUR CARBONTRACK POSITION</span>

    <h2>
      {myRank ? `You're ranked #${myRank}` : 'Your rank is waiting'}
    </h2>

    <p>
      {myRank
        ? `You have recorded ${formatKg(data?.myEmissionsKg)} in ${periodLabel.toLowerCase()}. Keep making lower-carbon choices.`
        : 'Log an activity during this reporting period to appear in the leaderboard.'}
    </p>
  </div>

  {isTopThree ? (
    <div className="lb-rank-actions">
      <button
        type="button"
        className="lb-claim-btn"
        onClick={handleClaimAchievement}
        disabled={claiming || claimedForPeriod}
      >
        <Award size={19} />
        {claiming ? 'Claiming...' : claimedForPeriod ? 'Reward Claimed' : `Claim ${MEDAL_NAMES[myRank]} Leaf`}
      </button>
      <button
        type="button"
        className="lb-celebrate-btn"
        onClick={handleCelebrate}
      >
        <Sparkles size={17} />
        Celebrate
      </button>
    </div>
  ) : (
    <span className="lb-rank-lock">
      <LockKeyhole size={17} />
      {myRank ? 'Keep climbing' : 'Not ranked yet'}
    </span>
  )}

</section>


        {entries.length === 0 ? <div className="lb-state">
          <Leaf size={30} /><strong>No leaderboard entries yet</strong>
          <p>Users with activity during this reporting period will appear here.</p>
        </div> : <>
          <Podium entries={entries} />
          <section className="lb-list-section">
            <div className="lb-section-heading">
              <div><span className="lb-eyebrow">COMMUNITY RANKINGS</span><h2>All participants</h2></div>
              <span className="lb-count">{entries.length} PARTICIPANTS</span>
            </div>
            <div className="lb-list">{entries.map(entry =>
              <ParticipantRow key={`${entry.rank}-${entry.username}`} entry={entry} />)}</div>
          </section>
        </>}

        <section className="lb-collection">
          <div className="lb-section-heading">
            <div><span className="lb-eyebrow">YOUR REWARDS</span><h2>Leaf medal collection</h2></div>
            <span className="lb-count">{collectionLoading ? 'LOADING' : `${earnedCollection.length} EARNED`}</span>
          </div>
          {collectionLoading ? (
            <p className="lb-collection-empty">Loading your saved rewards...</p>
          ) : collectionError ? (
            <div className="lb-inline-error" role="alert">
              {collectionError}{' '}
              <button type="button" onClick={loadMyRewards}>Retry</button>
            </div>
          ) : earnedCollection.length ? (
            <div className="lb-collection-grid">
              {earnedCollection.map(item => (
                <button type="button" className="lb-collection-item" key={item.id}
                  onClick={() => setModalAchievement(item)}
                  aria-label={`View ${MEDAL_NAMES[item.rank]} Leaf achievement`}>
                  <img src={PODIUM_MEDALS[item.rank]} alt={`${MEDAL_NAMES[item.rank]} leaf`} />
                  <div>
                    <strong>{MEDAL_NAMES[item.rank]} Leaf</strong>
                    <small>{item.periodLabel} · Rank #{item.rank}</small>
                    <small>{formatDate(item.earnedAt?.slice(0, 10))}</small>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="lb-collection-empty"><Leaf size={17} /> You have no claimed Leaf medals yet.</p>
          )}
        </section>
        <p className="lb-privacy"><Leaf size={14} /> Only usernames and sustainability statistics are displayed. Personal contact details are private.</p>
      </>}

      {modalAchievement && <AchievementModal achievement={modalAchievement} onClose={() => setModalAchievement(null)} />}
    </main>
  );
}
