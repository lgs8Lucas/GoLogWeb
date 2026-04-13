import { apiClient } from './apiClient';

export const companyService = {
  getAllCompanies: async () => {
    const response = await apiClient.get('/company');
    return response.data;
  },

  getCompanyById: async (id) => {
    const response = await apiClient.get(`/company/${id}`);
    return response.data;
  },

  createCompany: async (payload) => {
    const response = await apiClient.post('/company', payload);
    return response.data;
  },

  updateCompany: async (id, payload) => {
    const response = await apiClient.put(`/company/${id}`, payload);
    return response.data;
  },

  patchCompany: async (id, payload) => {
    const response = await apiClient.patch(`/company/${id}`, payload);
    return response.data;
  },

  deleteCompany: async (id) => {
    await apiClient.delete(`/company/${id}`);
  },

};
