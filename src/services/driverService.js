import { apiClient } from './apiClient';

export const driverService = {
  getAllDrivers: async () => {
    const response = await apiClient.get('/driver');
    return response.data;
  },

  getDriverById: async (id) => {
    const response = await apiClient.get(`/driver/${id}`);
    return response.data;
  },

  createDriver: async (driverData) => {
    const response = await apiClient.post('/driver', driverData);
    return response.data;
  },

  updateDriver: async (id, driverData) => {
    const response = await apiClient.put(`/driver/${id}`, driverData);
    return response.data;
  },

  deleteDriver: async (id) => {
    const response = await apiClient.delete(`/driver/${id}`);
    return response.data;
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => driverService.getAllDrivers(),
  getById: async (id) => driverService.getDriverById(id),
  create: async (payload) => driverService.createDriver(payload),
  update: async (id, payload) => driverService.updateDriver(id, payload),
  delete: async (id) => driverService.deleteDriver(id)
};
