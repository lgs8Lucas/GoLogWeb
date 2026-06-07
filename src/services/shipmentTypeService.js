import { apiClient } from './apiClient';

export const shipmentTypeService = {
  create: async (payload) => {
    const response = await apiClient.post('/shipment-type', payload);
    return response.data;
  },

  getAll: async () => {
    try {
      const response = await apiClient.get('/shipment-type');
      return response.data;
    } catch (error) {
      console.warn('GET /shipment-type is not implemented yet in the backend. Fallback: returning empty list []', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await apiClient.get(`/shipment-type/${id}`);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await apiClient.put(`/shipment-type/${id}`, payload);
    return response.data;
  },

  patch: async (id, payload) => {
    const response = await apiClient.patch(`/shipment-type/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/shipment-type/${id}`);
    return response.data;
  }
};
