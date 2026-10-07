import { apiClient } from './apiClient';

export const demandTypeService = {
  getAll: async () => {
    const response = await apiClient.get('/demand-type');
    return response.data;
  },

  getAvailableForCompany: async (companyId) => {
    const url = companyId ? `/demand-type/company/${companyId}` : '/demand-type';
    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/demand-type/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/demand-type', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/demand-type/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/demand-type/${id}`);
    return response.data;
  }
};
