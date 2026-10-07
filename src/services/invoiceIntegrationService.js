import { apiClient } from './apiClient';

export const invoiceIntegrationService = {
  /**
   * Importa um ou mais arquivos XML de NF-e da SEFAZ para criação em lote de Remessas.
   * @param {FileList|File[]} files
   */
  importXmlFiles: async (files) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const response = await apiClient.post('/api/v1/integration/invoices/xml', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Envia XML puro como string para importação de NF-e.
   * @param {string} xmlContent
   */
  importXmlText: async (xmlContent) => {
    const response = await apiClient.post('/api/v1/integration/invoices/xml-text', xmlContent, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    return response.data;
  },

  /**
   * Importa lote de faturas / pedidos via JSON (formato padrão de ERPs e WMS).
   * @param {Array} invoices
   */
  importJsonBatch: async (invoices) => {
    const response = await apiClient.post('/api/v1/integration/invoices/json', { invoices });
    return response.data;
  },

  /**
   * Faz o preview / validação de um arquivo XML sem salvar no banco.
   * @param {File} file
   */
  parseXmlOnly: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/v1/integration/invoices/parse-xml', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
