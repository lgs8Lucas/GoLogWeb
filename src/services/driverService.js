import { apiClient } from './apiClient';

export const driverService = {
  getAllDrivers: async () => {
    const response = await apiClient.get('/driver');
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
  }
};
