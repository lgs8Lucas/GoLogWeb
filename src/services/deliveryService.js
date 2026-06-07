import { apiClient } from './apiClient';

export const deliveryService = {
  create: async (deliveryData) => {
    // Translate frontend DeliveryModal properties to the backend's ShipmentCreateRequest schema
    const payload = {
      typeOperation: deliveryData.typeOperation || 'ENTREGA',
      weight: parseFloat(deliveryData.weight || 0.0),
      volume: parseFloat(deliveryData.volume || 0.0),
      // Handle the backend's 'schedulind' property typo
      schedulind: deliveryData.scheduledDelivery || deliveryData.scheduledCollection || new Date().toISOString(),
      status: deliveryData.status || 'PENDING',
      userId: deliveryData.userId,
      shipmentTypeId: deliveryData.deliveryTypeId,
      typeTransportId: deliveryData.typeTransportId,
      // Map destination address to addressId
      addressId: deliveryData.destinationAddressId || deliveryData.originAdrressId,
      // Map customer delivery to customerId
      customerId: deliveryData.customerDeliveryId || deliveryData.customerCollectsId,
      operationOrigemId: deliveryData.operationOrigemId || null,
      transportId: deliveryData.transportId || null
    };

    // The backend POST endpoint is /shipment
    const response = await apiClient.post('/shipment', payload);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/shipment');
    return response.data;
  },

  getAllPersonalized: async () => {
    const response = await apiClient.get('/shipment/list-personalized');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/shipment/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/shipment/${id}`, data);
    return response.data;
  },

  patch: async (id, data) => {
    const response = await apiClient.patch(`/shipment/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/shipment/${id}`);
    return response.data;
  }
};
