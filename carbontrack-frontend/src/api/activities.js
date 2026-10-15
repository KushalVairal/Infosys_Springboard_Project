import apiClient from './client';

// Backend field names are mapped in ONE place. If your DTOs differ, edit here.
const normalize = (a) => ({
  ...a,
  co2eKg: a.co2eKg ?? a.co2Kg ?? a.emissionKg ?? a.totalEmission ?? a.emission ?? 0,
  logDate: a.logDate ?? a.activityDate ?? a.date ?? (a.createdAt || '').slice(0, 10),
});

const toPage = (data, page, size) => {
  // Spring Page -> as is. Plain array -> wrap into a Page-like object.
  if (Array.isArray(data)) {
    const totalPages = Math.max(1, Math.ceil(data.length / size));
    return {
      content: data.slice(page * size, page * size + size).map(normalize),
      number: page,
      size,
      totalElements: data.length,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    };
  }
  return { ...data, content: (data.content || []).map(normalize) };
};

export const createActivity = (data) =>
  apiClient.post('/api/activities', data).then((r) => normalize(r.data));

export const listActivities = async ({ category, from, to, page = 0, size = 20 } = {}) => {
  const params = { category, from, to, page, size };
  try {
    const r = await apiClient.get('/api/activities', { params });
    return toPage(r.data, page, size);
  } catch (err) {
    // Backend README documents GET /api/activities/me — fall back to it.
    if ([404, 405].includes(err.response?.status)) {
      const r = await apiClient.get('/api/activities/me', { params });
      let data = r.data;
      if (Array.isArray(data)) {
        data = data.filter(
          (a) =>
            (!category || a.category === category) &&
            (!from || (normalize(a).logDate || '') >= from) &&
            (!to || (normalize(a).logDate || '') <= to)
        );
      }
      return toPage(data, page, size);
    }
    throw err;
  }
};

export const getActivity = (id) =>
  apiClient.get(`/api/activities/${id}`).then((r) => normalize(r.data));
