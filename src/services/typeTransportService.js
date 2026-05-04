import { apiClient } from './apiClient';

export const typeTransportService = {
  createTypeTransport: async (payload) => {
    const response = await apiClient.post('/type-transport', payload);
    return response.data;
  },

  getTypeTransportById: async (id) => {
    const response = await apiClient.get(`/type-transport/${id}`);
    return response.data;
  },

  updateTypeTransport: async (id, payload) => {
    const response = await apiClient.put(`/type-transport/${id}`, payload);
    return response.data;
  },

  patchTypeTransport: async (id, payload) => {
    const response = await apiClient.patch(`/type-transport/${id}`, payload);
    return response.data;
  },

  deleteTypeTransport: async (id) => {
    const response = await apiClient.delete(`/type-transport/${id}`);
    return response.data;
  }
};
