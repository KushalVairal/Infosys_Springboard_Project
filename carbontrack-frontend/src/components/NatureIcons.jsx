import React from 'react';

export function LeafIcon({ className = '', size = 20, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export function EcoSproutIcon({ className = '', size = 20, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 20h10" />
      <path d="M12 20v-8" />
      <path d="M12 12a4 4 0 0 1 4-4c2 0 3 .8 4 2-1 3-3 4-5 4Z" />
      <path d="M12 14a4 4 0 0 0-4-4c-2 0-3 .8-4 2 1 3 3 4 5 4Z" />
    </svg>
  );
}

export function FootprintIcon({ className = '', size = 20, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 16v-2.38C4 11.5 5.79 9.5 8 9.5s4 2 4 4.12V16" />
      <path d="M20 20v-2.38c0-2.12-1.79-4.12-4-4.12s-4 2-4 4.12V20" />
      <circle cx="8" cy="4" r="2" />
      <circle cx="16" cy="8" r="2" />
    </svg>
  );
}

export function EarthIcon({ className = '', size = 20, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
