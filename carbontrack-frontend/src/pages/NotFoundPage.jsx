import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LeafIcon } from '../components/NatureIcons';
import { LayoutDashboard, Home } from 'lucide-react';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon">
          <LeafIcon size={48} color="#48724D" />
        </div>
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-desc">
          The sustainability resource or page you are looking for does not exist or has been moved.
        </p>
        <div className="not-found-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary">
              <LayoutDashboard size={18} />
              <span>Back to Dashboard</span>
            </Link>
          ) : (
            <Link to="/" className="btn btn-primary">
              <Home size={18} />
              <span>Return Home</span>
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/" className="btn btn-secondary">
              <Home size={18} />
              <span>Landing Page</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

