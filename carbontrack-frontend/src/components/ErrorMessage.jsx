import React from 'react';
import { AlertCircle, AlertTriangle, Info, X, RefreshCw } from 'lucide-react';

export default function ErrorMessage({
  message,
  title,
  variant = 'error',
  onRetry,
  onDismiss,
  className = ''
}) {
  if (!message) return null;

  const icons = {
    error: <AlertCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />
  };

  const alertClass = `alert-${variant}`;

  return (
    <div className={`auth-alert ${alertClass} ${className}`} role="alert">
      <span className="alert-icon" style={{ flexShrink: 0, marginTop: '2px' }}>
        {icons[variant] || icons.error}
      </span>
      <div className="alert-body" style={{ flex: 1 }}>
        {title && <strong style={{ display: 'block', marginBottom: '2px' }}>{title}</strong>}
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-retry"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.85rem'
          }}
          title="Retry"
        >
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="btn-dismiss"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'inherit'
          }}
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
