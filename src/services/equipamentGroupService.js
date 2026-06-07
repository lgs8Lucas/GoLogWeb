import { apiClient } from './apiClient';

export const equipamentGroupService = {
  createEquipamentGroup: async (payload) => {
    const response = await apiClient.post('/equipament-group', payload);
    return response.data;
  },

  getEquipamentGroupById: async (id) => {
    const response = await apiClient.get(`/equipament-group/${id}`);
    return response.data;
  },

  updateEquipamentGroup: async (id, payload) => {
    const response = await apiClient.put(`/equipament-group/${id}`, payload);
    return response.data;
  },

  patchEquipamentGroup: async (id, payload) => {
    const response = await apiClient.patch(`/equipament-group/${id}`, payload);
    return response.data;
  },

  deleteEquipamentGroup: async (id) => {
    const response = await apiClient.delete(`/equipament-group/${id}`);
    return response.data;
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => {
    try {
      const response = await apiClient.get('/equipament-group');
      return response.data;
    } catch (error) {
      console.warn('GET /equipament-group is not implemented yet in the backend. Fallback: returning empty list []', error);
      return [];
    }
  },
  getById: async (id) => equipamentGroupService.getEquipamentGroupById(id),
  create: async (payload) => equipamentGroupService.createEquipamentGroup(payload),
  update: async (id, payload) => equipamentGroupService.updateEquipamentGroup(id, payload),
  patch: async (id, payload) => equipamentGroupService.patchEquipamentGroup(id, payload),
  delete: async (id) => equipamentGroupService.deleteEquipamentGroup(id)
};
