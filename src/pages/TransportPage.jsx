import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp, MapPin, Truck, Package, Navigation, AlertTriangle, X, Route, Clock, Leaf, Sparkles, User, ArrowRight, Eye, ShieldAlert, Calendar, CheckCircle2, Box, Building2 } from 'lucide-react';
import { translateStatus, translateOperation } from '../utils/enumTranslations';
import '../styles/Transport.css';
import TransportModal from '../components/TransportModal';
import PageHeader from '../components/PageHeader';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';
import { occurrenceService } from '../services/occurrenceService';
import { decodePolyline } from '../utils/polyline';
import MonitoringModal from '../components/MonitoringModal';
import { useToast } from '../components/ToastContext';
import DataTable from '../components/DataTable';
import DeliveryModal from '../components/DeliveryModal';
import ConfirmModal from '../components/ConfirmModal';
import OptimizeRouteModal from '../components/OptimizeRouteModal';
import SmartFilterBar from '../components/SmartFilterBar';

const TransportPage = () => {
  const navigate = useNavigate();
  const [transports, setTransports] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);

  // Smart filters for transports
  const [transportFilters, setTransportFilters] = useState({});

  // Tabs and Shipments state
  const [activeTab, setActiveTab] = useState('transportes'); // 'transportes' | 'entregas'
  const [backlogShipments, setBacklogShipments] = useState([]); // aba Remessas (Backlog): /shipment/list-by-status?status=PENDENTE
  const [shipmentSearchTerm, setShipmentSearchTerm] = useState('');
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [shipmentToDelete, setShipmentToDelete] = useState(null);

  // Modals for map and occurrences
  const [isMonitoringModalOpen, setIsMonitoringModalOpen] = useState(false);
  const [selectedMonitoringVehicle, setSelectedMonitoringVehicle] = useState(null);
  const [isOccModalOpen, setIsOccModalOpen] = useState(false);
  const [selectedOccs, setSelectedOccs] = useState([]);
  const [selectedOccsTransportId, setSelectedOccsTransportId] = useState('');

  const { showToast } = useToast();

  const fetchTransports = async () => {
    setLoading(true);
    try {
      const [transportsData, shipmentsData, backlogShipmentsData, occurrencesData] = await Promise.all([
        transportService.getAll(),
        deliveryService.getAllPersonalized(),
        deliveryService.getByStatus('PENDENTE'),
        occurrenceService.getAll()
      ]);

      const shipmentsByTransport = {};
      shipmentsData.forEach(s => {
        if (s.transport) {
          const tid = s.transport.id;
          if (!shipmentsByTransport[tid]) {
            shipmentsByTransport[tid] = [];
          }
          shipmentsByTransport[tid].push(s);
        }
      });

      const mapped = transportsData.map(t => {
        const tShipments = shipmentsByTransport[t.id] || [];
        tShipments.sort((a, b) => {
          const seqA = a.routeStop?.sequenceOrder ?? 999;
          const seqB = b.routeStop?.sequenceOrder ?? 999;
          return seqA - seqB;
        });

        let steps = [];
        if (tShipments.length > 0) {
          steps = tShipments.map((s, index) => {
            const isColeta = s.typeOperation === 'COLETA';
            const customerName = s.customer?.legalName || 'Cliente';
            const city = s.address?.city || s.customer?.address?.city || 'Araras';
            const state = s.address?.state || s.customer?.address?.state || 'SP';
            const street = s.address?.street ? `${s.address.street}, ${s.address.number || 'S/N'}` : null;
            const sched = s.shedulind || s.schedulind;

            let status = 'pending';
            if (s.status === 'FINALIZADO') {
              status = 'completed';
            } else if (s.status === 'INICIADO') {
              status = 'active';
            } else {
              if (index === 0) status = 'completed';
              else if (index === 1) status = 'active';
              else status = 'pending';
            }

            return {
              id: s.id,
              sequence: s.routeStop?.sequenceOrder ?? (index + 1),
              isColeta,
              operation: isColeta ? 'Coleta' : 'Entrega',
              customerName,
              city,
              state,
              street,
              weight: s.weight || 0,
              volume: s.volume || 0,
              scheduledAt: sched ? new Date(sched).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null,
              status,
              rawShipment: s
            };
          });
        } else {
          steps = [{
            id: 'planned',
            sequence: 1,
            isColeta: false,
            operation: 'Viagem',
            customerName: 'Viagem planejada sem remessas vinculadas',
            city: origin,
            state: '',
            street: null,
            weight: 0,
            volume: 0,
            scheduledAt: null,
            status: 'active'
          }];
        }

        const locations = tShipments.map(s => {
          const city = s.address?.city || s.customer?.address?.city || 'Araras';
          const state = s.address?.state || s.customer?.address?.state || 'SP';
          return `${city} - ${state}`;
        });
        const origin = locations[0] || 'Origem';
        const destination = locations[locations.length - 1] || 'Destino';

        const equipmentsList = [];
        if (t.equipamentGroup?.equipament1?.plate) equipmentsList.push(t.equipamentGroup.equipament1.plate);
        if (t.equipamentGroup?.equipament2?.plate) equipmentsList.push(t.equipamentGroup.equipament2.plate);
        if (t.equipamentGroup?.equipament3?.plate) equipmentsList.push(t.equipamentGroup.equipament3.plate);
        const equipments = equipmentsList.length > 0 ? equipmentsList.join(', ') : '-';

        return {
          id: `#${t.codeTransport || (t.id ? t.id.substring(0, 8) : 'N/A')}`,
          rawId: t.id,
          origin: origin,
          currentDest: destination,
          equipments: equipments,
          driver: t.driver?.user?.name || 'Sem motorista',
          status: t.timeStopped > 0 ? 'Atrasado' : 'Em viagem',
          shipmentQuantity: t.shipmentQuantity || tShipments.length,
          steps: steps,
          rawTransport: t,
          rawShipments: tShipments,
          occurrences: occurrencesData ? occurrencesData.filter(occ => {
            const occTid = occ.transport?.id || occ.transportId;
            return occTid === t.id;
          }) : []
        };
      });

      setTransports(mapped);
      setBacklogShipments(backlogShipmentsData || []);
      if (mapped.length > 0) {
        setExpandedRow(mapped[0].id); // Expand first row by default
      }
    } catch (error) {
      console.error('Erro ao carregar transportes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransports();
  }, []);

  const handleSaveShipment = async (formData, id) => {
    try {
      if (id) {
        await deliveryService.update(id, formData);
        showToast('Registro atualizado com sucesso!', 'success');
      } else {
        await deliveryService.create(formData);
        showToast('Remessa criada com sucesso!', 'success');
      }
      setIsShipmentModalOpen(false);
      setEditingShipment(null);
      await fetchTransports(); // This updates both transports and shipments
    } catch (error) {
      console.error('Erro ao salvar entrega:', error);
      showToast(id ? 'Erro ao atualizar registro.' : 'Erro ao criar remessa.', 'error');
    }
  };

  const handleNewShipment = () => {
    setEditingShipment(null);
    setIsShipmentModalOpen(true);
  };

  const handleEditShipment = async (row) => {
    try {
      // GET /shipment/{id} está retornando 404 no backend para IDs válidos (confirmado via PUT direto);
      // usamos a listagem completa (que já funciona) e buscamos o registro pelo ID como contorno.
      const all = await deliveryService.getAll();
      const full = (all || []).find(s => s.id === row.id);
      if (!full) throw new Error('Registro não encontrado na listagem.');
      setEditingShipment(full);
      setIsShipmentModalOpen(true);
    } catch (error) {
      console.error('Erro ao carregar registro:', error);
      showToast('Erro ao carregar registro para edição.', 'error');
    }
  };

  const confirmDeleteShipment = async () => {
    if (!shipmentToDelete) return;
    try {
      await deliveryService.delete(shipmentToDelete.id);
      showToast('Registro excluído com sucesso!', 'success');
      await fetchTransports();
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      showToast('Erro ao excluir registro.', 'error');
    } finally {
      setShipmentToDelete(null);
    }
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleOpenMap = (item) => {
    const rawT = item.rawTransport;
    const shipmentsList = item.rawShipments || [];
    const coords = rawT?.routePlanned ? decodePolyline(rawT.routePlanned) : [];

    const vehicleData = {
      id: rawT?.id,
      code: rawT?.codeTransport || (rawT?.id ? rawT.id.substring(0, 8) : 'N/A'),
      driver: rawT?.driver?.user?.name || 'Sem motorista',
      plate: item.equipments,
      routePlannedCoords: coords,
      shipments: shipmentsList,
      occurrences: item.occurrences || [],
      calculedDistance: rawT?.calculedDistance,
      totalTimeCalculed: rawT?.totalTimeCalculed,
      totalCostCalculed: rawT?.totalCostCalculed,
      costKmCalculed: rawT?.costKmCalculed,
      costHourCalculed: rawT?.costHourCalculed,
      travelDuration: rawT?.travelDuration
    };

    setSelectedMonitoringVehicle(vehicleData);
    setIsMonitoringModalOpen(true);
  };

  const handleOpenOccurrences = (item) => {
    setSelectedOccs(item.occurrences || []);
    setSelectedOccsTransportId(item.id);
    setIsOccModalOpen(true);
  };

  const renderStatusBadge = (status) => {
    let className = 'badge-travel'; // Em viagem
    if (status === 'Atrasado') className = 'badge-delayed';
    if (status === 'Em entrega') className = 'badge-delivery';

    return (
      <span className={`transport-badge ${className}`}>
        {status === 'Atrasado' && <span className="warning-icon">⚠</span>}
        {status}
      </span>
    );
  };

  const renderStepper = (steps, onItemClick) => {
    return (
      <div className="vertical-timeline">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <div
              key={step.id || index}
              className={`timeline-item ${step.status}`}
              onClick={onItemClick}
            >
              <div className="timeline-badge">
                {isCompleted ? (
                  <CheckCircle2 size={18} color="var(--status-active-text)" />
                ) : (
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800 }}>
                    {step.sequence}
                  </span>
                )}
                {isActive && <span className="active-ping"></span>}
              </div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`status-chip ${step.isColeta ? 'warning' : 'info'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                      {step.operation}
                    </span>
                    <span className="timeline-title">{step.customerName}</span>
                  </div>

                  <span className={`status-badge-small ${step.status}`}>
                    {isCompleted ? '✓ Concluído' : isActive ? '● Em andamento' : '○ Pendente'}
                  </span>
                </div>

                <div className="timeline-details-grid">
                  <div className="timeline-detail-item">
                    <MapPin size={14} color="var(--primary-color)" />
                    <span>
                      {step.city} {step.state ? `- ${step.state}` : ''}
                      {step.street && <small style={{ color: 'var(--text-muted)', display: 'block' }}>{step.street}</small>}
                    </span>
                  </div>

                  {step.scheduledAt && (
                    <div className="timeline-detail-item">
                      <Calendar size={14} color="var(--text-muted)" />
                      <span>Agendado: {step.scheduledAt}</span>
                    </div>
                  )}

                  {(step.weight > 0 || step.volume > 0) && (
                    <div className="timeline-detail-item">
                      <Box size={14} color="var(--text-muted)" />
                      <span>{step.weight} kg &bull; {step.volume} m³</span>
                    </div>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className={`timeline-connector ${isCompleted ? 'completed' : ''}`}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Shipments (Entregas / Remessas) Data Handling
  const shipmentColumns = [
    { 
      label: 'Código', 
      key: 'id', 
      render: (row) => (
        <span 
          style={{ cursor: 'pointer', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color)' }}
          onClick={() => handleEditShipment(row)}
          title="Clique para editar este registro"
        >
          #{row.id ? row.id.substring(0, 8) : 'N/A'}
        </span>
      )
    },
    {
      label: 'Cliente / Destinatário',
      key: 'customer',
      render: (row) => row.customer?.id ? (
        <Link 
          to={`/empresas?edit=${row.customer.id}`} 
          className="entity-link"
          title={`Ver dados do cliente ${row.customer.legalName}`}
        >
          <Building2 size={13} />
          <span>{row.customer.legalName}</span>
        </Link>
      ) : (
        <span>{row.customer?.legalName || '-'}</span>
      )
    },
    { 
      label: 'Operação', 
      key: 'typeOperation', 
      render: (row) => (
        <span className={`status-chip ${row.typeOperation === 'COLETA' || row.typeOperation === 'PICKUP' ? 'warning' : 'info'}`}>
          {translateOperation(row.typeOperation)}
        </span>
      )
    },
    { label: 'Peso', key: 'weight', render: (row) => `${row.weight || 0} kg` },
    { label: 'Volume', key: 'volume', render: (row) => `${row.volume || 0} m³` },
    {
      label: 'Agendamento', key: 'schedulind', render: (row) => {
        const sched = row.shedulind || row.schedulind;
        return sched ? new Date(sched).toLocaleString('pt-BR') : '-';
      }
    },
    { 
      label: 'Status', 
      key: 'status', 
      render: (row) => {
        const text = translateStatus(row.status || 'PENDENTE');
        const isDone = text === 'Concluído';
        return (
          <span className={`status-chip ${isDone ? 'active' : 'info'}`}>
            {text}
          </span>
        );
      }
    }
  ];

  const transportFilterConfigs = [
    { key: 'status', label: 'Status' },
    { key: 'driver', label: 'Motorista' },
    { key: 'origin', label: 'Origem' },
    { key: 'currentDest', label: 'Destino' }
  ];

  const shipmentFilterConfigs = [
    { key: 'typeOperation', label: 'Operação' },
    { key: 'status', label: 'Status' }
  ];

  const filteredTransports = transports.filter(item => {
    return Object.keys(transportFilters).every(k => {
      const val = transportFilters[k];
      if (!val || val === 'ALL') return true;
      return String(item[k] || '').toLowerCase() === String(val).toLowerCase();
    });
  });

  const renderShipmentsPanel = (panelKey, data, searchTerm, setSearchTerm, emptyMessage, statusFilter) => {
    const base = statusFilter
      ? data.filter(item => item.status === statusFilter)
      : data;

    return (
      <div key={panelKey} className="card">
        <DataTable
          columns={shipmentColumns}
          data={base}
          loading={loading}
          onEdit={handleEditShipment}
          onDelete={(row) => setShipmentToDelete(row)}
          emptyMessage={emptyMessage}
          itemsPerPage={15}
          filterConfigs={shipmentFilterConfigs}
          searchPlaceholder="Pesquisar por código, cliente ou modal..."
        />
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Transportes & Operações Logísticas"
        description="Controle avançado de roteirização, rastreamento de entregas e otimização de frotas."
        icon={Navigation}
        onBack={true}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {activeTab === 'transportes' ? (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsOptimizeModalOpen(true)}
              >
                <Sparkles size={18} />
                Otimizar Rotas
              </button>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Novo Transporte
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleNewShipment}>
              <Plus size={18} /> Nova Remessa
            </button>
          )}
        </div>
      </PageHeader>

      {/* Navigation Tabs */}
      <div className="transport-nav-tabs">
        <button 
          className={`transport-tab-btn ${activeTab === 'transportes' ? 'active' : ''}`}
          onClick={() => setActiveTab('transportes')}
        >
          Viagens Ativas ({transports.length})
        </button>
        <button 
          className={`transport-tab-btn ${activeTab === 'entregas' ? 'active' : ''}`}
          onClick={() => setActiveTab('entregas')}
        >
          Remessas (Backlog) ({backlogShipments.length})
        </button>
      </div>

      {activeTab === 'transportes' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SmartFilterBar
            filterConfigs={transportFilterConfigs}
            data={transports}
            selectedFilters={transportFilters}
            onFilterChange={setTransportFilters}
            onClear={() => setTransportFilters({})}
          />

          <div className="tms-transport-cards-grid">
            {loading ? (
              <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--secondary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontWeight: 600 }}>Carregando viagens ativas...</span>
                </div>
              </div>
            ) : filteredTransports.length === 0 ? (
              <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Truck size={36} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
                <h4 style={{ margin: '0 0 0.25rem', color: 'var(--text-main)' }}>Nenhuma viagem ativa encontrada</h4>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Ajuste os filtros selecionados ou crie um novo transporte.</p>
              </div>
            ) : filteredTransports.map((item) => {
              const isExpanded = expandedRow === item.id;
              const hasOccurrences = (item.occurrences?.length || 0) > 0;
              const stepsCount = item.steps?.length || 0;
              const completedCount = item.steps ? item.steps.filter(s => s.status === 'completed').length : 0;
              
              return (
                <div key={item.id} className={`tms-transport-card ${isExpanded ? 'expanded' : ''}`}>
                  {/* Card Main Summary Header */}
                  <div className="tms-card-header" onClick={() => toggleRow(item.id)}>
                    <div className="tms-card-top-row">
                      <div className="tms-card-id-badge">
                        <span className="tms-code-chip">{item.id}</span>
                        <span className="tms-stops-count-badge">
                          <Package size={14} color="var(--primary-color)" />
                          <span>{completedCount} de {stepsCount} paradas concluídas</span>
                        </span>
                        {hasOccurrences && (
                          <span className="status-chip danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                            <ShieldAlert size={13} />
                            {item.occurrences.length} Ocorrência{item.occurrences.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={`status-chip ${item.status === 'Atrasado' ? 'danger' : 'active'}`}>
                          {item.status}
                        </span>
                        <button className="btn-icon" style={{ backgroundColor: 'var(--bg-hover)' }}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="tms-card-route-row">
                      {/* Origem e Destino */}
                      <div className="tms-route-display">
                        <div className="tms-route-point">
                          <span className="tms-route-label">Origem</span>
                          <span className="tms-route-value">{item.origin}</span>
                        </div>
                        <div className="tms-route-arrow">
                          <ArrowRight size={18} />
                        </div>
                        <div className="tms-route-point">
                          <span className="tms-route-label">Destino</span>
                          <span className="tms-route-value">{item.currentDest}</span>
                        </div>
                      </div>

                      {/* Motorista */}
                      <div className="tms-card-entity">
                        <span className="tms-entity-label">
                          <User size={13} />
                          Motorista
                        </span>
                        {item.rawTransport?.driver?.user?.id ? (
                          <Link 
                            to={`/perfis?edit=${item.rawTransport.driver.user.id}`} 
                            className="entity-link"
                            onClick={(e) => e.stopPropagation()}
                            title="Ver/Editar perfil do motorista"
                          >
                            <span>{item.driver}</span>
                          </Link>
                        ) : (
                          <span className="tms-entity-value">{item.driver}</span>
                        )}
                      </div>

                      {/* Equipamento */}
                      <div className="tms-card-entity">
                        <span className="tms-entity-label">
                          <Truck size={13} />
                          Frota / Conjunto
                        </span>
                        {item.rawTransport?.equipamentGroup?.id ? (
                          <Link 
                            to={`/conjuntos?edit=${item.rawTransport.equipamentGroup.id}`} 
                            className="entity-link secondary"
                            onClick={(e) => e.stopPropagation()}
                            title="Ver/Editar conjunto de equipamentos"
                          >
                            <span>{item.equipments}</span>
                          </Link>
                        ) : (
                          <span className="tms-entity-value">{item.equipments}</span>
                        )}
                      </div>

                      {/* Quick action button */}
                      <div>
                        <button 
                          type="button"
                          className="btn btn-outline" 
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMap(item);
                          }}
                        >
                          <Eye size={15} color="var(--primary-color)" />
                          Ver Mapa
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body: Telemetry Metrics & Enhanced Stepper */}
                  {isExpanded && item.steps && (
                    <div className="tms-accordion-body fade-in">
                      <div className="tms-accordion-toolbar">
                        <div className="tms-metrics-pill-group">
                          <div className="tms-metric-pill">
                            <Route size={16} color="var(--primary-color)" />
                            <span>Distância Planejada: <strong>{((item.rawTransport?.calculedDistance || 0) / 1000).toFixed(2)} km</strong></span>
                          </div>
                          <div className="tms-metric-pill">
                            <Clock size={16} color="var(--status-warning-text)" />
                            <span>Tempo Estimado: <strong>{Math.floor((item.rawTransport?.totalTimeCalculed || 0) / 3600)}h {Math.floor(((item.rawTransport?.totalTimeCalculed || 0) % 3600) / 60)}m</strong></span>
                          </div>
                          <div className="tms-metric-pill green">
                            <Leaf size={16} color="var(--status-active-text)" />
                            <span>Emissão CO₂: <strong>{(item.rawTransport?.totalCostCalculed || 0).toFixed(2)} kg</strong></span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8125rem' }}
                            onClick={() => handleOpenMap(item)}
                          >
                            <MapPin size={15} />
                            Acompanhar em Tempo Real
                          </button>
                          <button 
                            type="button"
                            className="btn btn-outline" 
                            style={{ 
                              padding: '0.45rem 0.85rem', 
                              fontSize: '0.8125rem',
                              borderColor: hasOccurrences ? 'var(--status-danger-border)' : 'var(--border-color)',
                              color: hasOccurrences ? 'var(--status-danger-text)' : 'var(--text-main)',
                              backgroundColor: hasOccurrences ? 'var(--status-danger-bg)' : 'transparent'
                            }}
                            onClick={() => handleOpenOccurrences(item)}
                          >
                            <AlertTriangle size={15} />
                            Ocorrências ({item.occurrences?.length || 0})
                          </button>
                        </div>
                      </div>

                      {/* Timeline Card */}
                      <div className="tms-stepper-card-wrapper">
                        <div className="tms-stepper-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Navigation size={16} color="var(--secondary-color)" />
                            <span>Roteiro de Paradas & Entregas</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Clique em uma parada para focar no mapa
                          </span>
                        </div>
                        {renderStepper(item.steps, () => handleOpenMap(item))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        renderShipmentsPanel(
          'entregas',
          backlogShipments,
          shipmentSearchTerm, setShipmentSearchTerm,
          'Nenhuma remessa pendente.'
        )
      )}

      <TransportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchTransports} />

      {/* Modal de Otimização de Rotas */}
      <OptimizeRouteModal
        isOpen={isOptimizeModalOpen}
        onClose={() => setIsOptimizeModalOpen(false)}
        onSuccess={fetchTransports}
      />

      {/* Modal Nova Remessa / Edição */}
      <DeliveryModal
        isOpen={isShipmentModalOpen}
        onClose={() => { setIsShipmentModalOpen(false); setEditingShipment(null); }}
        onSave={handleSaveShipment}
        initialData={editingShipment}
      />

      {/* Confirmação de exclusão de entrega/coleta */}
      <ConfirmModal
        isOpen={!!shipmentToDelete}
        onClose={() => setShipmentToDelete(null)}
        onConfirm={confirmDeleteShipment}
        title="Excluir registro"
        message={`Tem certeza que deseja excluir ${shipmentToDelete?.typeOperation === 'COLETA' ? 'esta coleta' : 'esta entrega'}${shipmentToDelete?.id ? ` (#${shipmentToDelete.id.substring(0, 8)})` : ''}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />

      {isOccModalOpen && createPortal(
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Ocorrências do Transporte {selectedOccsTransportId}</h2>
              <button className="modal-close-btn" onClick={() => setIsOccModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '0.85rem' }}>
              {selectedOccs.length > 0 ? (
                selectedOccs.map((occ, idx) => (
                  <div key={occ.id || idx} className="route-occ-card occ-danger">
                    <div className="occ-card-header">
                      <span>{occ.type}</span>
                      <span>Criador: {occ.sender?.name || 'Sistema'}</span>
                    </div>
                    <p style={{ margin: 0 }}>{occ.description}</p>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma ocorrência registrada para este transporte.</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedMonitoringVehicle && (
        <MonitoringModal
          isOpen={isMonitoringModalOpen}
          onClose={() => {
            setIsMonitoringModalOpen(false);
            setSelectedMonitoringVehicle(null);
          }}
          vehicle={selectedMonitoringVehicle}
        />
      )}
    </div>
  );
};

export default TransportPage;
