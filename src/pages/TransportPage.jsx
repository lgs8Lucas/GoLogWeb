import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown, ChevronUp, MapPin, Truck, Package, ChevronLeft, Navigation, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Transport.css';
import TransportModal from '../components/TransportModal';
import PageHeader from '../components/PageHeader';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';
import { occurrenceService } from '../services/occurrenceService';
import { decodePolyline } from '../utils/polyline';
import MonitoringModal from '../components/MonitoringModal';

const TransportPage = () => {
  const navigate = useNavigate();
  const [transports, setTransports] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals for map and occurrences
  const [isMonitoringModalOpen, setIsMonitoringModalOpen] = useState(false);
  const [selectedMonitoringVehicle, setSelectedMonitoringVehicle] = useState(null);
  const [isOccModalOpen, setIsOccModalOpen] = useState(false);
  const [selectedOccs, setSelectedOccs] = useState([]);
  const [selectedOccsTransportId, setSelectedOccsTransportId] = useState('');

  useEffect(() => {
    const fetchTransports = async () => {
      try {
        const [transportsData, shipmentsData, occurrencesData] = await Promise.all([
          transportService.getAll(),
          deliveryService.getAllPersonalized(),
          occurrenceService.getAll()
        ]);

        // Group shipments by transport ID
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
          // Get shipments for this transport and sort by sequenceOrder
          const shipments = shipmentsByTransport[t.id] || [];
          shipments.sort((a, b) => {
            const seqA = a.routeStop?.sequenceOrder ?? 999;
            const seqB = b.routeStop?.sequenceOrder ?? 999;
            return seqA - seqB;
          });

          // Build dynamic steps from database shipments
          let steps = [];
          if (shipments.length > 0) {
            steps = shipments.map((s, index) => {
              const isColeta = s.typeOperation === 'COLETA';
              const label = `${isColeta ? 'Coleta' : 'Entrega'}: ${s.customer?.legalName || 'Cliente'} (${s.address?.city || s.customer?.address?.city || 'Araras'})`;
              
              let status = 'pending';
              if (s.status === 'DELIVERED' || s.status === 'COMPLETED') {
                status = 'completed';
              } else if (s.status === 'IN_TRANSIT' || s.status === 'ACTIVE') {
                status = 'active';
              } else {
                if (index === 0) status = 'completed';
                else if (index === 1) status = 'active';
                else status = 'pending';
              }

              return {
                label,
                status,
                type: isColeta ? 'package' : 'pin'
              };
            });
          } else {
            steps = [
              { label: 'Viagem planejada', status: 'active', type: 'package' }
            ];
          }

          // Determine origin and destination names based on shipments (city + state combo)
          const locations = shipments.map(s => {
            const city = s.address?.city || s.customer?.address?.city || 'Araras';
            const state = s.address?.state || s.customer?.address?.state || 'SP';
            return `${city} - ${state}`;
          });
          const origin = locations[0] || 'Origem';
          const destination = locations[locations.length - 1] || 'Destino';

          // Compile all equipments associated with this transport
          const equipmentsList = [];
          if (t.equipamentGroup?.equipament1?.plate) {
            equipmentsList.push(t.equipamentGroup.equipament1.plate);
          }
          if (t.equipamentGroup?.equipament2?.plate) {
            equipmentsList.push(t.equipamentGroup.equipament2.plate);
          }
          if (t.equipamentGroup?.equipament3?.plate) {
            equipmentsList.push(t.equipamentGroup.equipament3.plate);
          }
          const equipments = equipmentsList.length > 0 ? equipmentsList.join(', ') : '-';
          
          return {
            id: `#${t.codeTransport || (t.id ? t.id.substring(0, 8) : 'N/A')}`,
            origin: origin,
            currentDest: destination,
            equipments: equipments,
            driver: t.driver?.user?.name || 'Sem motorista',
            status: t.timeStopped > 0 ? 'Atrasado' : 'Em viagem',
            shipmentQuantity: t.shipmentQuantity || shipments.length,
            steps: steps,
            rawTransport: t,
            rawShipments: shipments,
            occurrences: occurrencesData ? occurrencesData.filter(occ => {
              const occTid = occ.transport?.id || occ.transportId;
              return occTid === t.id;
            }) : []
          };
        });

        setTransports(mapped);
        if (mapped.length > 0) {
          setExpandedRow(mapped[0].id); // Expand first row by default
        }
      } catch (error) {
        console.error('Erro ao carregar transportes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransports();
  }, []);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleOpenMap = (item) => {
    const rawT = item.rawTransport;
    const shipments = item.rawShipments || [];
    const coords = rawT?.routePlanned ? decodePolyline(rawT.routePlanned) : [];

    const vehicleData = {
      id: rawT?.id,
      code: rawT?.codeTransport || (rawT?.id ? rawT.id.substring(0, 8) : 'N/A'),
      driver: rawT?.driver?.user?.name || 'Sem motorista',
      plate: item.equipments,
      routePlannedCoords: coords,
      shipments: shipments
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

  return (
    <div className="transport-page fade-in">
      <PageHeader 
        title="Transporte"
        description="Acompanhe e gerencie as viagens ativas e o status das entregas."
        icon={Navigation}
        onBack={true}
      >
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Criar Transporte
        </button>
      </PageHeader>

      {/* Main List */}
      <div className="transport-list">
        {/* Columns Header */}
        <div className="transport-list-header">
          <div className="col-id">Transporte</div>
          <div className="col-origin">Origem</div>
          <div className="col-dest">Destino Atual</div>
          <div className="col-eq-all">Equipamentos</div>
          <div className="col-driver">Motorista</div>
          <div className="col-status">Status</div>
          <div className="col-action"></div>
        </div>

        {/* Rows */}
        <div className="transport-rows">
          {loading ? (
             <div style={{padding:'2rem', textAlign:'center'}}>Carregando transportes...</div>
          ) : transports.map((item) => {
            const isExpanded = expandedRow === item.id;
            
            return (
              <div key={item.id} className={`transport-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="transport-card-main" onClick={() => toggleRow(item.id)}>
                  <div className="col-id font-semibold">{item.id}</div>
                  <div className="col-origin font-bold">{item.origin}</div>
                  <div className="col-dest font-bold">{item.currentDest}</div>
                  <div className="col-eq-all font-bold">{item.equipments}</div>
                  <div className="col-driver font-bold">{item.driver}</div>
                  <div className="col-status">{renderStatusBadge(item.status)}</div>
                  <div className="col-action">
                    <button className="expand-btn">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {isExpanded && item.steps && (
                  <div className="transport-card-details fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-color)' }}>Entregas e Coletas</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleOpenMap(item)}
                        >
                          Acompanhar Rota no Mapa
                        </button>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--danger-color, #c92a2a)' }}
                          onClick={() => handleOpenOccurrences(item)}
                        >
                          Ver Ocorrências ({item.occurrences?.length || 0})
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

      {/* Footer Summary */}
      <div className="transport-footer-summary">
        <div className="summary-item">
          <span>Total de transportes:</span>
          <strong>{transports.length}</strong>
        </div>
        <div className="summary-item">
          <span>Total de entregas:</span>
          <strong>{transports.reduce((sum, t) => sum + (t.shipmentQuantity || 0), 0)}</strong>
        </div>
        <div className="summary-item">
          <span>Equipamentos em atividade:</span>
          <strong>{transports.length}</strong>
        </div>
        <div className="summary-item">
          <span>Equipamentos parados:</span>
          <strong>0</strong>
        </div>
        <div className="summary-item">
          <span>Atrasos:</span>
          <strong>{transports.filter(t => t.status === 'Atrasado').length}</strong>
        </div>
      </div>

      {/* Modal */}
      <TransportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Modal de Ocorrências */}
      {isOccModalOpen && createPortal(
        <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Ocorrências do Transporte {selectedOccsTransportId}</h2>
              <button className="modal-close-btn" onClick={() => setIsOccModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '1rem' }}>
              {selectedOccs.length > 0 ? (
                selectedOccs.map((occ, idx) => (
                  <div key={occ.id || idx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', backgroundColor: '#fff', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--danger-color, #c92a2a)' }}>{occ.type}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Criador: {occ.sender?.name || 'Sistema'}</span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{occ.description}</p>
                    {occ.attachment && occ.attachment !== 'Sem anexo' && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                        Anexo: <a href={occ.attachment} target="_blank" rel="noopener noreferrer">{occ.attachment}</a>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#64748b' }}>Nenhuma ocorrência registrada para este transporte.</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Monitoring Modal */}
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
