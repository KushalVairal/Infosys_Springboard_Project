import React from 'react';

export function CategoryBadge({ category }) {
  const cat = (category || '').toUpperCase();
  const styles = {
    TRANSPORT: { label: 'Transport', icon: '🚗', className: 'badge-transport' },
    ELECTRICITY: { label: 'Electricity', icon: '⚡', className: 'badge-electricity' },
    FOOD: { label: 'Food', icon: '🥗', className: 'badge-food' },
    SHOPPING: { label: 'Shopping & Waste', icon: '🛍️', className: 'badge-shopping' }
  };

  const current = styles[cat] || { label: category || 'Other', icon: '🌱', className: 'badge-default' };

  return (
    <span className={`status-badge category-badge ${current.className}`}>
      <span className="badge-icon">{current.icon}</span>
      <span className="badge-text">{current.label}</span>
    </span>
  );
}

export function EmissionBadge({ value, unit = 'kg' }) {
  const num = Number(value) || 0;
  let level = 'low';
  if (num > 25) level = 'high';
  else if (num > 5) level = 'medium';

  return (
    <span className={`status-badge emission-badge level-${level}`}>
      <span className="badge-indicator" />
      <span className="badge-value">{num.toFixed(2)}</span>
      <span className="badge-unit">{unit} CO₂e</span>
    </span>
  );
}

export function HealthBadge({ status = 'UP' }) {
  const isUp = status === 'UP';
  return (
    <div className={`health-status-badge ${isUp ? 'is-up' : 'is-down'}`} title={`Backend API: ${status}`}>
      <span className="health-dot" />
      <span className="health-label">API {isUp ? 'Online' : 'Offline'}</span>
    </div>
  );
}
