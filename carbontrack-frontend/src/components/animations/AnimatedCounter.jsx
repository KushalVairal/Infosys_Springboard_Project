import React, { useEffect, useState } from 'react';

/**
 * AnimatedCounter
 * Smoothly counts from 0 to target value with easing.
 * Respects prefers-reduced-motion.
 */
export default function AnimatedCounter({
  value = 0,
  decimals = 0,
  duration = 1000,
  prefix = '',
  suffix = '',
  className = ''
}) {
  const numericTarget = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(numericTarget);
      return;
    }

    let startTimestamp = null;
    let animId;
    const startValue = 0;

    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startValue + (numericTarget - startValue) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [numericTarget, duration]);

  const formatted = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

