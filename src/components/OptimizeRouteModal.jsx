import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FastForward, ChevronDown, ChevronUp, SlidersHorizontal, Settings2 } from 'lucide-react';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';
import { workScheduleService } from '../services/workScheduleService';
import { optimizationProfileService } from '../services/optimizationProfileService';
import { companyService } from '../services/companyService';
import { useToast } from './ToastContext';

const driverLabel = (d) => d?.name || d?.user?.name || (d?.id ? `Motorista #${d.id.substring(0, 8)}` : 'Sem motorista');

const groupLabel = (g) => {
  const plates = [g?.equipament1?.plate, g?.equipament2?.plate, g?.equipament3?.plate].filter(Boolean);
  return plates.length > 0 ? plates.join(' + ') : (g?.id ? `Conjunto #${g.id.substring(0, 8)}` : 'Sem conjunto');
};

const checkboxListStyle = {
  border: '1px solid var(--border-color, #e2e8f0)',
  borderRadius: '8px',
  maxHeight: '220px',
  overflowY: 'auto',
  padding: '0.5rem'
};

const checkboxItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.5rem',
  padding: '0.5rem',
  borderBottom: '1px solid var(--border-color, #f1f5f9)',
  cursor: 'pointer'
};

const ROUTE_PRIORITY_OPTIONS = [
  { value: 'ECONOMIA', label: 'Economia', description: 'Prioriza menor distância e custo de rodagem' },
  { value: 'TEMPO', label: 'Tempo', description: 'Prioriza a rota mais rápida e menor tempo de viagem' }
];

const OptimizeRouteModal = ({ isOpen, onClose, onSuccess }) => {
  const [shipments, setShipments] = useState([]);
  const [workSchedules, setWorkSchedules] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState([]);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState([]);
  const [routePriority, setRoutePriority] = useState('ECONOMIA');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  
  // Painel de overrides avançados
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [kmCostMultiplier, setKmCostMultiplier] = useState('');
  const [hourCostMultiplier, setHourCostMultiplier] = useState('');
  const [fixedCostPerVehicle, setFixedCostPerVehicle] = useState('');
  const [penaltyCostUnserved, setPenaltyCostUnserved] = useState('');
  const [serviceDurationMinutes, setServiceDurationMinutes] = useState('');
  const [timeWindowLeadMinutes, setTimeWindowLeadMinutes] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    setSelectedShipmentIds([]);
    setSelectedScheduleIds([]);
    setRoutePriority('ECONOMIA');
    setSelectedProfileId('');
    setShowAdvanced(false);
    resetOverrides();
    setLoading(true);

    const loadData = async () => {
      try {
        const [shipmentsData, schedulesData, companiesData] = await Promise.all([
          deliveryService.getByStatus('PENDENTE'),
          workScheduleService.getAll(),
          companyService.getAllCompanies()
        ]);

        setShipments(shipmentsData || []);
        const activeSchedules = (schedulesData || []).filter(s => s.status === 'ATIVO');
        setWorkSchedules(activeSchedules);

        // Identifica a empresa para carregar os perfis de cálculo
        let targetCompanyId = null;
        if (activeSchedules.length > 0 && activeSchedules[0]?.equipamentGroup?.equipament1?.company?.id) {
          targetCompanyId = activeSchedules[0].equipamentGroup.equipament1.company.id;
        } else if (companiesData && companiesData.length > 0) {
          targetCompanyId = companiesData[0].id;
        }

        if (targetCompanyId) {
          const profileList = await optimizationProfileService.getAllByCompany(targetCompanyId);
          setProfiles(profileList || []);
          const defaultProf = profileList?.find(p => p.isDefault);
          if (defaultProf) {
            setSelectedProfileId(defaultProf.id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados para otimização de rotas:', err);
        showToast('Erro ao carregar remessas e configurações.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  const resetOverrides = () => {
    setKmCostMultiplier('');
    setHourCostMultiplier('');
    setFixedCostPerVehicle('');
    setPenaltyCostUnserved('');
    setServiceDurationMinutes('');
    setTimeWindowLeadMinutes('');
  };

  const handleProfileChange = (profileId) => {
    setSelectedProfileId(profileId);
    if (!profileId) {
      resetOverrides();
      return;
    }
    const prof = profiles.find(p => p.id === profileId);
    if (prof) {
      setKmCostMultiplier(prof.kmCostMultiplier ?? 1.0);
      setHourCostMultiplier(prof.hourCostMultiplier ?? 1.0);
      setFixedCostPerVehicle(prof.fixedCostPerVehicle ?? 0.0);
      setPenaltyCostUnserved(prof.penaltyCostUnserved ?? 100000.0);
      setServiceDurationMinutes(Math.round((prof.defaultServiceDurationSeconds ?? 1800) / 60));
      setTimeWindowLeadMinutes(prof.timeWindowLeadMinutes ?? 15);
    }
  };

  if (!isOpen) return null;

  const toggleId = (list, setList, id) => {
    setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
  };

  const toggleAll = (items, selected, setSelected) => {
    setSelected(selected.length === items.length ? [] : items.map(i => i.id));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        shipmentIds: selectedShipmentIds,
        workScheduleIds: selectedScheduleIds,
        routePriority,
        profileId: selectedProfileId || null,
        kmCostMultiplier,
        hourCostMultiplier,
        fixedCostPerVehicle,
        penaltyCostUnserved,
        defaultServiceDurationSeconds: serviceDurationMinutes ? parseInt(serviceDurationMinutes, 10) * 60 : null,
        timeWindowLeadMinutes
      };

      await transportService.optimizeRoutes(payload);
      showToast('Rotas otimizadas com sucesso!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao otimizar rotas:', error);
      const data = error.response?.data;
      const mensagem = (typeof data === 'string' && data.trim()) || data?.message || data?.detail || 'Erro ao otimizar rotas.';
      showToast(mensagem, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay fade-in">
      <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FastForward size={22} color="var(--primary-color, #2563eb)" />
            Otimizar e Planejar Rotas
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Carregando remessas e regras...</p>
          ) : (
            <>
              {/* Seletor de Perfil de Cálculo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Perfil de Custos & Regras</label>
                  <select
                    className="form-select"
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                  >
                    <option value="">Padrão do Sistema (Automático)</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isDefault ? '⭐ (Padrão Ativo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Prioridade Rápida</label>
                  <select
                    className="form-select"
                    value={routePriority}
                    onChange={(e) => setRoutePriority(e.target.value)}
                  >
                    {ROUTE_PRIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Painel Avançado de Custos (Colapsável) */}
              <div style={{ marginBottom: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 1rem',
                    background: '#f8fafc',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#334155'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <SlidersHorizontal size={16} color="#2563eb" />
                    Ajustar Custos & Tolerâncias para esta Roteirização (Opcional)
                  </span>
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAdvanced && (
                  <div style={{ padding: '1rem', background: '#ffffff', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Mult. Custo Km</label>
                      <input
                        type="number"
                        step="0.05"
                        placeholder="Ex: 1.0"
                        className="form-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={kmCostMultiplier}
                        onChange={(e) => setKmCostMultiplier(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Mult. Custo Hora</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 1.0"
                        className="form-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={hourCostMultiplier}
                        onChange={(e) => setHourCostMultiplier(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Custo Fixo Veículo (R$)</label>
                      <input
                        type="number"
                        step="10"
                        placeholder="Ex: 0.0"
                        className="form-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={fixedCostPerVehicle}
                        onChange={(e) => setFixedCostPerVehicle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Penalidade Não Entrega</label>
                      <input
                        type="number"
                        step="1000"
                        placeholder="Ex: 100000"
                        className="form-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={penaltyCostUnserved}
                        onChange={(e) => setPenaltyCostUnserved(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Duração Parada (min)</label>
                      <input
                        type="number"
                        placeholder="Ex: 30"
                        className="form-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={serviceDurationMinutes}
                        onChange={(e) => setServiceDurationMinutes(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Janela Tolerância (min)</label>
                      <input
                        type="number"
                        placeholder="Ex: 15"
                        className="form-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={timeWindowLeadMinutes}
                        onChange={(e) => setTimeWindowLeadMinutes(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Remessas Pendentes */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Remessas Pendentes ({selectedShipmentIds.length}/{shipments.length})</label>
                  <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }} onClick={() => toggleAll(shipments, selectedShipmentIds, setSelectedShipmentIds)}>
                    {selectedShipmentIds.length === shipments.length && shipments.length > 0 ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </div>
                <div style={checkboxListStyle}>
                  {shipments.length === 0 && <p style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Nenhuma remessa pendente encontrada.</p>}
                  {shipments.map(s => (
                    <label key={s.id} style={checkboxItemStyle}>
                      <input
                        type="checkbox"
                        checked={selectedShipmentIds.includes(s.id)}
                        onChange={() => toggleId(selectedShipmentIds, setSelectedShipmentIds, s.id)}
                      />
                      <span>
                        <strong>#{s.id.substring(0, 8)}</strong> — {s.typeOperation || 'ENTREGA'} — {s.customer?.legalName || 'Sem cliente'}
                        <br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {s.weight || 0} kg | {s.volume || 0} m³ | {s.address?.city || s.customer?.address?.city || 'Araras'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Escalas de Trabalho Ativas */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Escalas de Trabalho Ativas ({selectedScheduleIds.length}/{workSchedules.length})</label>
                  <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }} onClick={() => toggleAll(workSchedules, selectedScheduleIds, setSelectedScheduleIds)}>
                    {selectedScheduleIds.length === workSchedules.length && workSchedules.length > 0 ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </div>
                <div style={checkboxListStyle}>
                  {workSchedules.length === 0 && <p style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Nenhuma escala de trabalho ativa.</p>}
                  {workSchedules.map(w => (
                    <label key={w.id} style={checkboxItemStyle}>
                      <input
                        type="checkbox"
                        checked={selectedScheduleIds.includes(w.id)}
                        onChange={() => toggleId(selectedScheduleIds, setSelectedScheduleIds, w.id)}
                      />
                      <span>
                        <strong>{driverLabel(w.driver)}</strong> — {groupLabel(w.equipamentGroup)}
                        <br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {w.scheduleDate ? new Date(`${w.scheduleDate}T00:00:00`).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSubmit}
            disabled={loading || submitting || selectedShipmentIds.length === 0 || selectedScheduleIds.length === 0}
          >
            {submitting ? 'Otimizando Rotas...' : 'Otimizar Rotas'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OptimizeRouteModal;
