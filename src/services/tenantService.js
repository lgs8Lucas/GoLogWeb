import { apiClient } from './apiClient';

export const tenantService = {
  getAllTenants: async () => {
    const response = await apiClient.get('/tenants');
    return response.data;
  },

  getSummary: async () => {
    const response = await apiClient.get('/tenants/summary');
    return response.data;
  },

  getTenantById: async (id) => {
    const response = await apiClient.get(`/tenants/${id}`);
    return response.data;
  },

  getBranches: async (id) => {
    const response = await apiClient.get(`/tenants/${id}/branches`);
    return response.data;
  },

  createTenant: async (tenantData) => {
    const response = await apiClient.post('/tenants', tenantData);
    return response.data;
  }
};
