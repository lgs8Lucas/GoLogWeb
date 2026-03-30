import React from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Truck, Package } from 'lucide-react';
import '../styles/MonitoringModal.css';

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
            <div className="route-map-container">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Route Map" 
                className="route-map-bg"
              />
              
              {/* SVG Route Line */}
              <svg className="route-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 40 20 C 40 50, 45 60, 50 80" fill="none" stroke="#2563eb" strokeWidth="2.5" />
              </svg>

              {/* Pins */}
              <div className="route-pin pin-start" style={{ top: '20%', left: '40%' }}>
                <div className="route-pin-circle">
                  <Truck size={14} color="#c92a2a" />
                </div>
              </div>
              <div className="route-pin pin-end" style={{ top: '80%', left: '50%' }}>
                <div className="route-pin-circle">
                   <Package size={14} color="#c92a2a" />
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="map-zoom-controls">
                <button className="zoom-btn"><ZoomIn size={20} /></button>
                <button className="zoom-btn"><ZoomOut size={20} /></button>
              </div>
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
