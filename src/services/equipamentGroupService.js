import { apiClient } from './apiClient';

export const equipamentGroupService = {
  createEquipamentGroup: async (payload) => {
    const response = await apiClient.post('/equipamentGroup', payload);
    return response.data;
  },

  getEquipamentGroupById: async (id) => {
    const response = await apiClient.get(`/equipamentGroup/${id}`);
    return response.data;
  },

  updateEquipamentGroup: async (id, payload) => {
    const response = await apiClient.put(`/equipamentGroup/${id}`, payload);
    return response.data;
  },

  patchEquipamentGroup: async (id, payload) => {
    const response = await apiClient.patch(`/equipamentGroup/${id}`, payload);
    return response.data;
  },

  deleteEquipamentGroup: async (id) => {
    const response = await apiClient.delete(`/equipamentGroup/${id}`);
    return response.data;
  }
};
