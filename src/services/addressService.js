import { apiClient } from './apiClient';

export const addressService = {
  getAllAddresses: async () => {
    const response = await apiClient.get('/address');
    return response.data;
  },

  getAddressById: async (id) => {
    const response = await apiClient.get(`/address/${id}`);
    return response.data;
  },

  createAddress: async (payload) => {
    const response = await apiClient.post('/address', payload);
    return response.data;
  },

  updateAddress: async (id, payload) => {
    const response = await apiClient.put(`/address/${id}`, payload);
    return response.data;
  },

  patchAddress: async (id, payload) => {
    const response = await apiClient.patch(`/address/${id}`, payload);
    return response.data;
  },

  deleteAddress: async (id) => {
    await apiClient.delete(`/address/${id}`);
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => addressService.getAllAddresses(),
  getById: async (id) => addressService.getAddressById(id),
  create: async (payload) => addressService.createAddress(payload),
  update: async (id, payload) => addressService.updateAddress(id, payload),
  patch: async (id, payload) => addressService.patchAddress(id, payload),
  delete: async (id) => addressService.deleteAddress(id)
};