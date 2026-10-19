import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import { getGoogleLoginUrl } from '../api/auth';
import { LeafIcon } from '../components/NatureIcons';
import GoogleIcon from '../components/GoogleIcon';
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, Sun, Moon } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errorMsg, setErrorMsg] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const err = p.get('error');
      if (err) {
        window.history.replaceState({}, document.title, window.location.pathname);
        return decodeURIComponent(err);
      }
    }
    return '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('oauth') === 'success' && Boolean(p.get('token'));
    }
    return false;
  });
  const flashMessage = location.state?.message || '';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauth = params.get('oauth');
    const token = params.get('token');
    const userId = params.get('userId');
    const email = params.get('email');

    if (oauth === 'success' && token) {
      let isMounted = true;
      login(token, {
        id: userId ? Number(userId) : undefined,
        email: email ? decodeURIComponent(email) : undefined
      })
        .then(() => {
          if (!isMounted) return;
          const redirectPath = location.state?.from?.pathname || '/dashboard';
          navigate(redirectPath, { replace: true });
        })
        .catch((err) => {
          if (!isMounted) return;
          setErrorMsg(err.message || 'Failed to complete Google sign-in.');
          setIsGoogleLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [location.search, location.state, login, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.auth.login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (!res.token) {
        throw new Error('Authentication succeeded but no security token was returned.');
      }

      await login(res.token, {
        id: res.userId,
        email: res.email
      });

      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    window.location.href = getGoogleLoginUrl();
  };

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
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Log in to track your carbon activities and impact.</p>
        </div>

        {flashMessage && (
          <div className="auth-alert alert-success" role="alert">
            <CheckCircle2 size={18} />
            <span>{flashMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div className="auth-alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting || isGoogleLoading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-with-link">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot password?
              </Link>
            </div>
            <div className="input-with-icon">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting || isGoogleLoading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting || isGoogleLoading}
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" message="" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider" role="separator" aria-label="or continue with">
          <span>or</span>
        </div>

        <button
          type="button"
          className="btn btn-google btn-block btn-lg"
          onClick={handleGoogleLogin}
          disabled={isSubmitting || isGoogleLoading}
          id="google-login-btn"
        >
          {isGoogleLoading ? (
            <LoadingSpinner size="sm" message="Connecting to Google..." />
          ) : (
            <>
              <GoogleIcon size={18} />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="auth-card-footer">
          <p>
            Don't have an account yet?{' '}
            <Link to="/register" className="auth-link-primary">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

