import React from 'react';
import { createPortal } from 'react-dom';
import { X, Truck, Package, MapPin, AlertTriangle, User } from 'lucide-react';
import '../styles/MonitoringModal.css';
import MapComponent from './MapComponent';

const MonitoringModal = ({ isOpen, onClose, vehicle }) => {
  if (!isOpen || !vehicle) return null;

  const totalShipments = vehicle.shipments?.length || 0;
  const pendingShipments = vehicle.shipments?.filter(s => !s.status || s.status.toUpperCase() === 'PENDING').length || 0;

  // Render polyline list
  const polylines = [
    {
      id: vehicle.id,
      coords: vehicle.routePlannedCoords || [],
      color: '#2563eb',
      label: `Rota #${vehicle.code}`
    }
  ];

  const getStepStatus = (s, index) => {
    if (s.status === 'DELIVERED' || s.status === 'COMPLETED') {
      return 'completed';
    } else if (s.status === 'IN_TRANSIT' || s.status === 'ACTIVE') {
      return 'active';
    } else {
      if (index === 0) return 'completed';
      else if (index === 1) return 'active';
      return 'pending';
    }
  };

  const getOccClass = (type) => {
    switch (type) {
      case 'ROUBO':
      case 'AVARIA':
        return 'occ-danger';
      case 'ATRASO':
      case 'DESVIO':
        return 'occ-warning';
      default:
        return 'occ-info';
    }
  };

  return createPortal(
    <div className="monitoring-modal-overlay fade-in">
      <div className="monitoring-modal-content">
        <div className="monitoring-modal-header">
          <h2>Acompanhamento da Viagem #{vehicle.code}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="monitoring-modal-body">
          {/* Left Column: Specific Map Route */}
          <div className="monitoring-modal-left">
            <div className="route-map-container" style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden', borderRadius: '12px' }}>
              <MapComponent
                zoom={14}
                polylines={polylines}
              />
            </div>
          </div>

          {/* Right Column: Route Details */}
          <div className="monitoring-modal-right">

            <div className="route-info-block">
              <p>Motorista: <strong>{vehicle.driver}</strong></p>
              <p>Placa: <strong>{vehicle.plate}</strong></p>
              <p>Total de remessas: <strong>{totalShipments}</strong></p>
              <p>Remessas pendentes: <strong>{pendingShipments}</strong></p>
            </div>

            <div className="route-section">
              <h3>Etapas da Rota (Timeline)</h3>
              <div className="modal-vertical-timeline">
                {vehicle.shipments && vehicle.shipments.length > 0 ? (
                  vehicle.shipments.map((s, index) => {
                    const isColeta = s.typeOperation === 'COLETA';
                    const stepStatus = getStepStatus(s, index);
                    const IconComponent = isColeta ? Package : MapPin;

                    return (
                      <div key={s.id || index} className={`modal-timeline-item ${stepStatus}`}>
                        <div className="modal-timeline-badge">
                          <IconComponent size={16} />
                          {stepStatus === 'active' && (
                            <span className="active-ping"></span>
                          )}
                        </div>
                        <div className="modal-timeline-content bg-light-pink">
                          <div className="modal-timeline-header">
                            <span className="modal-timeline-title">
                              Seq {s.routeStop?.sequenceOrder || (index + 1)} | {s.typeOperation}: {s.customer?.legalName || 'Cliente'}
                            </span>
                            <span className={`status-badge-small ${stepStatus}`}>
                              {stepStatus === 'completed' ? 'Concluído' : stepStatus === 'active' ? 'Em andamento' : 'Pendente'}
                            </span>
                          </div>
                          <p className="modal-timeline-addr">{s.address?.street}, {s.address?.number} - {s.address?.city} ({s.address?.state})</p>
                          <p className="modal-timeline-metrics">
                            Peso: <strong>{s.weight || 0} kg</strong> | Volume: <strong>{s.volume || 0} m³</strong>
                          </p>
                        </div>
                        {index < vehicle.shipments.length - 1 && (
                          <div className={`modal-timeline-connector ${stepStatus === 'completed' ? 'completed' : ''}`}></div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>Nenhuma remessa vinculada a esta rota.</p>
                )}
              </div>
            </div>

            <div className="route-section" style={{ marginBottom: '1.5rem' }}>
              <h3>Ocorrências ({vehicle.occurrences?.length || 0})</h3>
              <div className="route-occurrences">
                {vehicle.occurrences && vehicle.occurrences.length > 0 ? (
                  vehicle.occurrences.map((occ, index) => (
                    <div key={occ.id || index} className={`route-occ-card ${getOccClass(occ.type)}`}>
                      <div className="occ-card-header">
                        <span className="occ-card-type">
                          <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                          {occ.type}
                        </span>
                        <span className="occ-card-user">
                          <User size={12} style={{ marginRight: '4px' }} />
                          {occ.sender?.name || 'Sistema'}
                        </span>
                      </div>
                      <p className="occ-card-desc">{occ.description}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>Nenhuma ocorrência registrada para esta rota.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MonitoringModal;
