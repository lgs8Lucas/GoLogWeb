import { apiClient } from './apiClient';

export const companyService = {
  getAllCompanies: async () => {
    const response = await apiClient.get('/company');
    return response.data;
  },

  getCompanyById: async (id) => {
    const response = await apiClient.get(`/company/${id}`);
    return response.data;
  },

  createCompany: async (payload) => {
    const response = await apiClient.post('/company', payload);
    return response.data;
  },

  updateCompany: async (id, payload) => {
    const response = await apiClient.put(`/company/${id}`, payload);
    return response.data;
  },

  patchCompany: async (id, payload) => {
    const response = await apiClient.patch(`/company/${id}`, payload);
    return response.data;
  },

  deleteCompany: async (id) => {
    await apiClient.delete(`/company/${id}`);
  },

  /**
   * Atualiza as configurações de Webhook (URL de callback e segredo HMAC) da empresa.
   */
  updateWebhook: async (id, payload) => {
    const response = await apiClient.patch(`/company/${id}/webhook`, payload);
    return response.data;
  },

  /**
   * Dispara um teste de webhook contra a URL salva na empresa.
   */
  testWebhook: async (id) => {
    const response = await apiClient.post(`/company/${id}/webhook/test`);
    return response.data;
  },

  /**
   * Testa qualquer URL de webhook antes de salvar.
   */
  testWebhookUrl: async (payload) => {
    const response = await apiClient.post('/company/webhook/test-url', payload);
    return response.data;
  },

  // Standard generic REST aliases for compatibility
  getAll: async () => companyService.getAllCompanies(),
  getById: async (id) => companyService.getCompanyById(id),
  create: async (payload) => companyService.createCompany(payload),
  update: async (id, payload) => companyService.updateCompany(id, payload),
  patch: async (id, payload) => companyService.patchCompany(id, payload),
  delete: async (id) => companyService.deleteCompany(id)
};
