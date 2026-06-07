import { apiClient } from './apiClient';

export const occurrenceService = {
  create: async (payload) => {
    const response = await apiClient.post('/occurrence', payload);
    return response.data;
  },

  getAll: async () => {
    try {
      const response = await apiClient.get('/occurrence');
      return response.data;
    } catch (error) {
      console.warn('GET /occurrence is not implemented yet in the backend. Fallback: returning empty list []', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await apiClient.get(`/occurrence/${id}`);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await apiClient.put(`/occurrence/${id}`, payload);
    return response.data;
  },

  patch: async (id, payload) => {
    const response = await apiClient.patch(`/occurrence/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/occurrence/${id}`);
    return response.data;
  }
};
