import React from 'react';
import { createPortal } from 'react-dom';
import { X, Truck, Package } from 'lucide-react';
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

  return createPortal(
    <div className="monitoring-modal-overlay fade-in">
      <div className="monitoring-modal-content">
        <div className="monitoring-modal-header">
          <h2>Rota #{vehicle.code}</h2>
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

            <div className="route-section" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <h3>Remessas</h3>
              {vehicle.shipments && vehicle.shipments.length > 0 ? (
                vehicle.shipments.map((s, index) => (
                  <div key={s.id || index} className="route-list-item bg-light-pink" style={{ marginBottom: '8px' }}>
                    <strong>Seq {s.routeStop?.sequenceOrder || (index + 1)} | {s.typeOperation}: {s.customer?.legalName || 'Cliente'}</strong>
                    <p>{s.address?.street}, {s.address?.number} - {s.address?.city} ({s.address?.state})</p>
                    <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                      Peso: {s.weight || 0} kg | Volume: {s.volume || 0} m³
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>Nenhuma remessa vinculada a esta rota.</p>
              )}
            </div>

            <div className="route-section">
              <h3>Ocorrências</h3>
              <div className="route-occurrences">
                <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>Nenhuma ocorrência registrada para esta rota.</p>
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
