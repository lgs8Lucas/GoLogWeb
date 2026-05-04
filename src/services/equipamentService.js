import { apiClient } from './apiClient';

export const equipamentService = {
  getEquipamentById: async (id) => {
    const response = await apiClient.get(`/equipament/${id}`);
    return response.data;
  }
};
