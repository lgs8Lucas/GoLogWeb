import { apiClient } from './apiClient';

export const telemetryService = {
  createTelemetry: async (payload) => {
    const response = await apiClient.post('/telemetry', payload);
    return response.data;
  },

  getTelemetryById: async (id) => {
    const response = await apiClient.get(`/telemetry/${id}`);
    return response.data;
  },

  updateTelemetry: async (payload) => {
    // The OpenAPI spec maps PUT /telemetry to accept telemetryCreateRequest as a query param.
    const response = await apiClient.put('/telemetry', null, { params: { telemetryCreateRequest: payload } });
    return response.data;
  },

  patchTelemetry: async (id, payload) => {
    // The OpenAPI spec maps PATCH /telemetry/{id} with telemetryUpdateRequest as query param.
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
