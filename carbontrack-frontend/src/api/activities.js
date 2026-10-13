import apiClient from './client';

export const createActivity = (data) => apiClient.post('/api/activities', data).then((r) => r.data);
export const listActivities = ({ category, from, to, page = 0, size = 20 } = {}) =>
  apiClient.get('/api/activities', { params: { category, from, to, page, size } }).then((r) => r.data);
export const getActivity = (id) => apiClient.get(`/api/activities/${id}`).then((r) => r.data);
