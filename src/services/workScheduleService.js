import { apiClient } from './apiClient';

export const workScheduleService = {
  getAllWorkSchedules: async () => {
    const response = await apiClient.get('/workSchedule');
    return response.data;
  },

  createWorkSchedule: async (payload) => {
    const response = await apiClient.post('/workSchedule', payload);
    return response.data;
  },

  updateWorkSchedule: async (id, payload) => {
    const response = await apiClient.put(`/workSchedule/${id}`, payload);
    return response.data;
  },

  deleteWorkSchedule: async (id) => {
    const response = await apiClient.delete(`/workSchedule/${id}`);
    return response.data;
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => workScheduleService.getAllWorkSchedules(),
  create: async (payload) => workScheduleService.createWorkSchedule(payload),
  update: async (id, payload) => workScheduleService.updateWorkSchedule(id, payload),
  delete: async (id) => workScheduleService.deleteWorkSchedule(id)
};
