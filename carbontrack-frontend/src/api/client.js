// Centralized API client for CarbonTrack Spring Boot REST API

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export class ApiError extends Error {
  constructor(message, status = 500, validationErrors = null, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
    this.data = data;
  }
}

export function getProfileImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token =
    localStorage.getItem('carbontrack_token') ||
    localStorage.getItem('ct_token');
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new ApiError(
      `Unable to reach the backend server at ${API_BASE_URL}. Ensure Spring Boot is running on port 8080.`,
      0
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      if (text) data = { message: text };
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('carbontrack_token');
      localStorage.removeItem('ct_token');
      localStorage.removeItem('carbontrack_user');
      localStorage.removeItem('ct_user');
      window.dispatchEvent(new CustomEvent('carbontrack:unauthorized'));
    }

    let message = 'An unexpected error occurred';
    let validationErrors = null;

    if (data) {
      if (data.validationErrors && typeof data.validationErrors === 'object') {
        validationErrors = data.validationErrors;
        message = data.message || 'Validation failed. Please check your inputs.';
      } else if (data.message) {
        message = data.message;
      } else if (data.error) {
        message = data.error;
      }
    } else if (response.statusText) {
      message = response.statusText;
    }

    throw new ApiError(message, response.status, validationErrors, data);
  }

  return data;
}

export const api = {
  // System / Health
  health: () => request('/api/health', { method: 'GET' }),
  testProtected: () => request('/api/test/protected', { method: 'GET' }),

  // Auth endpoints
  auth: {
    register: ({ username, email, password }) =>
      request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      }),

    login: ({ email, password }) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),

    forgotPassword: ({ email }) =>
      request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

    verifyOtp: ({ email, otp }) =>
      request('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      }),

    resetPassword: ({ resetToken, newPassword }) =>
      request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ resetToken, newPassword })
      })
  },

  // User Profile endpoints
  users: {
    getMe: () => request('/api/users/me', { method: 'GET' }),

    updateMe: ({
      username,
      fullName,
      phoneNumber,
      location,
      profileImageUrl,
      preferredUnit,
      goalVisibility
    }) =>
      request('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          username,
          fullName: fullName || '',
          phoneNumber: phoneNumber || '',
          location: location || '',
          profileImageUrl: profileImageUrl || '',
          preferredUnit: preferredUnit || 'KG_CO2E',
          goalVisibility: goalVisibility ?? true
        })
      }),

    uploadProfileImage: async (file) => {
      const url = `${API_BASE_URL}/api/users/profile-image`;
      const formData = new FormData();
      formData.append('file', file);
      const token =
        localStorage.getItem('carbontrack_token') ||
        localStorage.getItem('ct_token');
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
      } catch {
        throw new ApiError(
          `Unable to reach the backend server at ${API_BASE_URL}. Ensure Spring Boot is running on port 8080.`,
          0
        );
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new ApiError(data?.message || 'Failed to upload profile image', response.status, null, data);
      }
      return data;
    },

    deleteProfileImage: () => request('/api/users/profile-image', { method: 'DELETE' })
  },

  // Sustainability Goals endpoints
  goals: {
    getMyGoals: () => request('/api/goals', { method: 'GET' }),

    create: ({ title, description, targetCo2eKg, startDate, endDate }) =>
      request('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || '',
          targetCo2eKg: Number(targetCo2eKg),
          startDate,
          endDate
        })
      }),

    update: (id, { title, description, targetCo2eKg, startDate, endDate, status }) =>
      request(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          description: description || '',
          targetCo2eKg: Number(targetCo2eKg),
          startDate,
          endDate,
          status: status || 'ACTIVE'
        })
      }),

    delete: (id) => request(`/api/goals/${id}`, { method: 'DELETE' })
  },

  // Activity Log endpoints
  activities: {
    getMyActivities: () => request('/api/activities/me', { method: 'GET' }),

    create: ({ category, activityType, quantity, unit, logDate }) =>
      request('/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          category,
          activityType,
          quantity: Number(quantity),
          unit,
          logDate
        })
      })
  }
};

export const apiClient = api;
export default api;

