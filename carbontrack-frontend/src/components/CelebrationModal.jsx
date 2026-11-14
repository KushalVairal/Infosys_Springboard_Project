import React, { useEffect, useRef, useState } from 'react';
import {
  Trophy,
  Award,
  Download,
  Share2,
  Copy,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Calendar,
  Flame,
  Target,
  Leaf,
  ShieldCheck
} from 'lucide-react';
import { triggerCelebrationConfetti } from './CelebrationCursor';
import Avatar from './Avatar';
import goldMedal from '../assets/leaderboard-gold-leaf.png';
import silverMedal from '../assets/leaderboard-silver-leaf.png';
import bronzeMedal from '../assets/leaderboard-bronze-leaf.png';
import './CelebrationModal.css';

const BADGE_ICONS = {
  STREAK_7_DAYS: Flame,
  FIRST_GOAL_COMPLETED: Target,
  REDUCTION_10_KG: Leaf,
  REDUCTION_25_KG: ShieldCheck,
  REDUCTION_50_KG: Trophy,
};

/**
 * Generate a crisp, high-resolution CarbonTrack Badge Card as a PNG blob.
 */
async function generateBadgeCardBlob({
  title = 'Climate Champion',
  description = 'Verified Sustainability Achievement',
  username = 'CarbonTrack User',
  date = new Date().toLocaleDateString(),
  rank = null,
  isDark = false
}) {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 750;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (isDark) {
    bgGrad.addColorStop(0, '#0F1713');
    bgGrad.addColorStop(0.5, '#17241D');
    bgGrad.addColorStop(1, '#1A2E24');
  } else {
    bgGrad.addColorStop(0, '#F4F9F2');
    bgGrad.addColorStop(0.5, '#E8F3E5');
    bgGrad.addColorStop(1, '#D9EBD5');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer decorative border
  ctx.strokeStyle = isDark ? '#2E4C3B' : '#C2DEBB';
  ctx.lineWidth = 14;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Inner subtle border
  ctx.strokeStyle = isDark ? '#3D6B52' : '#88B87E';
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, width - 88, height - 88);

  // CarbonTrack Branding Header
  ctx.fillStyle = isDark ? '#4ADE80' : '#244B35';
  ctx.font = 'bold 36px Outfit, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🌿 CarbonTrack Verified Milestone', 80, 115);

  ctx.fillStyle = isDark ? '#94A3B8' : '#52795E';
  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillText('Personal Carbon Accounting & Climate Action', 80, 150);

  // Circular Badge Emblem
  const emblemX = width / 2;
  const emblemY = 320;
  const emblemR = 95;

  const circleGrad = ctx.createRadialGradient(emblemX, emblemY, 10, emblemX, emblemY, emblemR);
  circleGrad.addColorStop(0, '#34D399');
  circleGrad.addColorStop(0.7, '#10B981');
  circleGrad.addColorStop(1, '#065F46');

  ctx.beginPath();
  ctx.arc(emblemX, emblemY, emblemR, 0, Math.PI * 2);
  ctx.fillStyle = circleGrad;
  ctx.shadowColor = 'rgba(16, 185, 129, 0.45)';
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Emblem border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Emblem symbol text / emoji
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 75px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rank ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : '🏆', emblemX, emblemY);

  // Achievement Title
  ctx.fillStyle = isDark ? '#F1F5F9' : '#143422';
  ctx.font = 'bold 50px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, width / 2, 475);

  // Achievement Description
  ctx.fillStyle = isDark ? '#CBD5E1' : '#3C5E47';
  ctx.font = 'normal 24px Inter, sans-serif';
  ctx.fillText(description, width / 2, 520);

  // Divider Line
  ctx.strokeStyle = isDark ? '#334155' : '#BED8B7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, 565);
  ctx.lineTo(width - 180, 565);
  ctx.stroke();

  // Recipient Username & Awarded Date
  ctx.textAlign = 'left';
  ctx.fillStyle = isDark ? '#94A3B8' : '#577660';
  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillText(`Earned by: @${username}`, 180, 620);

  ctx.textAlign = 'right';
  ctx.fillText(`Date: ${date}`, width - 180, 620);

  // Verified cryptographic watermarking footer
  ctx.textAlign = 'center';
  ctx.fillStyle = isDark ? '#64748B' : '#6F9178';
  ctx.font = 'italic 18px Inter, sans-serif';
  ctx.fillText('Verified by CarbonTrack Calculation Engine · carbontrack.app', width / 2, 675);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export default function CelebrationModal({
  isOpen = false,
  onClose,
  type = 'BADGE', // 'BADGE' or 'LEADERBOARD'
  badge = null,
  leaderboard = null,
  user = null
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger instant confetti explosion across screen
      triggerCelebrationConfetti({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.35,
        count: 100
      });

      // Repeat second subtle celebratory wave
      const timer = setTimeout(() => {
        triggerCelebrationConfetti({
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.45,
          count: 50
        });
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const username = user?.username || user?.name || 'ClimateChampion';

  // Extract display values
  const title =
    type === 'LEADERBOARD'
      ? `Leaderboard Podium: Rank #${leaderboard?.rank || 1}`
      : badge?.name || badge?.title || 'Achievement Unlocked!';

  const description =
    type === 'LEADERBOARD'
      ? `Congratulations! You achieved a top-three ranking on the ${leaderboard?.period || 'weekly'} leaderboard with ${Number(leaderboard?.emissionsKg || 0).toFixed(2)} kg CO₂e!`
      : badge?.description || 'You reached a verified milestone in your carbon reduction journey!';

  const dateStr = badge?.awardedAt
    ? new Date(badge.awardedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  const rank = leaderboard?.rank || null;

  // 1. Download PNG Achievement Card
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateBadgeCardBlob({
        title,
        description,
        username,
        date: dateStr,
        rank,
        isDark
      });
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        a.download = `CarbonTrack-${sanitizedTitle}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download badge:', err);
    } finally {
      setDownloading(false);
    }
  };

  // 2. Share to WhatsApp
  const handleWhatsAppShare = () => {
    const text = `🎉 I just unlocked "${title}" on CarbonTrack! Tracking my carbon footprint and reducing emissions. Check it out: https://carbontrack.app`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // 3. Share to LinkedIn
  const handleLinkedInShare = () => {
    const shareUrl = 'https://carbontrack.app';
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  };

  // 4. Instagram / Native Share Flow
  const handleInstagramOrNativeShare = async () => {
    setSharing(true);
    try {
      const blob = await generateBadgeCardBlob({
        title,
        description,
        username,
        date: dateStr,
        rank,
        isDark
      });

      const file = new File([blob], `CarbonTrack-${title.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

      // Native mobile share if supported
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `CarbonTrack - ${title}`,
          text: `Proud to unlock "${title}" on CarbonTrack! 🌿 #sustainability #climateaction`
        });
      } else {
        // Fallback: auto-download and open Instagram web
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CarbonTrack-${title.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Share failed or canceled:', err);
    } finally {
      setSharing(false);
    }
  };

  // 5. Copy Link / Text
  const handleCopyLink = () => {
    const text = `🎉 I unlocked the "${title}" badge on CarbonTrack! Tracking emissions and making sustainable choices. https://carbontrack.app`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Icon / Artwork resolution
  const BadgeIcon = BADGE_ICONS[badge?.key] || Award;
  const podiumMedal = rank === 1 ? goldMedal : rank === 2 ? silverMedal : rank === 3 ? bronzeMedal : null;

  return (
    <div className="celebration-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="celebration-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button type="button" className="celebration-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Header Pill */}
        <div className="celebration-pill">
          <Sparkles size={14} className="sparkle-anim" />
          <span>{type === 'LEADERBOARD' ? 'Podium Finish!' : 'Milestone Unlocked!'}</span>
        </div>

        {/* Emblem Artwork */}
        <div className="celebration-emblem-wrap">
          {type === 'LEADERBOARD' && podiumMedal ? (
            <img src={podiumMedal} alt={`Rank ${rank} Medal`} className="celebration-medal-img" />
          ) : (
            <div className="celebration-badge-circle">
              <BadgeIcon size={46} color="#FFFFFF" />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <h2 className="celebration-title">{title}</h2>
        <p className="celebration-desc">{description}</p>

        {/* Metadata Details (Date, Rank, User) */}
        <div className="celebration-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Awarded To</span>
            <div className="meta-val-user">
              <Avatar avatar={user?.avatar || 'avatar_1'} name={username} size={20} />
              <strong>@{username}</strong>
            </div>
          </div>
          <div className="meta-item">
            <span className="meta-label">Date Earned</span>
            <span className="meta-val-date">
              <Calendar size={13} />
              {dateStr}
            </span>
          </div>
        </div>

        {/* Action Buttons: Download & Social Sharing */}
        <div className="celebration-action-row">
          <button
            type="button"
            className="btn btn-primary celebration-btn-primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={16} />
            <span>{downloading ? 'Generating...' : 'Download Badge'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary celebration-btn-secondary"
            onClick={handleInstagramOrNativeShare}
            disabled={sharing}
            title="Share to Instagram or Native Apps"
          >
            <Share2 size={16} />
            <span>Share Badge</span>
          </button>
        </div>

        {/* Direct Social Channels */}
        <div className="celebration-social-strip">
          <span className="social-label">Share to:</span>
          <button type="button" className="social-share-pill whatsapp" onClick={handleWhatsAppShare}>
            WhatsApp
          </button>
          <button type="button" className="social-share-pill linkedin" onClick={handleLinkedInShare}>
            LinkedIn
          </button>
          <button type="button" className="social-share-pill instagram" onClick={handleInstagramOrNativeShare}>
            Instagram
          </button>
          <button type="button" className="social-share-pill copy" onClick={handleCopyLink}>
            {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

