import React from 'react';
import { EcoSproutIcon } from './NatureIcons';

export default function EmptyState({
  title = 'No activities recorded yet',
  description,
  message,
  actionText,
  onAction,
  icon
}) {
  const displayDescription = description || message || 'Start logging your daily travels, meals, and energy usage to build your personal carbon footprint insights.';

  const renderIcon = () => {
    if (!icon) {
      return <EcoSproutIcon size={44} color="#48724D" />;
    }
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent size={44} color="var(--forest-primary, #246b43)" />;
    }
    return <EcoSproutIcon size={44} color="#48724D" />;
  };

  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-wrapper">
        {renderIcon()}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{displayDescription}</p>
      {actionText && onAction && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
