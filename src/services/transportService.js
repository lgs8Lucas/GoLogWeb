import { apiClient } from './apiClient';

export const transportService = {
  create: async (transportData) => {
    // Viagem manual: só os vínculos. Métricas realizadas (km, tempo, rota concluída) são preenchidas
    // na execução — enviar zeros/textos aqui fazia a API rejeitar (@Positive) ou marcar a viagem como concluída.
    const payload = {
      driverId: transportData.driverId,
      transporterId: transportData.transporterId || null,
      equipamentGroupId: transportData.equipamentGroupId
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
  },

  optimizeRoutes: async ({
    shipmentIds = [],
    workScheduleIds = [],
    routePriority = 'ECONOMIA',
    profileId = null,
    kmCostMultiplier = null,
    hourCostMultiplier = null,
    fixedCostPerVehicle = null,
    penaltyCostUnserved = null,
    defaultServiceDurationSeconds = null,
    timeWindowLeadMinutes = null
  } = {}) => {
    const payload = {
      shipmentIds,
      workScheduleIds,
      routePriority,
      profileId: profileId || null,
      kmCostMultiplier: kmCostMultiplier !== undefined && kmCostMultiplier !== null && kmCostMultiplier !== '' ? parseFloat(kmCostMultiplier) : null,
      hourCostMultiplier: hourCostMultiplier !== undefined && hourCostMultiplier !== null && hourCostMultiplier !== '' ? parseFloat(hourCostMultiplier) : null,
      fixedCostPerVehicle: fixedCostPerVehicle !== undefined && fixedCostPerVehicle !== null && fixedCostPerVehicle !== '' ? parseFloat(fixedCostPerVehicle) : null,
      penaltyCostUnserved: penaltyCostUnserved !== undefined && penaltyCostUnserved !== null && penaltyCostUnserved !== '' ? parseFloat(penaltyCostUnserved) : null,
      defaultServiceDurationSeconds: defaultServiceDurationSeconds !== undefined && defaultServiceDurationSeconds !== null && defaultServiceDurationSeconds !== '' ? parseInt(defaultServiceDurationSeconds, 10) : null,
      timeWindowLeadMinutes: timeWindowLeadMinutes !== undefined && timeWindowLeadMinutes !== null && timeWindowLeadMinutes !== '' ? parseInt(timeWindowLeadMinutes, 10) : null
    };

    // Remove campos nulos para não poluir o JSON
    Object.keys(payload).forEach(key => {
      if (payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    const response = await apiClient.post('/api-route-optimization', payload);
    return response.data;
  }
};
