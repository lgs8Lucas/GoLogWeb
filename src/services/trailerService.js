import { apiClient } from './apiClient';

export const trailerService = {
  createTrailer: async (payload) => {
    const response = await apiClient.post('/trailer', payload);
    return response.data;
  },

  getTrailerById: async (id) => {
    const response = await apiClient.get(`/trailer/${id}`);
    return response.data;
  },

  updateTrailer: async (id, payload) => {
    const response = await apiClient.patch(`/trailer/${id}`, payload);
    return response.data;
  },

  patchTrailer: async (id, payload) => {
    const response = await apiClient.patch(`/trailer/${id}`, payload);
    return response.data;
  },

  deleteTrailer: async (id) => {
    const response = await apiClient.delete(`/trailer/${id}`);
    return response.data;
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => {
    try {
      const response = await apiClient.get('/trailer');
      return response.data;
    } catch (error) {
      console.warn('GET /trailer is not implemented yet in the backend. Fallback: returning empty list []', error);
      return [];
    }
  },
  getById: async (id) => trailerService.getTrailerById(id),
  create: async (payload) => trailerService.createTrailer(payload),
  update: async (id, payload) => trailerService.updateTrailer(id, payload),
  patch: async (id, payload) => trailerService.patchTrailer(id, payload),
  delete: async (id) => trailerService.deleteTrailer(id)
};
