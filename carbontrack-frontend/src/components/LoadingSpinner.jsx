import React from 'react';
import { LeafIcon } from './NatureIcons';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeMap = {
    sm: 18,
    md: 28,
    lg: 42
  };

  return (
    <div className={`loading-spinner-container size-${size}`}>
      <div className="spinner-orbit">
        <div className="spinner-leaf">
          <LeafIcon size={sizeMap[size] || 28} color="#244B35" />
        </div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}
