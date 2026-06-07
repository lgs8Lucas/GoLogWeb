import { apiClient } from './apiClient';

export const tractorService = {
  createTractor: async (payload) => {
    const response = await apiClient.post('/tractor', payload);
    return response.data;
  },

  getTractorById: async (id) => {
    const response = await apiClient.get(`/tractor/${id}`);
    return response.data;
  },

  updateTractor: async (id, payload) => {
    const response = await apiClient.put(`/tractor/${id}`, payload);
    return response.data;
  },

  patchTractor: async (id, payload) => {
    const response = await apiClient.patch(`/tractor/${id}`, payload);
    return response.data;
  },

  deleteTractor: async (id) => {
    // The OpenAPI spec for Tractor has DELETE mapped to /tractor with an 'id' query parameter
    const response = await apiClient.delete('/tractor', { params: { id } });
    return response.data;
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => {
    try {
      const response = await apiClient.get('/tractor');
      return response.data;
    } catch (error) {
      console.warn('GET /tractor is not implemented yet in the backend. Fallback: returning empty list []', error);
      return [];
    }
  },
  getById: async (id) => tractorService.getTractorById(id),
  create: async (payload) => tractorService.createTractor(payload),
  update: async (id, payload) => tractorService.updateTractor(id, payload),
  patch: async (id, payload) => tractorService.patchTractor(id, payload),
  delete: async (id) => tractorService.deleteTractor(id)
};
