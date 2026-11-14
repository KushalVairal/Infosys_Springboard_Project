import React, { useState } from 'react';
import { Blobatar } from '@blobatar/react';
import { getProfileImageUrl } from '../api/client';
import { Leaf } from 'lucide-react';

/**
 * Derives a deterministic, privacy-safe seed string.
 * Strictly ensures email addresses are never used as public avatar seeds.
 */
function getSafeSeed(rawSeed, rawName) {
  let candidate = (rawSeed && typeof rawSeed === 'string') ? rawSeed.trim() : '';

  if (!candidate && rawName && typeof rawName === 'string') {
    candidate = rawName.trim();
  }

  if (!candidate) {
    return 'carbon-member';
  }

  // Privacy protection: If candidate is an email, strip domain or sanitize
  if (candidate.includes('@')) {
    const localPart = candidate.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
    return localPart || 'carbon-member';
  }

  // Strip spaces and special chars that might distort SVG generation
  return candidate.replace(/\s+/g, '-');
}

/**
 * Reusable Avatar Component using Blobatar (https://blobatar.dev).
 * Strictly implements the 4-tier avatar priority:
 *   Priority 1: User-selected Blobatar avatar (avatarSeed), if explicitly saved.
 *   Priority 2: Google profile picture / uploaded photo (profileImageUrl), if available and no custom avatar selected.
 *   Priority 3: Default generated Blobatar avatar (using username / name fallback).
 *   Priority 4: First-letter / leaf icon fallback only if avatar rendering fails.
 */
export default function Avatar({
  avatarSeed,
  seed,
  username,
  name,
  profileImageUrl,
  size = 36,
  className = '',
  style = {},
  alt = 'Member avatar',
  shape = 'circle' // 'circle' | 'squircle' | 'rounded'
}) {
  const [imgError, setImgError] = useState(false);
  const [blobatarError, setBlobatarError] = useState(false);

  const borderRadius = shape === 'squircle' ? '22%' : shape === 'rounded' ? '8px' : '50%';

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius,
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
    backgroundColor: 'var(--bg-card, #f1f5f9)',
    border: '1px solid var(--border-soft, #e2e8f0)',
    ...style
  };

  const displayName = name || username || alt || 'Member';
  const hasCustomAvatar = Boolean(avatarSeed && typeof avatarSeed === 'string' && avatarSeed.trim().length > 0);
  const photoUrl = profileImageUrl && !imgError ? getProfileImageUrl(profileImageUrl) : '';

  // Priority 1: User-selected Blobatar avatar, if explicitly saved
  if (hasCustomAvatar && !blobatarError) {
    return (
      <div
        className={`avatar-container avatar-blobatar ${className}`}
        style={containerStyle}
        title={displayName}
      >
        <Blobatar
          name={getSafeSeed(avatarSeed, displayName)}
          size={size}
          alt={displayName}
          style={{ width: '100%', height: '100%', display: 'block' }}
          onError={() => setBlobatarError(true)}
        />
      </div>
    );
  }

  // Priority 2: Google profile picture / uploaded photo, if available and no custom avatar selected
  if (photoUrl) {
    return (
      <div
        className={`avatar-container avatar-photo ${className}`}
        style={containerStyle}
        title={displayName}
      >
        <img
          src={photoUrl}
          alt={displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Priority 3: Default generated Blobatar avatar (using seed / username / name)
  if (!blobatarError) {
    const defaultSeed = getSafeSeed(seed || username || name || 'carbon-member', displayName);
    return (
      <div
        className={`avatar-container avatar-blobatar ${className}`}
        style={containerStyle}
        title={displayName}
      >
        <Blobatar
          name={defaultSeed}
          size={size}
          alt={displayName}
          style={{ width: '100%', height: '100%', display: 'block' }}
          onError={() => setBlobatarError(true)}
        />
      </div>
    );
  }

  // Priority 4: First-letter / leaf icon fallback only if avatar rendering fails
  const initial = (name || username || 'U').trim().charAt(0).toUpperCase();

  return (
    <div
      className={`avatar-container avatar-fallback ${className}`}
      style={containerStyle}
      title={displayName}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--forest-tint, #e8f5e9)',
          color: 'var(--forest-primary, #2e7d32)',
          fontWeight: 700,
          fontSize: `${Math.max(12, Math.floor(size * 0.42))}px`,
          textTransform: 'uppercase'
        }}
      >
        {initial || <Leaf size={Math.max(14, Math.floor(size * 0.5))} />}
      </span>
    </div>
  );
}
