import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { LeafIcon } from '../components/NatureIcons';
import { Mail, KeyRound, Lock, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Steps: 1 = Request OTP, 2 = Verify OTP, 3 = Reset Password, 4 = Done
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await api.auth.forgotPassword({ email: email.trim() });
      setInfoMsg(res?.message || 'If an account exists, a 6-digit OTP code has been sent to your email.');
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrorMsg('Please enter the OTP verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.auth.verifyOtp({
        email: email.trim(),
        otp: otp.trim()
      });

      if (!res?.resetToken) {
        throw new Error('OTP verified but no reset token was issued.');
      }

      setResetToken(res.resetToken);
      setInfoMsg('Code verified! Please choose a new secure password.');
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired OTP. Please verify and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.auth.resetPassword({
        resetToken,
        newPassword
      });

      setInfoMsg(res?.message || 'Your password has been reset successfully!');
      setStep(4);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. The reset token may have expired.');
    } finally {
      setIsLoading(false);
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
          <h1 className="auth-title">Password Recovery</h1>
          <p className="auth-subtitle">
            {step === 1 && 'Enter your registered email to receive a verification code.'}
            {step === 2 && 'Enter the 6-digit OTP code sent to your email.'}
            {step === 3 && 'Create a strong, new password for your account.'}
            {step === 4 && 'Your password has been safely updated.'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="step-progress-bar">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
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

        {/* Email delivery disclosure banner */}
        <div className="smtp-notice-card">
          <Info size={16} color="#668F63" />
          <p>
            <strong>Email Notice:</strong> OTP dispatch relies on backend SMTP credentials (<code>MAIL_USERNAME</code> and <code>MAIL_PASSWORD</code>). If SMTP is not configured in your environment, contact your administrator.
          </p>
        </div>

        {/* STEP 1: Email Form */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="recovery-email">Account Email</label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="recovery-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="otp-input">Enter 6-Digit OTP</label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <KeyRound size={18} />
                </span>
                <input
                  id="otp-input"
                  type="text"
                  placeholder="e.g. 123456"
                  maxLength={10}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <span className="field-hint">Code expires in 5 minutes</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-block btn-sm"
              onClick={() => {
                setStep(1);
                setErrorMsg('');
              }}
            >
              <ArrowLeft size={16} />
              <span>Change Email</span>
            </button>
          </form>
        )}

        {/* STEP 3: New Password Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="new-pass">New Password</label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="new-pass"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <span className="field-hint">8 to 72 characters</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-new-pass">Confirm New Password</label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="confirm-new-pass"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Completed */}
        {step === 4 && (
          <div className="reset-completed-box">
            <div className="completed-icon-circle">
              <CheckCircle2 size={40} color="#244B35" />
            </div>
            <h3>Password Successfully Reset!</h3>
            <p>You can now log in using your newly created password.</p>
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={() => navigate('/login')}
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        <div className="auth-card-footer">
          <Link to="/login" className="back-to-login-link">
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
