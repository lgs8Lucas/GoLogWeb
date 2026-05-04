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
    // Note: The OpenAPI spec for Tractor has DELETE mapped to /tractor with an 'id' query parameter
    // instead of the standard /tractor/{id}. If this is a mistake in the API, we might need `/tractor/${id}`.
    // Based on the spec:
    const response = await apiClient.delete('/tractor', { params: { id } });
    return response.data;
  }
};
