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
  }
};
