import React from 'react';
import { EcoSproutIcon } from './NatureIcons';

export default function EmptyState({
  title = 'No activities recorded yet',
  description = 'Start logging your daily travels, meals, and energy usage to build your personal carbon footprint insights.',
  actionText = 'Log New Activity',
  onAction,
  icon
}) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-wrapper">
        {icon || <EcoSproutIcon size={44} color="#48724D" />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionText && onAction && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
