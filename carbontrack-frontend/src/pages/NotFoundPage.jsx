import React from 'react';
import { Link } from 'react-router-dom';
import { LeafIcon } from '../components/NatureIcons';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
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
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={18} />
          <span>Return to Safety</span>
        </Link>
      </div>
    </div>
  );
}
