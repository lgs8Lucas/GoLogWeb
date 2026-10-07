import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Users, 
  Truck, 
  Package, 
  GitBranch, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  X,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { tenantService } from '../services/tenantService';
import { authService } from '../services/authService';
import { useToast } from '../components/ToastContext';
import '../styles/TenantsPage.css';

const initialFormData = {
  legalName: '',
  cnpjCpf: '',
  phoneNumber: '',
  email: '',
  companyType: 'TENANT_HEADQUARTER',
  parentCompanyId: '',
  cep: '',
  street: '',
  number: '',
  district: '',
  city: '',
  state: 'SP',
  complement: '',
  latitude: '',
  longitude: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  adminCpf: ''
};

const TenantsPage = () => {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, summaryData] = await Promise.all([
        tenantService.getAllTenants(),
        tenantService.getSummary()
      ]);
      setTenants(tenantsData || []);
      setSummary(summaryData);
    } catch (err) {
      console.error('Erro ao carregar dados de tenants:', err);
      addToast('Erro ao carregar lista de tenants. Verifique a conexão.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCepBlur = async () => {
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            district: data.bairro || prev.district,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
        }
      } catch (err) {
        console.warn('Erro ao consultar ViaCEP:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.legalName.trim() || !formData.cnpjCpf.trim() || !formData.email.trim()) {
      addToast('Preencha os campos obrigatórios da empresa.', 'warning');
      return;
    }

    if (!formData.adminEmail.trim() || !formData.adminPassword.trim() || !formData.adminName.trim()) {
      addToast('Preencha as informações do administrador inicial.', 'warning');
      return;
    }

    if (formData.companyType === 'TENANT_BRANCH' && !formData.parentCompanyId) {
      addToast('Selecione a empresa matriz para a nova filial.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        cnpjCpf: formData.cnpjCpf.replace(/\D/g, ''),
        adminCpf: formData.adminCpf.replace(/\D/g, ''),
        parentCompanyId: formData.parentCompanyId || null
      };

      await tenantService.createTenant(payload);
      addToast('Novo Tenant provisionado com sucesso!', 'success');
      setIsModalOpen(false);
      setFormData(initialFormData);
      loadData();
    } catch (err) {
      console.error('Erro ao criar tenant:', err);
      const msg = err.response?.data?.message || err.response?.data?.erro || 'Erro ao provisionar novo tenant.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchToTenant = (tenantId) => {
    authService.setSelectedTenant(tenantId);
    window.location.reload();
  };

  const filteredTenants = tenants.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.legalName?.toLowerCase().includes(q) ||
      t.cnpjCpf?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q)
    );
  });

  const headquarterTenants = tenants.filter(
    (t) => t.companyType === 'TENANT_HEADQUARTER' || t.companyType === 'TENANT_MASTER'
  );

  return (
    <div className="tenants-page-container">
      <PageHeader
        title="Gestão de Instâncias & Multi-Tenants"
        description="Painel exclusivo do GoLog Master para controle gerencial, provisionamento de novas empresas e filiais."
      >
        <button className="btn-primary-action" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Provisionar Novo Tenant</span>
        </button>
      </PageHeader>

      {/* Cards de Métricas do Master */}
      <div className="tenant-summary-grid">
        <div className="summary-card">
          <div className="card-icon tenant-color">
            <Building2 size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">Tenants Matriz</span>
            <span className="card-val">{summary ? summary.totalTenants : '...'}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon branch-color">
            <GitBranch size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">Filiais Ativas</span>
            <span className="card-val">{summary ? summary.totalBranches : '...'}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon user-color">
            <Users size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">Usuários Totais</span>
            <span className="card-val">{summary ? summary.totalUsers : '...'}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon vehicle-color">
            <Truck size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">Frota Global</span>
            <span className="card-val">{summary ? summary.totalVehicles : '...'}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon shipment-color">
            <Package size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">Remessas / Cargas</span>
            <span className="card-val">{summary ? summary.totalShipments : '...'}</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="tenants-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ, e-mail ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="tenant-count-badge">
          <span>{filteredTenants.length} tenants encontrados</span>
        </div>
      </div>

      {/* Grid de Tenants */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Carregando ecossistema de tenants...</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} className="empty-icon" />
          <h3>Nenhum tenant encontrado</h3>
          <p>Crie um novo tenant usando o botão de provisionamento acima.</p>
        </div>
      ) : (
        <div className="tenants-grid">
          {filteredTenants.map((t) => {
            const isMasterTenant = t.companyType === 'TENANT_MASTER';
            const isHeadquarter = t.companyType === 'TENANT_HEADQUARTER';
            const isBranch = t.companyType === 'TENANT_BRANCH';
            const activeTenantId = authService.getSelectedTenant();
            const isCurrentlyActive = activeTenantId === t.id;

            return (
              <div key={t.id} className={`tenant-card ${isCurrentlyActive ? 'active-tenant' : ''}`}>
                <div className="tenant-card-header">
                  <div className="tenant-title-block">
                    <span className="tenant-name">{t.legalName}</span>
                    <span className="tenant-cnpj">CNPJ/CPF: {t.cnpjCpf}</span>
                  </div>
                  <span className={`tenant-badge ${t.companyType?.toLowerCase()}`}>
                    {isMasterTenant && 'GoLog Master'}
                    {isHeadquarter && 'Matriz'}
                    {isBranch && 'Filial'}
                  </span>
                </div>

                <div className="tenant-card-body">
                  {t.parentCompanyName && (
                    <div className="tenant-meta-item">
                      <GitBranch size={15} />
                      <span>Matriz: <strong>{t.parentCompanyName}</strong></span>
                    </div>
                  )}

                  <div className="tenant-meta-item">
                    <MapPin size={15} />
                    <span>{t.city ? `${t.city} - ${t.state || 'BR'}` : 'Endereço não informado'}</span>
                  </div>

                  <div className="tenant-meta-item">
                    <Phone size={15} />
                    <span>{t.phoneNumber || 'Sem telefone'}</span>
                  </div>

                  <div className="tenant-meta-item">
                    <Mail size={15} />
                    <span>{t.email || 'Sem e-mail'}</span>
                  </div>

                  {isHeadquarter && (
                    <div className="tenant-meta-item branches-highlight">
                      <GitBranch size={15} />
                      <span>{t.branchCount} filial(is) vinculada(s)</span>
                    </div>
                  )}
                </div>

                <div className="tenant-card-footer">
                  <button
                    className={`btn-switch-tenant ${isCurrentlyActive ? 'active' : ''}`}
                    onClick={() => handleSwitchToTenant(t.id)}
                    title="Alternar contexto para visualizar esta empresa"
                  >
                    {isCurrentlyActive ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Visualizando Agora</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink size={16} />
                        <span>Acessar Tenant</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Provisionamento de Novo Tenant */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box tenant-modal">
            <div className="modal-header">
              <div className="modal-title-row">
                <Building2 size={22} className="modal-title-icon" />
                <h3>Provisionar Novo Tenant</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="tenant-form">
              <div className="form-scrollable-content">
                {/* SEÇÃO 1: Dados da Empresa */}
                <div className="form-section">
                  <h4 className="section-title">
                    <Building2 size={16} />
                    <span>1. Dados Cadastrais da Empresa</span>
                  </h4>
                  
                  <div className="form-grid-2">
                    <div className="form-group col-span-2">
                      <label>Razão Social / Nome Fantasia *</label>
                      <input
                        type="text"
                        name="legalName"
                        value={formData.legalName}
                        onChange={handleInputChange}
                        placeholder="Ex: Coca-Cola FEMSA Brasil"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>CNPJ ou CPF (somente números) *</label>
                      <input
                        type="text"
                        name="cnpjCpf"
                        value={formData.cnpjCpf}
                        onChange={handleInputChange}
                        placeholder="Ex: 12345678000195"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Tipo de Tenant *</label>
                      <select
                        name="companyType"
                        value={formData.companyType}
                        onChange={handleInputChange}
                      >
                        <option value="TENANT_HEADQUARTER">Matriz (Grupo Econômico)</option>
                        <option value="TENANT_BRANCH">Filial (Subordinada a uma Matriz)</option>
                      </select>
                    </div>

                    {formData.companyType === 'TENANT_BRANCH' && (
                      <div className="form-group col-span-2 highlight-group">
                        <label>Vincular à Empresa Matriz *</label>
                        <select
                          name="parentCompanyId"
                          value={formData.parentCompanyId}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Selecione a Matriz...</option>
                          {headquarterTenants.map((hq) => (
                            <option key={hq.id} value={hq.id}>
                              {hq.legalName} ({hq.cnpjCpf})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Telefone Corporativo *</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Ex: (11)999998888"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>E-mail Corporativo *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contato@empresa.com.br"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 2: Endereço da Unidade */}
                <div className="form-section">
                  <h4 className="section-title">
                    <MapPin size={16} />
                    <span>2. Endereço da Unidade</span>
                  </h4>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>CEP (8 dígitos) *</label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleInputChange}
                        onBlur={handleCepBlur}
                        placeholder="13600000"
                        required
                      />
                    </div>

                    <div className="form-group col-span-2">
                      <label>Logradouro / Rua *</label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder="Ex: Av. das Indústrias"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Número *</label>
                      <input
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        placeholder="1000"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Bairro</label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        placeholder="Distrito Industrial"
                      />
                    </div>

                    <div className="form-group">
                      <label>Cidade / UF</label>
                      <div className="city-state-row">
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Cidade"
                        />
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="UF"
                          style={{ width: '60px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 3: Primeiro Usuário Administrador */}
                <div className="form-section">
                  <h4 className="section-title">
                    <ShieldCheck size={16} />
                    <span>3. Primeiro Administrador do Tenant</span>
                  </h4>
                  <p className="section-hint">
                    Este usuário terá acesso com perfil <strong>ADMIN</strong> para configurar frotas, motoristas e regras deste tenant.
                  </p>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Nome Completo do Admin *</label>
                      <input
                        type="text"
                        name="adminName"
                        value={formData.adminName}
                        onChange={handleInputChange}
                        placeholder="Ex: João da Silva"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>CPF do Admin (11 dígitos) *</label>
                      <input
                        type="text"
                        name="adminCpf"
                        value={formData.adminCpf}
                        onChange={handleInputChange}
                        placeholder="Ex: 12345678901"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>E-mail de Login do Admin *</label>
                      <input
                        type="email"
                        name="adminEmail"
                        value={formData.adminEmail}
                        onChange={handleInputChange}
                        placeholder="admin@empresa.com.br"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Senha Inicial de Acesso *</label>
                      <input
                        type="password"
                        name="adminPassword"
                        value={formData.adminPassword}
                        onChange={handleInputChange}
                        placeholder="Senha segura..."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Provisionando...' : 'Confirmar & Criar Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsPage;
