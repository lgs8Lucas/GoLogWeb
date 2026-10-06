import { apiClient } from './apiClient';

export const workShiftTemplateService = {
  getAll: async () => {
    const response = await apiClient.get('/work-shift-template');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/work-shift-template/${id}`);
    return response.data;
  },

  create: async (payload) => {
    const response = await apiClient.post('/work-shift-template', payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await apiClient.put(`/work-shift-template/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/work-shift-template/${id}`);
    return response.data;
  }
};
