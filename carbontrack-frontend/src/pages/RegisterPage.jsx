import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { LeafIcon } from '../components/NatureIcons';
import { User, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3 || formData.username.trim().length > 50) {
      errors.username = 'Username must be between 3 and 50 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (formData.password.length > 72) {
      errors.password = 'Password cannot exceed 72 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (generalError) setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError('');
    setFieldErrors({});

    try {
      // 1. Register with backend
      await api.auth.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      setSuccessMsg('Account created successfully! Signing you in...');

      // 2. Automatically log in to obtain JWT
      try {
        const loginRes = await api.auth.login({
          email: formData.email.trim(),
          password: formData.password
        });
        if (loginRes.token) {
          await login(loginRes.token, {
            id: loginRes.userId,
            email: loginRes.email,
            username: formData.username.trim()
          });
          navigate('/dashboard');
          return;
        }
      } catch {
        // Fallback to manual login
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Account created! Please log in with your credentials.' }
          });
        }, 1200);
      }
    } catch (err) {
      if (err.validationErrors) {
        setFieldErrors(err.validationErrors);
      } else {
        setGeneralError(err.message || 'Registration failed. Please verify your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-card-header">
          <Link to="/" className="auth-brand-link">
            <span className="brand-logo-icon">
              <LeafIcon size={24} color="#FFFFFF" />
            </span>
            <span className="brand-name">CarbonTrack</span>
          </Link>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join us to measure, understand, and reduce your emissions.</p>
        </div>

        {generalError && (
          <div className="auth-alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{generalError}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert alert-success" role="alert">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className={`input-with-icon ${fieldErrors.username ? 'has-error' : ''}`}>
              <span className="input-icon">
                <User size={18} />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="e.g. greenranger"
                value={formData.username}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
            {fieldErrors.username && (
              <span className="field-error-message">{fieldErrors.username}</span>
            )}
            <span className="field-hint">3 to 50 characters</span>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className={`input-with-icon ${fieldErrors.email ? 'has-error' : ''}`}>
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
                disabled={isSubmitting}
                required
              />
            </div>
            {fieldErrors.email && (
              <span className="field-error-message">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className={`input-with-icon ${fieldErrors.password ? 'has-error' : ''}`}>
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
            {fieldErrors.password && (
              <span className="field-error-message">{fieldErrors.password}</span>
            )}
            <span className="field-hint">8 to 72 characters</span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={`input-with-icon ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
            {fieldErrors.confirmPassword && (
              <span className="field-error-message">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" message="" />
            ) : (
              <>
                <span>Create CarbonTrack Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
