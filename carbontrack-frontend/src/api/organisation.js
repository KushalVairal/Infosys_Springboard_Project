import api from './client';

export const organisationApi = {
  getSummary: (startDate, endDate) => api.organisation.getSummary(startDate, endDate),
  getCategories: (startDate, endDate) => api.organisation.getCategories(startDate, endDate),
  getMonthlyTrends: () => api.organisation.getMonthlyTrends(),
  getEmployees: (startDate, endDate) => api.organisation.getEmployees(startDate, endDate)
};

export default organisationApi;

