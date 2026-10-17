import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, verifyOtp, resetPassword } from '../api/auth';
import '../styles/auth.css';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await forgotPassword(email);
      setMessage(res.message || 'OTP sent to your email');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await verifyOtp(email, otp);
      setResetToken(res.resetToken);
      setMessage('');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await resetPassword(resetToken, newPassword);
      setMessage('Password reset successful. You can now log in.');
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset your password</h1>
        <p className="subtitle">
          {step === 1 && 'Enter your email to receive an OTP'}
          {step === 2 && 'Enter the OTP sent to your email'}
          {step === 3 && 'Choose a new password'}
          {step === 4 && 'Done!'}
        </p>

        {step === 2 && message && <div className="hint">{message}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit">Send OTP</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>OTP</label>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit">Verify OTP</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit">Reset Password</button>
          </form>
        )}

        {step === 4 && <div className="success">{message}</div>}

        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
