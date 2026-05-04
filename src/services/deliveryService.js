import axios from 'axios';

const API_URL = 'http://localhost:8081';

export const deliveryService = {
  create: async (deliveryData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/delivery`, deliveryData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },
  
  // TODO: Add getAll, getById, update, delete when available
};
