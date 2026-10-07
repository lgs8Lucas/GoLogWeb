import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  Sliders,
  Plus,
  Save,
  X,
  Layers,
  ShieldAlert,
  CheckCircle2,
  Building2,
  Tags,
  PackageCheck
} from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastContext';
import { optimizationProfileService } from '../services/optimizationProfileService';
import { demandTypeService } from '../services/demandTypeService';
import { visitTypeService } from '../services/visitTypeService';
import { typeTransportService } from '../services/typeTransportService';
import { shipmentTypeService } from '../services/shipmentTypeService';
import { companyService } from '../services/companyService';
import { translateRuleType } from '../utils/enumTranslations';
import '../styles/OptimizationRules.css';

const OptimizationRulesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profiles';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Estados de Perfis
  const [profiles, setProfiles] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const initialProfileForm = {
    name: '',
    description: '',
    isDefault: false,
    kmCostMultiplier: 1.0,
    hourCostMultiplier: 1.0,
    fixedCostPerVehicle: 0.0,
    costPerTraveledHour: 0.0,
    penaltyCostUnserved: 100000.0,
    lateArrivalCostPerHour: 0.0,
    defaultServiceDurationSeconds: 1800,
    timeWindowLeadMinutes: 15,
    vehicleStartWindowLeadHours: 2,
    vehicleEndWindowMarginHours: 2,
    globalHorizonExtraDays: 2
  };
  const [profileForm, setProfileForm] = useState(initialProfileForm);

  // Estados de Demandas
  const [demandTypes, setDemandTypes] = useState([]);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [editingDemandId, setEditingDemandId] = useState(null);
  const initialDemandForm = {
    code: '',
    name: '',
    unit: '',
    description: ''
  };
  const [demandForm, setDemandForm] = useState(initialDemandForm);

  // Estados de Tipos de Transporte (Legado / Integrado)
  const [transportTypes, setTransportTypes] = useState([]);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [editingTransportId, setEditingTransportId] = useState(null);
  const initialTransportForm = {
    name: '',
    description: '',
    care: ''
  };
  const [transportForm, setTransportForm] = useState(initialTransportForm);

  // Estados de Tipos de Carga (Legado / Integrado)
  const [shipmentTypesList, setShipmentTypesList] = useState([]);
  const [isShipmentTypeModalOpen, setIsShipmentTypeModalOpen] = useState(false);
  const [editingShipmentTypeId, setEditingShipmentTypeId] = useState(null);
  const initialShipmentTypeForm = {
    name: '',
    description: '',
    care: ''
  };
  const [shipmentTypeForm, setShipmentTypeForm] = useState(initialShipmentTypeForm);

  // Estados de Regras de Morfologia
  const [rules, setRules] = useState([]);
  const [visitTypes, setVisitTypes] = useState([]);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const initialRuleForm = {
    name: '',
    description: '',
    ruleType: 'INCOMPATIBLE_ON_SAME_VEHICLE',
    visitType1Id: '',
    visitType2Id: ''
  };
  const [ruleForm, setRuleForm] = useState(initialRuleForm);

  // Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'profile' | 'demand' | 'rule' | 'transport' | 'shipmentType'

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      loadTabData();
    }
  }, [selectedCompanyId, activeTab]);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAllCompanies();
      setCompanies(data || []);
      if (data && data.length > 0) {
        setSelectedCompanyId(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
      showToast('Erro ao carregar lista de empresas.', 'error');
    }
  };

  const loadTabData = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      if (activeTab === 'profiles') {
        const data = await optimizationProfileService.getAllByCompany(selectedCompanyId);
        setProfiles(data || []);
      } else if (activeTab === 'demands') {
        const data = await demandTypeService.getAvailableForCompany(selectedCompanyId);
        setDemandTypes(data || []);
      } else if (activeTab === 'transports') {
        const data = await typeTransportService.getAll();
        setTransportTypes(data || []);
      } else if (activeTab === 'shipments') {
        const data = await shipmentTypeService.getAll();
        setShipmentTypesList(data || []);
      } else if (activeTab === 'morphology') {
        const [rulesData, typesData] = await Promise.all([
          visitTypeService.getRulesByCompany(selectedCompanyId),
          visitTypeService.getAvailableForCompany(selectedCompanyId)
        ]);
        setRules(rulesData || []);
        setVisitTypes(typesData || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      showToast('Erro ao buscar dados da aba selecionada.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Profile Handlers
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...profileForm,
        companyId: selectedCompanyId,
        kmCostMultiplier: parseFloat(profileForm.kmCostMultiplier) || 1.0,
        hourCostMultiplier: parseFloat(profileForm.hourCostMultiplier) || 1.0,
        fixedCostPerVehicle: parseFloat(profileForm.fixedCostPerVehicle) || 0.0,
        costPerTraveledHour: parseFloat(profileForm.costPerTraveledHour) || 0.0,
        penaltyCostUnserved: parseFloat(profileForm.penaltyCostUnserved) || 100000.0,
        defaultServiceDurationSeconds: parseInt(profileForm.defaultServiceDurationSeconds, 10) || 1800,
        timeWindowLeadMinutes: parseInt(profileForm.timeWindowLeadMinutes, 10) || 15
      };

      if (editingProfileId) {
        await optimizationProfileService.update(editingProfileId, payload);
        showToast('Perfil atualizado com sucesso!', 'success');
      } else {
        await optimizationProfileService.create(payload);
        showToast('Perfil criado com sucesso!', 'success');
      }
      setIsProfileModalOpen(false);
      setEditingProfileId(null);
      loadTabData();
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      showToast('Erro ao salvar perfil de otimização.', 'error');
    }
  };

  // Demand Handlers
  const handleSaveDemand = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...demandForm,
        companyId: selectedCompanyId,
        code: demandForm.code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      };

      if (editingDemandId) {
        await demandTypeService.update(editingDemandId, {
          name: demandForm.name,
          unit: demandForm.unit,
          description: demandForm.description
        });
        showToast('Demanda atualizada com sucesso!', 'success');
      } else {
        await demandTypeService.create(payload);
        showToast('Tipo de demanda cadastrado com sucesso!', 'success');
      }
      setIsDemandModalOpen(false);
      setEditingDemandId(null);
      loadTabData();
    } catch (err) {
      console.error('Erro ao salvar tipo de demanda:', err);
      showToast('Erro ao salvar tipo de demanda.', 'error');
    }
  };

  // Transport Type Handlers
  const handleSaveTransport = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...transportForm,
        name: transportForm.name.toUpperCase().replace(/[^A-Z ]/g, '')
      };
      if (editingTransportId) {
        await typeTransportService.update(editingTransportId, payload);
        showToast('Tipo de transporte atualizado com sucesso!', 'success');
      } else {
        await typeTransportService.create(payload);
        showToast('Tipo de transporte cadastrado com sucesso!', 'success');
      }
      setIsTransportModalOpen(false);
      setEditingTransportId(null);
      loadTabData();
    } catch (err) {
      console.error('Erro ao salvar tipo de transporte:', err);
      showToast('Erro ao salvar tipo de transporte.', 'error');
    }
  };

  // Shipment Type Handlers
  const handleSaveShipmentType = async (e) => {
    e.preventDefault();
    try {
      if (editingShipmentTypeId) {
        await shipmentTypeService.update(editingShipmentTypeId, shipmentTypeForm);
        showToast('Tipo de carga atualizado com sucesso!', 'success');
      } else {
        await shipmentTypeService.create(shipmentTypeForm);
        showToast('Tipo de carga cadastrado com sucesso!', 'success');
      }
      setIsShipmentTypeModalOpen(false);
      setEditingShipmentTypeId(null);
      loadTabData();
    } catch (err) {
      console.error('Erro ao salvar tipo de carga:', err);
      showToast('Erro ao salvar tipo de carga.', 'error');
    }
  };

  // Rule Handlers
  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...ruleForm,
        companyId: selectedCompanyId
      };
      await visitTypeService.createRule(payload);
      showToast('Regra de morfologia criada com sucesso!', 'success');
      setIsRuleModalOpen(false);
      loadTabData();
    } catch (err) {
      console.error('Erro ao salvar regra:', err);
      showToast('Erro ao salvar regra de morfologia.', 'error');
    }
  };

  // Delete Actions
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (deleteType === 'profile') {
        await optimizationProfileService.delete(itemToDelete.id);
        showToast('Perfil excluído com sucesso!', 'success');
      } else if (deleteType === 'demand') {
        await demandTypeService.delete(itemToDelete.id);
        showToast('Demanda excluída com sucesso!', 'success');
      } else if (deleteType === 'transport') {
        await typeTransportService.delete(itemToDelete.id);
        showToast('Tipo de transporte excluído com sucesso!', 'success');
      } else if (deleteType === 'shipmentType') {
        await shipmentTypeService.delete(itemToDelete.id);
        showToast('Tipo de carga excluído com sucesso!', 'success');
      } else if (deleteType === 'rule') {
        await visitTypeService.deleteRule(itemToDelete.id);
        showToast('Regra excluída com sucesso!', 'success');
      }
      loadTabData();
    } catch (err) {
      console.error('Erro ao deletar item:', err);
      showToast('Falha ao excluir o registro selecionado.', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="fade-in opt-rules-page">
      <PageHeader
        title="Regras, Custos & Morfologia de Rota"
        description="Central unificada de parâmetros do motor de cálculo, capacidades multi-dimensionais, tipos de carga e restrições de compatibilidade."
        icon={Sliders}
      />

      <div className="opt-company-bar">
        <div className="opt-company-select">
          <Building2 size={20} color="var(--primary-color)" />
          <label style={{ fontWeight: 700, color: 'var(--primary-color)' }}>Empresa / Operação:</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.legalName || c.name || `Empresa #${c.id.substring(0, 8)}`}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            if (activeTab === 'profiles') {
              setProfileForm(initialProfileForm);
              setEditingProfileId(null);
              setIsProfileModalOpen(true);
            } else if (activeTab === 'demands') {
              setDemandForm(initialDemandForm);
              setEditingDemandId(null);
              setIsDemandModalOpen(true);
            } else if (activeTab === 'transports') {
              setTransportForm(initialTransportForm);
              setEditingTransportId(null);
              setIsTransportModalOpen(true);
            } else if (activeTab === 'shipments') {
              setShipmentTypeForm(initialShipmentTypeForm);
              setEditingShipmentTypeId(null);
              setIsShipmentTypeModalOpen(true);
            } else {
              setRuleForm(initialRuleForm);
              setIsRuleModalOpen(true);
            }
          }}
        >
          <Plus size={18} />
          {activeTab === 'profiles' && 'Novo Perfil de Cálculo'}
          {activeTab === 'demands' && 'Nova Métrica de Demanda'}
          {activeTab === 'transports' && 'Novo Tipo de Transporte'}
          {activeTab === 'shipments' && 'Novo Tipo de Carga'}
          {activeTab === 'morphology' && 'Nova Regra de Incompatibilidade'}
        </button>
      </div>

      <div className="opt-tabs">
        <button
          className={`opt-tab-btn ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          <Sliders size={18} />
          Perfis de Cálculo & Custos ({profiles.length})
        </button>
        <button
          className={`opt-tab-btn ${activeTab === 'demands' ? 'active' : ''}`}
          onClick={() => setActiveTab('demands')}
        >
          <Layers size={18} />
          Demandas & Capacidades ({demandTypes.length})
        </button>
        <button
          className={`opt-tab-btn ${activeTab === 'transports' ? 'active' : ''}`}
          onClick={() => setActiveTab('transports')}
        >
          <Tags size={18} />
          Tipos de Transporte ({transportTypes.length})
        </button>
        <button
          className={`opt-tab-btn ${activeTab === 'shipments' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipments')}
        >
          <PackageCheck size={18} />
          Tipos de Carga ({shipmentTypesList.length})
        </button>
        <button
          className={`opt-tab-btn ${activeTab === 'morphology' ? 'active' : ''}`}
          onClick={() => setActiveTab('morphology')}
        >
          <ShieldAlert size={18} />
          Incompatibilidades & Morfologia ({rules.length})
        </button>
      </div>

      {/* Conteúdo Aba 1: Perfis */}
      {activeTab === 'profiles' && (
        <div className="card">
          <DataTable
            loading={loading}
            data={profiles}
            emptyMessage="Nenhum perfil de otimização cadastrado para esta empresa."
            columns={[
              {
                label: 'Nome do Perfil',
                key: 'name',
                render: (row) => (
                  <div>
                    <strong style={{ color: 'var(--primary-color)' }}>{row.name}</strong>
                    {row.isDefault && (
                      <span className="badge-default" style={{ marginLeft: '0.5rem' }}>
                        <CheckCircle2 size={12} /> Padrão Ativo
                      </span>
                    )}
                    {row.description && <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{row.description}</small>}
                  </div>
                )
              },
              {
                label: 'Mult. Km / Hora',
                key: 'kmCostMultiplier',
                render: (row) => `${row.kmCostMultiplier || 1.0}x / ${row.hourCostMultiplier || 1.0}x`
              },
              {
                label: 'Custo Fixo Veículo',
                key: 'fixedCostPerVehicle',
                render: (row) => `R$ ${(row.fixedCostPerVehicle || 0).toFixed(2)}`
              },
              {
                label: 'Penalidade Não Entrega',
                key: 'penaltyCostUnserved',
                render: (row) => `R$ ${(row.penaltyCostUnserved || 100000).toLocaleString('pt-BR')}`
              },
              {
                label: 'Tempo de Parada',
                key: 'defaultServiceDurationSeconds',
                render: (row) => `${Math.round((row.defaultServiceDurationSeconds || 1800) / 60)} min`
              },
              {
                label: 'Janela Tolerância',
                key: 'timeWindowLeadMinutes',
                render: (row) => `-${row.timeWindowLeadMinutes || 15} min`
              }
            ]}
            onEdit={(row) => {
              setEditingProfileId(row.id);
              setProfileForm({
                name: row.name || '',
                description: row.description || '',
                isDefault: row.isDefault || false,
                kmCostMultiplier: row.kmCostMultiplier ?? 1.0,
                hourCostMultiplier: row.hourCostMultiplier ?? 1.0,
                fixedCostPerVehicle: row.fixedCostPerVehicle ?? 0.0,
                costPerTraveledHour: row.costPerTraveledHour ?? 0.0,
                penaltyCostUnserved: row.penaltyCostUnserved ?? 100000.0,
                lateArrivalCostPerHour: row.lateArrivalCostPerHour ?? 0.0,
                defaultServiceDurationSeconds: row.defaultServiceDurationSeconds ?? 1800,
                timeWindowLeadMinutes: row.timeWindowLeadMinutes ?? 15,
                vehicleStartWindowLeadHours: row.vehicleStartWindowLeadHours ?? 2,
                vehicleEndWindowMarginHours: row.vehicleEndWindowMarginHours ?? 2,
                globalHorizonExtraDays: row.globalHorizonExtraDays ?? 2
              });
              setIsProfileModalOpen(true);
            }}
            onDelete={(row) => {
              setItemToDelete(row);
              setDeleteType('profile');
              setDeleteConfirmOpen(true);
            }}
          />
        </div>
      )}

      {/* Conteúdo Aba 2: Demandas */}
      {activeTab === 'demands' && (
        <div className="card">
          <DataTable
            loading={loading}
            data={demandTypes}
            emptyMessage="Nenhuma métrica de demanda cadastrada."
            columns={[
              {
                label: 'Identificador / Código',
                key: 'code',
                render: (row) => (
                  <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--primary-color)', fontWeight: 600 }}>
                    {row.code}
                  </code>
                )
              },
              {
                label: 'Nome da Métrica',
                key: 'name',
                render: (row) => <strong style={{ color: 'var(--primary-color)' }}>{row.name}</strong>
              },
              {
                label: 'Unidade de Medida',
                key: 'unit',
                render: (row) => row.unit || '-'
              },
              {
                label: 'Descrição',
                key: 'description',
                render: (row) => row.description || '-'
              },
              {
                label: 'Origem',
                key: 'isSystemDefault',
                render: (row) => row.isSystemDefault ? (
                  <span className="badge-system">Sistema</span>
                ) : (
                  <span className="badge-custom">Personalizada</span>
                )
              }
            ]}
            onEdit={(row) => {
              setEditingDemandId(row.id);
              setDemandForm({
                code: row.code || '',
                name: row.name || '',
                unit: row.unit || '',
                description: row.description || ''
              });
              setIsDemandModalOpen(true);
            }}
            onDelete={(row) => {
              if (row.isSystemDefault) {
                showToast('Não é permitido excluir demandas padrão do sistema.', 'error');
                return;
              }
              setItemToDelete(row);
              setDeleteType('demand');
              setDeleteConfirmOpen(true);
            }}
          />
        </div>
      )}

      {/* Conteúdo Aba 3: Tipos de Transporte */}
      {activeTab === 'transports' && (
        <div className="card">
          <DataTable
            loading={loading}
            data={transportTypes}
            emptyMessage="Nenhum tipo de transporte cadastrado."
            columns={[
              {
                label: 'Nome do Transporte',
                key: 'name',
                render: (row) => <strong style={{ color: 'var(--primary-color)' }}>{row.name}</strong>
              },
              {
                label: 'Descrição',
                key: 'description',
                render: (row) => row.description || '-'
              },
              {
                label: 'Cuidados / Requisitos',
                key: 'care',
                render: (row) => row.care || '-'
              }
            ]}
            onEdit={(row) => {
              setEditingTransportId(row.id);
              setTransportForm({
                name: row.name || '',
                description: row.description || '',
                care: row.care || ''
              });
              setIsTransportModalOpen(true);
            }}
            onDelete={(row) => {
              setItemToDelete(row);
              setDeleteType('transport');
              setDeleteConfirmOpen(true);
            }}
          />
        </div>
      )}

      {/* Conteúdo Aba 4: Tipos de Carga */}
      {activeTab === 'shipments' && (
        <div className="card">
          <DataTable
            loading={loading}
            data={shipmentTypesList}
            emptyMessage="Nenhum tipo de carga cadastrado."
            columns={[
              {
                label: 'Nome da Carga',
                key: 'name',
                render: (row) => <strong style={{ color: 'var(--primary-color)' }}>{row.name}</strong>
              },
              {
                label: 'Descrição',
                key: 'description',
                render: (row) => row.description || '-'
              },
              {
                label: 'Instruções de Cuidado',
                key: 'care',
                render: (row) => row.care || '-'
              }
            ]}
            onEdit={(row) => {
              setEditingShipmentTypeId(row.id);
              setShipmentTypeForm({
                name: row.name || '',
                description: row.description || '',
                care: row.care || ''
              });
              setIsShipmentTypeModalOpen(true);
            }}
            onDelete={(row) => {
              setItemToDelete(row);
              setDeleteType('shipmentType');
              setDeleteConfirmOpen(true);
            }}
          />
        </div>
      )}

      {/* Conteúdo Aba 5: Morfologia */}
      {activeTab === 'morphology' && (
        <div className="card">
          <DataTable
            loading={loading}
            data={rules}
            emptyMessage="Nenhuma regra de incompatibilidade cadastrada."
            columns={[
              {
                label: 'Nome da Regra',
                key: 'name',
                render: (row) => <strong style={{ color: 'var(--primary-color)' }}>{row.name}</strong>
              },
              {
                label: 'Tipo de Restrição',
                key: 'ruleType',
                render: (row) => (
                  <span className="status-chip danger">{translateRuleType(row.ruleType)}</span>
                )
              },
              {
                label: 'Visita / Carga 1',
                key: 'visitType1',
                render: (row) => (
                  <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--primary-color)', fontWeight: 600 }}>
                    {row.visitType1?.name || row.visitType1?.code}
                  </code>
                )
              },
              {
                label: 'Visita / Carga 2',
                key: 'visitType2',
                render: (row) => (
                  <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--primary-color)', fontWeight: 600 }}>
                    {row.visitType2?.name || row.visitType2?.code}
                  </code>
                )
              },
              {
                label: 'Descrição',
                key: 'description',
                render: (row) => row.description || '-'
              }
            ]}
            onDelete={(row) => {
              setItemToDelete(row);
              setDeleteType('rule');
              setDeleteConfirmOpen(true);
            }}
          />
        </div>
      )}

      {/* Modal Profile */}
      {isProfileModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2>{editingProfileId ? 'Editar Perfil de Cálculo' : 'Novo Perfil de Otimização'}</h2>
              <button className="modal-close-btn" onClick={() => setIsProfileModalOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Perfil *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Foco Econômico ou Entregas Urgentes"
                    className="form-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição das Regras</label>
                  <input
                    type="text"
                    placeholder="Explicação do propósito ou prioridade deste perfil"
                    className="form-input"
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={profileForm.isDefault}
                      onChange={(e) => setProfileForm({ ...profileForm, isDefault: e.target.checked })}
                    />
                    <span>Definir como perfil padrão para esta empresa</span>
                  </label>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.85rem' }}>
                    Custos & Multiplicadores
                  </h3>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Multiplicador Custo Km</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      className="form-input"
                      value={profileForm.kmCostMultiplier}
                      onChange={(e) => setProfileForm({ ...profileForm, kmCostMultiplier: e.target.value })}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Padrão: 1.0 (pesos proporcionais da distância)</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Multiplicador Custo Hora</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      className="form-input"
                      value={profileForm.hourCostMultiplier}
                      onChange={(e) => setProfileForm({ ...profileForm, hourCostMultiplier: e.target.value })}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Padrão: 1.0 (pesos proporcionais do tempo)</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Custo Fixo por Veículo Utilizado (R$)</label>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      className="form-input"
                      value={profileForm.fixedCostPerVehicle}
                      onChange={(e) => setProfileForm({ ...profileForm, fixedCostPerVehicle: e.target.value })}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Incentiva o motor a usar menos veículos</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Penalidade por Remessa Não Atendida (R$)</label>
                    <input
                      type="number"
                      step="1000"
                      min="1000"
                      className="form-input"
                      value={profileForm.penaltyCostUnserved}
                      onChange={(e) => setProfileForm({ ...profileForm, penaltyCostUnserved: e.target.value })}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Padrão R$ 100.000 para forçar entrega</small>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.85rem' }}>
                    Tempos & Janelas Operacionais
                  </h3>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Duração Padrão de Parada / Descarga</label>
                    <select
                      className="form-select"
                      value={profileForm.defaultServiceDurationSeconds}
                      onChange={(e) => setProfileForm({ ...profileForm, defaultServiceDurationSeconds: e.target.value })}
                    >
                      <option value="600">10 minutos</option>
                      <option value="900">15 minutos</option>
                      <option value="1200">20 minutos</option>
                      <option value="1800">30 minutos (Padrão)</option>
                      <option value="2700">45 minutos</option>
                      <option value="3600">1 hora</option>
                      <option value="5400">1 hora e 30 minutos</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tolerância da Janela de Atendimento (minutos)</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      className="form-input"
                      value={profileForm.timeWindowLeadMinutes}
                      onChange={(e) => setProfileForm({ ...profileForm, timeWindowLeadMinutes: e.target.value })}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Antecedência permitida na chegada do cliente</small>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsProfileModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-save">
                  <Save size={16} /> Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Demand Type */}
      {isDemandModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>{editingDemandId ? 'Editar Tipo de Demanda' : 'Nova Métrica de Demanda'}</h2>
              <button className="modal-close-btn" onClick={() => setIsDemandModalOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveDemand}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Código Único (Sem espaços / Caracteres especiais) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingDemandId}
                    placeholder="Ex: pallets, caixas, refrigerados_kg"
                    className="form-input"
                    value={demandForm.code}
                    onChange={(e) => setDemandForm({ ...demandForm, code: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Usado internamente pelo motor do Google Route Optimization</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Nome de Exibição *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Número de Paletes"
                    className="form-input"
                    value={demandForm.name}
                    onChange={(e) => setDemandForm({ ...demandForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unidade de Medida</label>
                  <input
                    type="text"
                    placeholder="Ex: un, cx, kg, m³"
                    className="form-input"
                    value={demandForm.unit}
                    onChange={(e) => setDemandForm({ ...demandForm, unit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input
                    type="text"
                    placeholder="Detalhes sobre quando esta restrição se aplica"
                    className="form-input"
                    value={demandForm.description}
                    onChange={(e) => setDemandForm({ ...demandForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsDemandModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-save">
                  <Save size={16} /> Salvar Demanda
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Tipo de Transporte */}
      {isTransportModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>{editingTransportId ? 'Editar Tipo de Transporte' : 'Novo Tipo de Transporte'}</h2>
              <button className="modal-close-btn" onClick={() => setIsTransportModalOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveTransport}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Transporte *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CARGA SECA, REFRIGERADO, PERIGOSO"
                    className="form-input"
                    value={transportForm.name}
                    onChange={(e) => setTransportForm({ ...transportForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input
                    type="text"
                    placeholder="Descrição da modalidade"
                    className="form-input"
                    value={transportForm.description}
                    onChange={(e) => setTransportForm({ ...transportForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cuidados Especiais</label>
                  <input
                    type="text"
                    placeholder="Ex: Vedação contra umidade, cinta de amarração"
                    className="form-input"
                    value={transportForm.care}
                    onChange={(e) => setTransportForm({ ...transportForm, care: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsTransportModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-save">
                  <Save size={16} /> Salvar Tipo de Transporte
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Tipo de Carga */}
      {isShipmentTypeModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>{editingShipmentTypeId ? 'Editar Tipo de Carga' : 'Novo Tipo de Carga'}</h2>
              <button className="modal-close-btn" onClick={() => setIsShipmentTypeModalOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveShipmentType}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Carga *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alimentos Perecíveis, Eletrodomésticos"
                    className="form-input"
                    value={shipmentTypeForm.name}
                    onChange={(e) => setShipmentTypeForm({ ...shipmentTypeForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input
                    type="text"
                    placeholder="Detalhes dos produtos transportados"
                    className="form-input"
                    value={shipmentTypeForm.description}
                    onChange={(e) => setShipmentTypeForm({ ...shipmentTypeForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Instruções de Cuidado</label>
                  <input
                    type="text"
                    placeholder="Ex: Frágil, este lado para cima, empilhamento máx 3"
                    className="form-input"
                    value={shipmentTypeForm.care}
                    onChange={(e) => setShipmentTypeForm({ ...shipmentTypeForm, care: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsShipmentTypeModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-save">
                  <Save size={16} /> Salvar Tipo de Carga
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Rule */}
      {isRuleModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2>Nova Regra de Incompatibilidade Morfológica</h2>
              <button className="modal-close-btn" onClick={() => setIsRuleModalOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveRule}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Regra *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Produtos Químicos e Alimentos"
                    className="form-input"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Restrição</label>
                  <select
                    className="form-select"
                    value={ruleForm.ruleType}
                    onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
                  >
                    <option value="INCOMPATIBLE_ON_SAME_VEHICLE">Incompatível no mesmo caminhão (Google ShipmentTypeIncompatibility)</option>
                  </select>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Tipo de Carga / Visita 1 *</label>
                    <select
                      required
                      className="form-select"
                      value={ruleForm.visitType1Id}
                      onChange={(e) => setRuleForm({ ...ruleForm, visitType1Id: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {visitTypes.map((vt) => (
                        <option key={vt.id} value={vt.id}>{vt.name} ({vt.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de Carga / Visita 2 *</label>
                    <select
                      required
                      className="form-select"
                      value={ruleForm.visitType2Id}
                      onChange={(e) => setRuleForm({ ...ruleForm, visitType2Id: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {visitTypes.map((vt) => (
                        <option key={vt.id} value={vt.id}>{vt.name} ({vt.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição / Justificativa</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Normas sanitárias proíbem o carregamento conjunto na mesma carroceria."
                    className="form-textarea"
                    value={ruleForm.description}
                    onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsRuleModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-save">
                  <Save size={16} /> Salvar Regra
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Exclusão */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Registro"
        message="Tem certeza que deseja excluir esta configuração? Roteirizações futuras não levarão mais esta regra em conta."
      />
    </div>
  );
};

export default OptimizationRulesPage;
