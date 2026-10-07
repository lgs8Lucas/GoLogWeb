import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Building2, Plus, Save, X, Globe, RefreshCw, Radio } from 'lucide-react';
import { companyService } from '../services/companyService';
import { addressService } from '../services/addressService';
import { authService } from '../services/authService';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const CompanyPage = () => {
  const [searchParams] = useSearchParams();
  const editParamId = searchParams.get('edit');
  const userRole = authService.getUserRole();
  const isOperator = userRole === 'OPERATOR';
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  const initialFormState = {
    legalName: '',
    cnpjCpf: '',
    email: '',
    phoneNumber: '',
    isCliente: true,
    cep: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    country: 'Brasil',
    complement: '',
    webhookUrl: '',
    webhookSecret: '',
    webhookActive: true
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [editParamId]);

  const handleEditClick = (company) => {
    setEditingId(company.id);
    const addr = company.address || {};
    setEditingAddressId(addr.id || null);

    setFormData({
      legalName: company.legalName || '',
      cnpjCpf: company.cnpjCpf || '',
      email: company.email || '',
      phoneNumber: company.phoneNumber || '',
      isCliente: company.isCliente ?? true,
      cep: addr.cep || '',
      street: addr.street || '',
      number: addr.number || '',
      district: addr.district || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || 'Brasil',
      complement: addr.complement || '',
      webhookUrl: company.webhookUrl || '',
      webhookSecret: company.webhookSecret || '',
      webhookActive: company.webhookActive ?? true
    });
    setIsModalOpen(true);
  };
  const handleEdit = handleEditClick;

  const handleTestWebhook = async () => {
    if (!formData.webhookUrl) {
      showToast('Informe a URL do webhook para testar.', 'error');
      return;
    }
    setTestingWebhook(true);
    try {
      const res = await companyService.testWebhookUrl({
        webhookUrl: formData.webhookUrl,
        webhookSecret: formData.webhookSecret,
        webhookActive: formData.webhookActive
      });
      if (res.success) {
        showToast(`Webhook respondeu com sucesso! HTTP ${res.statusCode} (${res.latencyMs}ms)`, 'success');
      } else {
        showToast(`Falha no webhook: ${res.message} (${res.latencyMs}ms)`, 'error');
      }
    } catch (err) {
      console.error('Erro ao testar webhook:', err);
      showToast('Erro ao disparar teste de webhook.', 'error');
    } finally {
      setTestingWebhook(false);
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await companyService.getAllCompanies();
      setCompanies(data || []);

      if (editParamId && data && data.length > 0) {
        const target = data.find(c => c.id === editParamId);
        if (target) {
          handleEditClick(target);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      showToast('Erro ao carregar lista de empresas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (name === 'isCliente') {
      val = value === 'true' || value === true;
    }
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            district: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let addressId = editingAddressId;

      const addressPayload = {
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        district: formData.district,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        complement: formData.complement,
        latitude: "-23.550520",
        longitude: "-46.633308"
      };

      if (editingId && addressId) {
        await addressService.updateAddress(addressId, addressPayload);
      } else {
        const newAddress = await addressService.createAddress(addressPayload);
        addressId = newAddress.id;
      }

      const companyPayload = {
        legalName: formData.legalName,
        cnpjCpf: formData.cnpjCpf,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        isCliente: formData.isCliente,
        addressId: addressId
      };

      if (editingId) {
        await companyService.updateCompany(editingId, companyPayload);
        try {
          await companyService.updateWebhook(editingId, {
            webhookUrl: formData.webhookUrl,
            webhookSecret: formData.webhookSecret,
            webhookActive: formData.webhookActive
          });
        } catch (webhookErr) {
          console.error("Erro ao salvar webhook:", webhookErr);
        }
        showToast(`${isOperator ? 'Cliente' : 'Empresa'} atualizada com sucesso.`, 'success');
      } else {
        const created = await companyService.createCompany(companyPayload);
        if (created?.id && formData.webhookUrl) {
          try {
            await companyService.updateWebhook(created.id, {
              webhookUrl: formData.webhookUrl,
              webhookSecret: formData.webhookSecret,
              webhookActive: formData.webhookActive
            });
          } catch (webhookErr) {
            console.error("Erro ao salvar webhook:", webhookErr);
          }
        }
        showToast(`${isOperator ? 'Cliente' : 'Empresa'} cadastrada com sucesso.`, 'success');
      }

      handleCloseModal();
      fetchCompanies();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showToast(error.response?.data?.message || 'Falha ao salvar dados.', 'error');
    }
  };


  const handleDelete = (company) => {
    setCompanyToDelete(company);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    try {
      await companyService.deleteCompany(companyToDelete.id);
      showToast(`${isOperator ? 'Cliente' : 'Empresa'} excluída com sucesso.`, 'success');
      fetchCompanies();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      showToast('Falha ao excluir o registro.', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setEditingAddressId(null);
    setFormData(initialFormState);
  };

  const companyColumns = [
    { 
      label: 'Razão Social / Nome', 
      key: 'legalName',
      render: (row) => (
        <span 
          style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary-color)' }}
          onClick={() => handleEditClick(row)}
          title="Clique para editar este registro"
        >
          {row.legalName}
        </span>
      )
    },
    { label: 'CNPJ / CPF', key: 'cnpjCpf' },
    { label: 'E-mail', key: 'email' },
    { label: 'Telefone', key: 'phoneNumber' },
    { 
      label: 'Tipo / Classificação', 
      key: 'companyType',
      render: (row) => {
        if (row.companyType === 'TENANT_MASTER' || row.isMaster) {
          return <span className="status-chip danger">GoLog Master</span>;
        }
        if (row.companyType === 'TENANT_HEADQUARTER') {
          return <span className="status-chip active">Matriz (Tenant)</span>;
        }
        if (row.companyType === 'TENANT_BRANCH') {
          return <span className="status-chip warning">Filial</span>;
        }
        if (row.isCliente || row.companyType === 'CLIENT') {
          return <span className="status-chip info">Cliente</span>;
        }
        return <span className="status-chip info">Fornecedor</span>;
      }
    },
    { 
      label: 'Cidade / UF', 
      key: 'address',
      render: (row) => row.address ? `${row.address.city || '-'} (${row.address.state || '-'})` : '-'
    },
    {
      label: 'Webhook ERP',
      key: 'webhookUrl',
      render: (row) => row.webhookUrl ? (
        <span className={`status-chip ${row.webhookActive ? 'active' : 'warning'}`} title={row.webhookUrl}>
          <Radio size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {row.webhookActive ? 'Ativo' : 'Pausado'}
        </span>
      ) : (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
      )
    }
  ];

  const companyFilterConfigs = isOperator ? [
    { 
      key: 'city', 
      label: 'Cidade', 
      accessor: (row) => row.address?.city || '' 
    }
  ] : [
    { 
      key: 'tipo', 
      label: 'Classificação',
      options: [
        { label: 'Matriz (Tenant)', value: 'TENANT_HEADQUARTER' },
        { label: 'Filial (Tenant)', value: 'TENANT_BRANCH' },
        { label: 'Cliente / Destinatário', value: 'CLIENTE' },
        { label: 'Fornecedor / Parceiro', value: 'FORNECEDOR' },
        { label: 'GoLog Master', value: 'TENANT_MASTER' }
      ],
      accessor: (row) => {
        if (row.companyType === 'TENANT_MASTER' || row.isMaster) return 'TENANT_MASTER';
        if (row.companyType === 'TENANT_HEADQUARTER') return 'TENANT_HEADQUARTER';
        if (row.companyType === 'TENANT_BRANCH') return 'TENANT_BRANCH';
        if (row.isCliente || row.companyType === 'CLIENT') return 'CLIENTE';
        return 'FORNECEDOR';
      }
    },
    { 
      key: 'city', 
      label: 'Cidade', 
      accessor: (row) => row.address?.city || '' 
    }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title={isOperator ? 'Clientes' : 'Empresas & Clientes'}
        description={`Cadastro e gerenciamento de ${isOperator ? 'clientes e destinatários' : 'empresas parceiras, transportadoras e clientes'}.`}
        icon={Building2}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo {isOperator ? 'Cliente' : 'Registro'}
        </button>
      </PageHeader>

      <div className="card">
        <DataTable 
          columns={companyColumns}
          data={companies}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          itemsPerPage={12}
          filterConfigs={companyFilterConfigs}
          searchPlaceholder="Pesquisar por razão social, CNPJ, e-mail ou cidade..."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={22} color="var(--primary-color)" />
                {editingId ? `Editar ${isOperator ? 'Cliente' : 'Empresa'}` : `Nova ${isOperator ? 'Cliente' : 'Empresa'}`}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  
                  <div className="form-group">
                    <label className="form-label">Razão Social / Nome</label>
                    <input 
                      type="text" 
                      name="legalName" 
                      value={formData.legalName} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CNPJ ou CPF</label>
                    <input 
                      type="text" 
                      name="cnpjCpf" 
                      value={formData.cnpjCpf} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">E-mail de Contato</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone / Celular</label>
                    <input 
                      type="text" 
                      name="phoneNumber" 
                      value={formData.phoneNumber} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  {!isOperator && (
                    <div className="form-group">
                      <label className="form-label">Tipo de Cadastro</label>
                      <select 
                        name="isCliente" 
                        value={formData.isCliente} 
                        onChange={handleInputChange} 
                        className="form-select"
                      >
                        <option value="true">Cliente / Destinatário</option>
                        <option value="false">Transportadora / Parceira</option>
                      </select>
                    </div>
                  )}

                  {/* Endereço */}
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.85rem' }}>Endereço Corporativo</h3>
                  </div>

                  <div className="form-group">
                    <label className="form-label">CEP</label>
                    <input 
                      type="text" 
                      name="cep" 
                      value={formData.cep} 
                      onChange={handleInputChange} 
                      onBlur={handleCepBlur} 
                      className="form-input" 
                      placeholder="00000-000" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Logradouro / Rua</label>
                    <input 
                      type="text" 
                      name="street" 
                      value={formData.street} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Número</label>
                    <input 
                      type="text" 
                      name="number" 
                      value={formData.number} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bairro</label>
                    <input 
                      type="text" 
                      name="district" 
                      value={formData.district} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cidade</label>
                    <input 
                      type="text" 
                      name="city" 
                      value={formData.city} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado (UF)</label>
                    <input 
                      type="text" 
                      name="state" 
                      value={formData.state} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      maxLength="2" 
                      required 
                    />
                  </div>

                  {/* Integração ERP & Webhooks */}
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={18} /> Integração ERP / WMS & Webhooks
                      </h3>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="webhookActive"
                          checked={formData.webhookActive}
                          onChange={handleInputChange}
                        />
                        Webhook Ativo
                      </label>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0' }}>
                      Receba notificações HTTP POST em tempo real com assinatura HMAC SHA-256 para eventos de remessas e geofencing.
                    </p>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">URL do Webhook (Endpoint do ERP)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="url" 
                        name="webhookUrl" 
                        value={formData.webhookUrl} 
                        onChange={handleInputChange} 
                        className="form-input" 
                        placeholder="https://erp.empresa.com.br/api/golog/webhook"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testingWebhook || !formData.webhookUrl}
                        className="btn btn-outline"
                        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {testingWebhook ? <RefreshCw size={14} className="spin" /> : <Radio size={14} />}
                        Testar Ping
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Secret do Webhook (Assinatura HMAC SHA-256)</label>
                    <input 
                      type="password" 
                      name="webhookSecret" 
                      value={formData.webhookSecret} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="Chave secreta para validação de X-GoLog-Signature"
                    />
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> {editingId ? 'Atualizar Dados' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Cadastro"
        message={`Deseja realmente excluir o cadastro de ${companyToDelete?.legalName}?`}
      />
    </div>
  );
};

export default CompanyPage;
