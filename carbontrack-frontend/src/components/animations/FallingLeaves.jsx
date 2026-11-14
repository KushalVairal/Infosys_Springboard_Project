import React, { useMemo } from 'react';
import './FallingLeaves.css';

/**
 * FallingLeaves
 * Lightweight, GPU-accelerated falling leaves animation for CarbonTrack.
 * - Gentle falling motion with randomized sway, rotation, and size
 * - Non-intrusive (pointer-events: none, strictly behind the card)
 * - Negative animation delays so leaves are immediately visible on page load
 * - Respects prefers-reduced-motion
 */
const LEAF_PRESETS = [
  { left: 5, size: 24, duration: 16, delay: -4, swayDuration: 4.2, rotate: 35 },
  { left: 12, size: 18, duration: 20, delay: -12, swayDuration: 5.1, rotate: -25 },
  { left: 19, size: 28, duration: 14, delay: -8, swayDuration: 3.8, rotate: 45 },
  { left: 27, size: 22, duration: 18, delay: -2, swayDuration: 4.6, rotate: -30 },
  { left: 35, size: 16, duration: 22, delay: -15, swayDuration: 5.4, rotate: 60 },
  { left: 44, size: 26, duration: 15, delay: -7, swayDuration: 4.0, rotate: -40 },
  { left: 52, size: 20, duration: 19, delay: -11, swayDuration: 4.8, rotate: 20 },
  { left: 61, size: 30, duration: 13, delay: -3, swayDuration: 3.6, rotate: -50 },
  { left: 70, size: 18, duration: 21, delay: -14, swayDuration: 5.2, rotate: 30 },
  { left: 78, size: 24, duration: 17, delay: -9, swayDuration: 4.4, rotate: -15 },
  { left: 86, size: 22, duration: 19, delay: -6, swayDuration: 4.7, rotate: 40 },
  { left: 93, size: 26, duration: 15, delay: -1, swayDuration: 3.9, rotate: -35 },
  { left: 8, size: 20, duration: 23, delay: -18, swayDuration: 5.6, rotate: 15 },
  { left: 96, size: 17, duration: 18, delay: -10, swayDuration: 4.3, rotate: -20 }
];

export default function FallingLeaves() {
  const leaves = useMemo(() => LEAF_PRESETS, []);

  return (
    <div className="falling-leaves-container" aria-hidden="true">
      {leaves.map((leaf, index) => (
        <div
          key={index}
          className="falling-leaf-track"
          style={{
            left: `${leaf.left}%`,
            animationDuration: `${leaf.duration}s`,
            animationDelay: `${leaf.delay}s`
          }}
        >
          <div
            className="falling-leaf-sway"
            style={{
              animationDuration: `${leaf.swayDuration}s`,
              animationDelay: `${leaf.delay * 0.5}s`
            }}
          >
            <svg
              className="falling-leaf-svg"
              width={leaf.size}
              height={leaf.size}
              viewBox="0 0 32 32"
              fill="none"
              style={{
                transform: `rotate(${leaf.rotate}deg)`
              }}
            >
              {/* Organic leaf blade */}
              <path
                d="M28 4C18 4 6 12 4 28C14 26 26 20 28 4Z"
                fill="currentColor"
                fillOpacity="0.75"
              />
              {/* Central primary vein */}
              <path
                d="M6 26C12 20 18 14 26 6"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeOpacity="0.6"
              />
              {/* Secondary delicate lateral veins */}
              <path
                d="M13 19C16 19 18 17 21 15"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
              <path
                d="M10 22C12 23 15 22 17 20"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

