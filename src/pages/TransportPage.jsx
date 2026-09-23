import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown, ChevronUp, MapPin, Truck, Package, Navigation, AlertTriangle, X, Route, Clock, Leaf, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
            const label = `${isColeta ? 'Coleta' : 'Entrega'}: ${s.customer?.legalName || 'Cliente'} (${s.address?.city || s.customer?.address?.city || 'Araras'})`;

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

            return { label, status, type: isColeta ? 'package' : 'pin' };
          });
        } else {
          steps = [{ label: 'Viagem planejada', status: 'active', type: 'package' }];
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
          let IconComponent = Package;
          if (step.type === 'pin') IconComponent = MapPin;

          return (
            <div
              key={index}
              className={`timeline-item ${step.status}`}
              onClick={onItemClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="timeline-badge">
                <IconComponent size={18} />
                {step.status === 'active' && (
                  <span className="active-ping"></span>
                )}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-title">{step.label}</span>
                  <span className={`status-badge-small ${step.status}`}>
                    {step.status === 'completed' ? 'Concluído' : step.status === 'active' ? 'Em andamento' : 'Pendente'}
                  </span>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`timeline-connector ${step.status === 'completed' ? 'completed' : ''}`}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Shipments (Entregas / Remessas) Data Handling
  const shipmentColumns = [
    { label: 'Código', key: 'id', render: (row) => row.id ? row.id.substring(0, 8) : 'N/A' },
    { label: 'Operação', key: 'typeOperation', render: (row) => row.typeOperation || 'ENTREGA' },
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
      render: (row) => (
        <span className={`status-chip ${row.status === 'FINALIZADO' || row.status === 'DELIVERED' ? 'active' : 'info'}`}>
          {row.status || 'PENDENTE'}
        </span>
      )
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

          <div className="table-container">
            <div className="tms-transport-accordion-list">
              <div className="tms-accordion-header">
                <div>Código / ID</div>
                <div>Origem</div>
                <div>Destino Atual</div>
                <div>Equipamento(s)</div>
                <div>Motorista</div>
                <div>Status</div>
                <div style={{ textAlign: 'center' }}>Detalhes</div>
              </div>

              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Carregando transportes ativos...
                </div>
              ) : filteredTransports.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum transporte encontrado com os filtros selecionados.
                </div>
              ) : filteredTransports.map((item) => {
                const isExpanded = expandedRow === item.id;
                
                return (
                  <div key={item.id} className={`tms-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                    <div className="tms-accordion-summary" onClick={() => toggleRow(item.id)}>
                      <div className="tms-code-badge">{item.id}</div>
                      <div className="tms-cell-bold">{item.origin}</div>
                      <div className="tms-cell-bold">{item.currentDest}</div>
                      <div className="tms-cell-muted">{item.equipments}</div>
                      <div className="tms-cell-bold">{item.driver}</div>
                      <div>
                        <span className={`status-chip ${item.status === 'Atrasado' ? 'atrasado' : 'info'}`}>
                          {item.status}
                        </span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <button className="btn-icon">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && item.steps && (
                      <div className="tms-accordion-body fade-in">
                        <div className="tms-accordion-toolbar">
                          <div className="tms-metrics-pill-group">
                            <div className="tms-metric-pill">
                              <Route size={16} color="var(--primary-color)" />
                              <span>{((item.rawTransport?.calculedDistance || 0) / 1000).toFixed(2)} km</span>
                            </div>
                            <div className="tms-metric-pill">
                              <Clock size={16} color="var(--status-warning-text)" />
                              <span>
                                {Math.floor((item.rawTransport?.totalTimeCalculed || 0) / 3600)}h {Math.floor(((item.rawTransport?.totalTimeCalculed || 0) % 3600) / 60)}m
                              </span>
                            </div>
                            <div className="tms-metric-pill green">
                              <Leaf size={16} color="var(--status-active-text)" />
                              <span>
                                {(item.rawTransport?.totalCostCalculed || 0).toFixed(2)} kg CO₂
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
                              onClick={() => handleOpenMap(item)}
                            >
                              Acompanhar Rota no Mapa
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
                              onClick={() => handleOpenOccurrences(item)}
                            >
                              Ocorrências ({item.occurrences?.length || 0})
                            </button>
                          </div>
                        </div>

                        {renderStepper(item.steps, () => handleOpenMap(item))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
