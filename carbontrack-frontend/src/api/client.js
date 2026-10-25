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

export function getBadgeIconUrl(url) {
  return getProfileImageUrl(url);
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
      if (data.validationErrors && typeof data.validationErrors === 'object' && Object.keys(data.validationErrors).length > 0) {
        validationErrors = data.validationErrors;
        const fieldMsgs = Object.values(data.validationErrors).filter(Boolean);
        message = fieldMsgs.length > 0 ? fieldMsgs.join('. ') : (data.message || 'Validation failed. Please check your inputs.');
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
    getMyGoals: async () => {
      try {
        return await request('/api/goals/me', { method: 'GET' });
      } catch (err) {
        if (err.status === 404 || err.status === 405) {
          return await request('/api/goals', { method: 'GET' });
        }
        throw err;
      }
    },

    create: ({
      title,
      description,
      baselineCo2eKg,
      reductionPercentage,
      targetCo2eKg,
      startDate,
      endDate
    }) => {
      let baseline =
        baselineCo2eKg !== undefined && baselineCo2eKg !== null && baselineCo2eKg !== ''
          ? Number(baselineCo2eKg)
          : null;
      let reduction =
        reductionPercentage !== undefined && reductionPercentage !== null && reductionPercentage !== ''
          ? Number(reductionPercentage)
          : null;

      // Fallback if caller provided targetCo2eKg but not baseline/reduction
      if ((baseline === null || isNaN(baseline)) && targetCo2eKg !== undefined && targetCo2eKg !== null && targetCo2eKg !== '') {
        reduction = 10;
        baseline = Number((Number(targetCo2eKg) / 0.9).toFixed(3));
      }

      const payload = {
        title: title ? title.trim() : '',
        description: description ? description.trim() : '',
        startDate,
        endDate
      };

      if (baseline !== null && !isNaN(baseline)) {
        payload.baselineCo2eKg = Number(baseline.toFixed(3));
      }
      if (reduction !== null && !isNaN(reduction)) {
        payload.reductionPercentage = Number(reduction.toFixed(2));
      }

      return request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    update: (
      id,
      {
        title,
        description,
        baselineCo2eKg,
        reductionPercentage,
        targetCo2eKg,
        startDate,
        endDate,
        status
      }
    ) => {
      let baseline =
        baselineCo2eKg !== undefined && baselineCo2eKg !== null && baselineCo2eKg !== ''
          ? Number(baselineCo2eKg)
          : null;
      let reduction =
        reductionPercentage !== undefined && reductionPercentage !== null && reductionPercentage !== ''
          ? Number(reductionPercentage)
          : null;

      if ((baseline === null || isNaN(baseline)) && targetCo2eKg !== undefined && targetCo2eKg !== null && targetCo2eKg !== '') {
        reduction = 10;
        baseline = Number((Number(targetCo2eKg) / 0.9).toFixed(3));
      }

      const payload = {
        title: title ? title.trim() : '',
        description: description ? description.trim() : '',
        startDate,
        endDate,
        status: status || 'ACTIVE'
      };

      if (baseline !== null && !isNaN(baseline)) {
        payload.baselineCo2eKg = Number(baseline.toFixed(3));
      }
      if (reduction !== null && !isNaN(reduction)) {
        payload.reductionPercentage = Number(reduction.toFixed(2));
      }

      return request(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    delete: (id) => request(`/api/goals/${id}`, { method: 'DELETE' }),

    getProjection: (id) => request(`/api/goals/${id}/projection`, { method: 'GET' })
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
  },

  // Footprint Aggregation & Analytics endpoints (Task 2 & 3)
  analytics: {
    getDaily: (startDate, endDate) =>
      request(`/api/analytics/daily?startDate=${startDate}&endDate=${endDate}`, { method: 'GET' }),

    getWeekly: (startDate, endDate) =>
      request(`/api/analytics/weekly?startDate=${startDate}&endDate=${endDate}`, { method: 'GET' }),

    getMonthly: (startDate, endDate) =>
      request(`/api/analytics/monthly?startDate=${startDate}&endDate=${endDate}`, { method: 'GET' })
  },

  // Personalised Recommendations endpoints (Task 4)
  recommendations: {
    getWeekly: () => request('/api/recommendations/weekly', { method: 'GET' })
  },

  // Peer Benchmarking endpoints (Task 7)
  benchmarks: {
    getMyBenchmark: () => request('/api/benchmarks/me', { method: 'GET' })
  },

  // Badge & Achievement Engine endpoints (Task 8)
  badges: {
    getMyBadges: () => request('/api/badges/me', { method: 'GET' })
  }
};

export const apiClient = api;
export default api;

