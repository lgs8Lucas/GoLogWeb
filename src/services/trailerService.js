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
    const response = await apiClient.put(`/trailer/${id}`, payload);
    return response.data;
  },

  patchTrailer: async (id, payload) => {
    const response = await apiClient.patch(`/trailer/${id}`, payload);
    return response.data;
  },

  deleteTrailer: async (id) => {
    const response = await apiClient.delete(`/trailer/${id}`);
    return response.data;
  }
};
