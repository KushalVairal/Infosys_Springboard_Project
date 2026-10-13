import axios from 'axios';
import mockAdapter from './mock';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ct_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ct_token');
      localStorage.removeItem('ct_user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
