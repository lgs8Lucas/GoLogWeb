import { apiClient } from './apiClient';

export const optimizationProfileService = {
  getAllByCompany: async (companyId) => {
    if (!companyId) return [];
    const response = await apiClient.get(`/optimization-profile/company/${companyId}`);
    return response.data;
  },

  getDefaultByCompany: async (companyId) => {
    if (!companyId) return null;
    const response = await apiClient.get(`/optimization-profile/company/${companyId}/default`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/optimization-profile/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/optimization-profile', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/optimization-profile/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/optimization-profile/${id}`);
    return response.data;
  }
};
