import React, { useState } from 'react';
import './StarBorder.css';

/**
 * StarBorder component based on React Bits:
 * https://reactbits.dev/animations/star-border
 *
 * Provides a sleek animated starry glowing border trail with hover acceleration,
 * click ripple pulse, and full CarbonTrack theme integration.
 */
export default function StarBorder({
  as: Component = 'button',
  className = '',
  color = 'var(--star-glow-color, #4ade80)',
  duration = 4,
  stars = 1,
  trailLength = 0.3,
  thickness = 1,
  radius = 12,
  glow = 0.6,
  hover = 'lap',
  clickPulse = true,
  children,
  onClick,
  ...rest
}) {
  const [pulsing, setPulsing] = useState(false);

  const handleClick = (e) => {
    if (clickPulse) {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 600);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const borderStyle = {
    borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
    padding: `${thickness}px`,
    '--star-color': color,
    '--star-duration': typeof duration === 'number' ? `${duration}s` : duration,
    '--star-glow': glow,
    '--star-trail': trailLength,
  };

  const innerRadius = typeof radius === 'number' ? `${Math.max(0, radius - thickness)}px` : radius;

  return (
    <Component
      className={`star-border-container ${hover ? `hover-${hover}` : ''} ${pulsing ? 'star-border-pulse' : ''} ${className}`}
      style={borderStyle}
      onClick={handleClick}
      {...rest}
    >
      {/* Rotating conical gradient star trails */}
      <div className="star-border-spinner star-1" />
      {stars > 1 && <div className="star-border-spinner star-2" />}

      {/* Button content surface */}
      <span className="star-border-inner" style={{ borderRadius: innerRadius }}>
        {children}
      </span>
    </Component>
  );
}

