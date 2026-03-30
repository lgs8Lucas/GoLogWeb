import React from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package, FastForward } from 'lucide-react';
import '../styles/TransportModal.css';

const TransportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay fade-in">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Novo transporte</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-split-layout">
            
            {/* Left Side: Motorista & Deliveries */}
            <div className="modal-left-col">
              <div className="form-group">
                <label>Motorista</label>
                <input type="text" className="modal-input" />
              </div>
              
              {/* Delivery Cards Carousel */}
              <div className="deliveries-carousel">
                {/* Add Delivery Button Card */}
                <button className="delivery-card add-delivery-card">
                  <Plus size={48} color="#cbd5e1" strokeWidth={1} />
                  <span>Adicionar<br />entrega</span>
                </button>

                {/* Delivery Card 1 */}
                <div className="delivery-card outline-card">
                  <div className="delivery-card-icon">
                    <Package size={40} color="#1f304c" strokeWidth={1.5} />
                  </div>
                  <div className="delivery-card-info">
                    <strong>#10001</strong>
                    <span>Araras - SP</span>
                    <span>Limeira - SP</span>
                    <span>Shopping Patio ...</span>
                  </div>
                </div>

                {/* Delivery Card 2 */}
                <div className="delivery-card outline-card">
                  <div className="delivery-card-icon">
                    <Package size={40} color="#1f304c" strokeWidth={1.5} />
                  </div>
                  <div className="delivery-card-info">
                    <strong>#10001</strong>
                    <span>Pirassununga - SP</span>
                    <span>Leme - SP</span>
                    <span>Padaria Seu Zé</span>
                  </div>
                </div>
              </div>

              {/* Linked Deliveries Table */}
              <div className="linked-deliveries-section">
                <h3>Entregas vinculadas</h3>
                <div className="linked-table-wrapper">
                  <table className="linked-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Origem</th>
                        <th>Destino</th>
                        <th>Cliente</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>#10001</td>
                        <td>Araras - SP</td>
                        <td>Limeira - SP</td>
                        <td>Shopping Patio Limeira</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-action-buttons">
                <button className="btn-optimize">
                  <FastForward size={16} /> Otimizar rota
                </button>
                <button className="btn-confirm" onClick={onClose}>
                  Confirmar
                </button>
              </div>
            </div>

            {/* Right Side: Conjunto & Map Preview */}
            <div className="modal-right-col">
              <div className="form-group">
                <label>Conjunto</label>
                <input type="text" className="modal-input" />
              </div>
              
              <div className="map-preview-container">
                <img 
                  src="/@fs/home/fgsl/.gemini/antigravity/brain/d408a495-8f95-45cf-a16d-c77606a503b7/media__1774837734012.png" 
                  alt="Map Placeholder" 
                  className="modal-map-bg"
                />
                
                {/* Fake map route line & pins for the UI demo */}
                <svg className="map-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 30 30 Q 50 60, 70 50" fill="none" stroke="var(--primary-color)" strokeWidth="1" strokeDasharray="2,2" />
                </svg>
                
                <div className="map-pin modal-pin" style={{ top: '25%', left: '28%' }}>
                  <Package size={12} color="white" />
                </div>
                <div className="map-pin modal-pin" style={{ top: '65%', left: '35%' }}>
                   <Package size={12} color="white" />
                </div>
                <div className="map-pin modal-pin" style={{ top: '45%', left: '72%' }}>
                   <Package size={12} color="white" />
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

export default TransportModal;
