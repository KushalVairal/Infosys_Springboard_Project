import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import { LeafIcon } from '../components/NatureIcons';
import { Mail, KeyRound, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Sun, Moon, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PasswordInput from '../components/PasswordInput';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toggleTheme, isDark } = useTheme();

  // Extract prefilled email from URL query param
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState(
    emailParam
      ? 'Please enter the 6-digit verification code sent to your email and your new password.'
      : ''
  );

  // Sync email param if URL changes
  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam, email]);

  // Handle countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Explicit Resend OTP handler
  const handleResendOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address to receive a new code.');
      return;
    }

    if (resendCooldown > 0) return;

    setIsResending(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await api.auth.forgotPassword({ email: trimmedEmail });
      setInfoMsg(res?.message || 'A fresh 6-digit verification code has been dispatched to your email.');
      setResendCooldown(45); // 45 seconds cooldown
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code. Please wait a moment and try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Submit password reset
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please provide a valid account email address.');
      return;
    }

    if (!trimmedOtp || trimmedOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Your new password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Verify OTP code
      const verifyRes = await api.auth.verifyOtp({
        email: trimmedEmail,
        otp: trimmedOtp
      });

      if (!verifyRes?.resetToken) {
        throw new Error('Verification completed, but no reset authorization token was returned.');
      }

      // Step 2: Reset password using the one-time reset token
      const resetRes = await api.auth.resetPassword({
        resetToken: verifyRes.resetToken,
        newPassword
      });

      // Step 3: Redirect to login with flash success banner
      navigate('/login', {
        replace: true,
        state: {
          message: resetRes?.message || 'Password reset successful! You can now log in with your new password.'
        }
      });
    } catch (err) {
      const errMsg = err?.message || '';
      if (errMsg.toLowerCase().includes('expired')) {
        setErrorMsg('Your verification code has expired (codes expire after 5 minutes). Click "Resend Code" below to receive a new one.');
      } else if (errMsg.toLowerCase().includes('invalid')) {
        setErrorMsg('The verification code is invalid. Please double-check the 6-digit code from your email.');
      } else {
        setErrorMsg(errMsg || 'Failed to complete password reset. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="auth-title">Reset Your Password</h1>
          <p className="auth-subtitle">
            Enter the verification code received via email and set your new account password.
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="auth-alert alert-info" role="status">
            <CheckCircle2 size={18} />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleResetSubmit} className="auth-form" noValidate>
          {/* Email input */}
          <div className="form-group">
            <label htmlFor="reset-email">Account Email</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="reset-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isResending}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* OTP Code Input */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="reset-otp">6-Digit Verification Code</label>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={handleResendOtp}
                disabled={isResending || isLoading || resendCooldown > 0}
                style={{ fontSize: '0.78rem', color: 'var(--color-primary, #2e7d32)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} className={isResending ? 'spin-icon' : ''} />
                <span>
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : isResending
                    ? 'Sending...'
                    : 'Resend Code'}
                </span>
              </button>
            </div>
            <div className="input-with-icon">
              <span className="input-icon">
                <KeyRound size={18} />
              </span>
              <input
                id="reset-otp"
                type="text"
                placeholder="e.g. 482915"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ''))}
                disabled={isLoading}
                required
                autoComplete="one-time-code"
                style={{ letterSpacing: '2px', fontWeight: 600 }}
              />
            </div>
            <span className="field-hint">Valid for 5 minutes from request</span>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <PasswordInput
              id="new-password"
              name="newPassword"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <span className="field-hint">Must contain at least 8 characters</span>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <PasswordInput
              id="confirm-password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isLoading || isResending}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" message="Updating Password..." />
            ) : (
              <>
                <span>Save New Password & Log In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/forgot-password" className="back-to-login-link">
            <ArrowLeft size={16} />
            <span>Request New Code</span>
          </Link>
          <Link to="/login" className="back-to-login-link">
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

