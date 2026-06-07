import { apiClient } from './apiClient';

export const transportService = {
  create: async (transportData) => {
    const payload = {
      driverId: transportData.driverId,
      transporterId: transportData.transporterId,
      equipamentGroupId: transportData.equipamentGroupId,
      routeCompleted: transportData.routeReturnCompleted || 'Ainda não concluída',
      routePlanned: transportData.routeReturnPlanned || 'Rota de Retorno Padrão',
      deliveryQuantity: parseInt(transportData.deliveryQuantity || 0, 10),
      distanceTraveled: parseInt(transportData.totalKilometer || transportData.distanceTraveled || 0, 10),
      timeStopped: parseFloat(transportData.timeStopped || 0.0),
      totalTime: parseFloat(transportData.totalTime || 0.0)
    };
    const response = await apiClient.post('/transport', payload);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/transport');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/transport/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/transport/${id}`, data);
    return response.data;
  },

  patch: async (id, data) => {
    const response = await apiClient.patch(`/transport/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/transport/${id}`);
    return response.data;
  }
};
