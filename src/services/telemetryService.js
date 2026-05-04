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
    // However, typical REST would use requestBody. Based on spec:
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
  }
};
