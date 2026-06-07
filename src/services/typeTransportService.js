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
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => {
    try {
      const response = await apiClient.get('/type-transport');
      return response.data;
    } catch (error) {
      console.warn('GET /type-transport is not implemented yet in the backend. Fallback: returning empty list []', error);
      return [];
    }
  },
  getById: async (id) => typeTransportService.getTypeTransportById(id),
  create: async (payload) => typeTransportService.createTypeTransport(payload),
  update: async (id, payload) => typeTransportService.updateTypeTransport(id, payload),
  patch: async (id, payload) => typeTransportService.patchTypeTransport(id, payload),
  delete: async (id) => typeTransportService.deleteTypeTransport(id)
};
