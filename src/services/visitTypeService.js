import { apiClient } from './apiClient';

export const visitTypeService = {
  getAll: async () => {
    const response = await apiClient.get('/visit-type');
    return response.data;
  },

  getAvailableForCompany: async (companyId) => {
    const url = companyId ? `/visit-type/company/${companyId}` : '/visit-type';
    const response = await apiClient.get(url);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/visit-type', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/visit-type/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/visit-type/${id}`);
    return response.data;
  },

  // Regras de Incompatibilidade
  getRulesByCompany: async (companyId) => {
    const url = companyId ? `/visit-type-rule/company/${companyId}` : '/visit-type-rule';
    const response = await apiClient.get(url);
    return response.data;
  },

  createRule: async (data) => {
    const response = await apiClient.post('/visit-type-rule', data);
    return response.data;
  },

  updateRule: async (id, data) => {
    const response = await apiClient.put(`/visit-type-rule/${id}`, data);
    return response.data;
  },

  deleteRule: async (id) => {
    const response = await apiClient.delete(`/visit-type-rule/${id}`);
    return response.data;
  }
};
