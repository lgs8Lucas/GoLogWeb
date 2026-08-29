import { apiClient } from './apiClient';

// Translate frontend DeliveryModal properties to the backend's ShipmentCreateRequest schema.
// typeOperation drives whether the relevant point is the collection origin (COLETA) or the delivery destination (ENTREGA)
const buildShipmentPayload = (deliveryData) => {
  const typeOperation = deliveryData.typeOperation || 'ENTREGA';
  const isColeta = typeOperation === 'COLETA';

  return {
    typeOperation,
    weight: parseFloat(deliveryData.weight || 0.0),
    volume: parseFloat(deliveryData.volume || 0.0),
    // Handle the backend's 'schedulind' property typo
    schedulind: (isColeta ? deliveryData.scheduledCollection : deliveryData.scheduledDelivery)
      || deliveryData.scheduledDelivery || deliveryData.scheduledCollection || new Date().toISOString(),
    status: deliveryData.status || 'PENDING',
    userId: deliveryData.userId,
    shipmentTypeId: deliveryData.deliveryTypeId,
    typeTransportId: deliveryData.typeTransportId,
    // For COLETA use the origin address/customer, for ENTREGA use the destination ones
    addressId: isColeta
      ? (deliveryData.originAdrressId || deliveryData.destinationAddressId)
      : (deliveryData.destinationAddressId || deliveryData.originAdrressId),
    customerId: isColeta
      ? (deliveryData.customerCollectsId || deliveryData.customerDeliveryId)
      : (deliveryData.customerDeliveryId || deliveryData.customerCollectsId),
    // Only an ENTREGA can point back to the COLETA that originated it
    operationOrigemId: isColeta ? null : (deliveryData.operationOrigemId || null),
    transportId: deliveryData.transportId || null
  };
};

export const deliveryService = {
  buildShipmentPayload,

  create: async (deliveryData) => {
    const response = await apiClient.post('/shipment', buildShipmentPayload(deliveryData));
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

  // GET /shipment/list-by-status — status: PENDENTE | AGUARDANDO_INICIO | INICIADO | FINALIZADO
  getByStatus: async (status) => {
    const response = await apiClient.get('/shipment/list-by-status', { params: { status } });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/shipment/${id}`);
    return response.data;
  },

  update: async (id, deliveryData) => {
    // PUT /shipment/{id} expects the same ShipmentCreateRequest schema as create
    const response = await apiClient.put(`/shipment/${id}`, buildShipmentPayload(deliveryData));
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
