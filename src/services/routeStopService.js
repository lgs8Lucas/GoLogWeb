import { apiClient } from './apiClient';

export const routeStopService = {
  getAll: async () => {
    const response = await apiClient.get('/route-stops');
    return response.data;
  }
};
