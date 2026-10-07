import { apiClient } from './apiClient';

export const telemetryService = {
  createTelemetry: async (payload) => {
    const response = await apiClient.post('/telemetry', payload);
    return response.data;
  },

  /**
   * Envia lote de telemetrias para o Gateway de Ingestão de Alta Performance.
   * Utiliza cache de placas em memória e dispara detecção de geofencing de paradas.
   * @param {Array} items Lista de itens de telemetria [{ plate, latitude, longitude, speed, dateTime, alert, device, data1, data2 }]
   */
  sendBatch: async (items) => {
    const response = await apiClient.post('/api/v1/telemetry/batch', { items });
    return response.data;
  },

  getTelemetryById: async (id) => {
    const response = await apiClient.get(`/telemetry/${id}`);
    return response.data;
  },

  updateTelemetry: async (payload) => {
    const response = await apiClient.put('/telemetry', null, { params: { telemetryCreateRequest: payload } });
    return response.data;
  },

  patchTelemetry: async (id, payload) => {
    const response = await apiClient.patch(`/telemetry/${id}`, null, { params: { telemetryUpdateRequest: payload } });
    return response.data;
  },

  deleteTelemetry: async (id) => {
    const response = await apiClient.delete(`/telemetry/${id}`);
    return response.data;
  },

  getAllTelemetry: async () => {
    const response = await apiClient.get('/telemetry');
    return response.data;
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => telemetryService.getAllTelemetry(),
  getById: async (id) => telemetryService.getTelemetryById(id),
  create: async (payload) => telemetryService.createTelemetry(payload),
  update: async (payload) => telemetryService.updateTelemetry(payload),
  patch: async (id, payload) => telemetryService.patchTelemetry(id, payload),
  delete: async (id) => telemetryService.deleteTelemetry(id)
};
