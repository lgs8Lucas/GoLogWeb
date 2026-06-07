import { apiClient } from './apiClient';

export const equipamentService = {
  getEquipamentById: async (id) => {
    const response = await apiClient.get(`/equipament/${id}`);
    return response.data;
  },

  getAllEquipaments: async () => {
    const response = await apiClient.get('/equipament');
    return response.data;
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => equipamentService.getAllEquipaments(),
  getById: async (id) => equipamentService.getEquipamentById(id)
};
