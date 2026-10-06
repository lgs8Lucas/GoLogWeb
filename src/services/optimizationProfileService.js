import { apiClient } from './apiClient';

export const optimizationProfileService = {
  save: async (data) => {
    const response = await apiClient.post('/optimization-profile', data);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/optimization-profile/${id}`);
    return response.data;
  },

  getByCompany: async (companyId) => {
    const response = await apiClient.get(`/optimization-profile/company/${companyId}`);
    return response.data;
  },

  getDefaultByCompany: async (companyId) => {
    const response = await apiClient.get(`/optimization-profile/company/${companyId}/default`);
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
