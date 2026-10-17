import apiClient from './client';

export const register = (data) => apiClient.post('/api/auth/register', data).then((r) => r.data);
export const login = (data) => apiClient.post('/api/auth/login', data).then((r) => r.data);
export const forgotPassword = (email) =>
  apiClient.post('/api/auth/forgot-password', { email }).then((r) => r.data);
export const verifyOtp = (email, otp) =>
  apiClient.post('/api/auth/verify-otp', { email, otp }).then((r) => r.data);
export const resetPassword = (resetToken, newPassword) =>
  apiClient.post('/api/auth/reset-password', { resetToken, newPassword }).then((r) => r.data);
