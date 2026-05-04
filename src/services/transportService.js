import axios from 'axios';

const API_URL = 'http://localhost:8081';

export const transportService = {
  create: async (transportData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/transport`, transportData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },
  
  // TODO: Add getAll, getById, update, delete when available
};
