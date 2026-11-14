import React from 'react';
import { AlertTriangle, RotateCw, LayoutDashboard } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Useful development diagnostic logging without leaking server secrets
    console.error('[CarbonTrack ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.';
      const isDev = process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost';

      return (
        <div
          role="alert"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-soft, #E2E8F0)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--text-heading, #1E293B)',
                  margin: '0 0 0.5rem 0'
                }}
              >
                Something went wrong
              </h2>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted, #64748B)',
                  margin: 0,
                  lineHeight: 1.5
                }}
              >
                CarbonTrack encountered an unexpected view issue while rendering this section. You can try refreshing or return to your dashboard.
              </p>
            </div>

            {isDev && (
              <div
                style={{
                  width: '100%',
                  background: 'var(--bg-tint, #F8FAFC)',
                  border: '1px solid var(--border-soft, #E2E8F0)',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.78rem',
                  color: '#B91C1C',
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  overflowX: 'auto',
                  maxHeight: '120px'
                }}
              >
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RotateCw size={15} />
                Try Again
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleGoDashboard}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <LayoutDashboard size={15} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

