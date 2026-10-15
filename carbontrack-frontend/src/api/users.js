import apiClient from './client';

export const getMyProfile = () => apiClient.get('/api/users/me').then((r) => r.data);
export const updateMyProfile = (data) => apiClient.put('/api/users/me', data).then((r) => r.data);
export const updateVisibility = (goalVisibility, leaderboardOptIn) =>
  apiClient
    .patch('/api/users/me/visibility', null, { params: { goalVisibility, leaderboardOptIn } })
    .then((r) => r.data);
