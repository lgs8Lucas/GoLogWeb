import React from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Truck, Package } from 'lucide-react';
import '../styles/MonitoringModal.css';
import MapComponent from './MapComponent';

const MonitoringModal = ({ isOpen, onClose, vehicle }) => {
  if (!isOpen || !vehicle) return null;

  return createPortal(
    <div className="monitoring-modal-overlay fade-in">
      <div className="monitoring-modal-content">
        <div className="monitoring-modal-header">
          <h2>Rota #0001</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="monitoring-modal-body">
          {/* Left Column: Specific Map Route */}
          <div className="monitoring-modal-left">
            <div className="route-map-container" style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden', borderRadius: '12px' }}>
              <MapComponent 
                center={vehicle ? [vehicle.lat, vehicle.lng] : [-23.55052, -46.633308]}
                zoom={14}
                markers={vehicle ? [{
                  id: vehicle.id,
                  lat: vehicle.lat,
                  lng: vehicle.lng,
                  label: vehicle.driver,
                  status: vehicle.status,
                  speed: vehicle.speed
                }] : []}
              />
            </div>
          </div>

          {/* Right Column: Route Details */}
          <div className="monitoring-modal-right">
            
            <div className="route-info-block">
              <p>Motorista: <strong>{vehicle.driver}</strong></p>
              <p>Placa: <strong>{vehicle.plate}</strong></p>
              <p>Total de entregas: <strong>1</strong></p>
              <p>Entregas pendentes: <strong>1</strong></p>
              <p>Previsão de conclusão: <strong>15:45</strong></p>
            </div>

            <div className="route-section">
              <h3>Entregas</h3>
              <div className="route-list-item bg-light-pink">
                <strong>FHO - Fundação Hermínio Ometto</strong>
                <p>Av. Dr. Maximiliano Baruto, 500 - Jardim Universitário,...</p>
              </div>
            </div>

            <div className="route-section">
              <h3>Ocorrências</h3>
              <div className="route-occurrences">
                <div className="occurrence-item bg-light-pink">
                  <span className="occ-type">Parada:</span> 5m, -23.523, -22.123
                </div>
                <div className="occurrence-item bg-very-light-pink">
                  <span className="occ-type">Desvio de rota:</span> 3Km, -22.323, -21.123
                </div>
                <div className="occurrence-item bg-very-light-pink">
                  <span className="occ-type">Parada:</span> 10m, -24.523, -22.123
                </div>
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
