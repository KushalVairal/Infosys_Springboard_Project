import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { LeafIcon } from './NatureIcons';
import { Sun, Moon, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
  error,
  success,
}) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className="auth-page-container">
      <div className="auth-theme-toggle-wrapper">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="auth-card-wrapper">
        <div className="auth-card-header">
          <Link to="/" className="auth-brand-link">
            <span className="brand-logo-icon">
              <LeafIcon size={24} color="#FFFFFF" />
            </span>
            <span className="brand-name">CarbonTrack</span>
          </Link>
          {title && <h1 className="auth-title">{title}</h1>}
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>

        {error && (
          <div className="auth-alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert alert-success" role="alert">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {children}

        {(footerText || footerLinkTo) && (
          <div className="auth-card-footer">
            <p>
              {footerText}{' '}
              {footerLinkTo && footerLinkText && (
                <Link to={footerLinkTo} className="auth-link-primary">
                  {footerLinkText}
                </Link>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
