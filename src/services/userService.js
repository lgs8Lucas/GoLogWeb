import { apiClient } from './apiClient';

export const userService = {
  getAllUsers: async () => {
    const response = await apiClient.get('/user');
    return response.data;
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/user/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/user', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/user/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(`/user/${id}`);
    return response.data;
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => userService.getAllUsers(),
  getById: async (id) => userService.getUserById(id),
  create: async (payload) => userService.createUser(payload),
  update: async (id, payload) => userService.updateUser(id, payload),
  delete: async (id) => userService.deleteUser(id)
};
