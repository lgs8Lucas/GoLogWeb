import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package, FastForward, Save } from 'lucide-react';
import '../styles/TransportModal.css';
import MapComponent from './MapComponent';
import DeliveryModal from './DeliveryModal';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';

const TransportModal = ({ isOpen, onClose }) => {
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [transportFormData, setTransportFormData] = useState({
    routeReturnPlanned: 'Rota de Retorno Padrão',
    routeReturnCompleted: 'Ainda não concluída',
    deliveryQuantity: 0,
    timeStopped: 0.0,
    totalKilometer: 0,
    totalTime: 0.0,
    driverId: '',
    transporterId: '',
    equipamentGroupId: ''
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransportFormData({ ...transportFormData, [name]: value });
  };

  const handleCreateTransport = async () => {
    try {
      await transportService.create(transportFormData);
      alert('Viagem salva com sucesso! (Recarregue para ver, se a listagem estiver implementada)');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar viagem:', error);
      alert('Erro ao salvar viagem. Verifique se colou os UUIDs corretamente.');
    }
  };

  const handleSaveDelivery = async (deliveryData) => {
    try {
      await deliveryService.create(deliveryData);
      alert('Entrega salva e vinculada com sucesso!');
      setIsDeliveryModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar entrega:', error);
      alert('Erro ao salvar entrega. Verifique os inúmeros UUIDs.');
    }
  };

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
                <label>UUID Motorista</label>
                <input type="text" name="driverId" value={transportFormData.driverId} onChange={handleInputChange} className="modal-input" placeholder="Cole o UUID aqui..." />
              </div>
              <div className="form-group">
                <label>UUID Empresa Transportadora</label>
                <input type="text" name="transporterId" value={transportFormData.transporterId} onChange={handleInputChange} className="modal-input" placeholder="Cole o UUID aqui..." />
              </div>
              
              {/* Delivery Cards Carousel */}
              <div className="deliveries-carousel">
                {/* Add Delivery Button Card */}
                <button className="delivery-card add-delivery-card" onClick={() => setIsDeliveryModalOpen(true)}>
                  <Plus size={48} color="var(--border-medium)" strokeWidth={1} />
                  <span>Adicionar<br />entrega</span>
                </button>

                {/* Delivery Card 1 */}
                <div className="delivery-card outline-card">
                  <div className="delivery-card-icon">
                    <Package size={40} color="var(--primary-color)" strokeWidth={1.5} />
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
                    <Package size={40} color="var(--primary-color)" strokeWidth={1.5} />
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
                <button className="btn-optimize" onClick={() => alert('Integração de roteirização futura.')}>
                  <FastForward size={16} /> Otimizar rota
                </button>
                <button className="btn-confirm" onClick={handleCreateTransport}>
                  <Save size={16} /> Salvar Viagem
                </button>
              </div>
            </div>

            {/* Right Side: Conjunto & Map Preview */}
            <div className="modal-right-col">
              <div className="form-group">
                <label>UUID Conjunto</label>
                <input type="text" name="equipamentGroupId" value={transportFormData.equipamentGroupId} onChange={handleInputChange} className="modal-input" placeholder="Cole o UUID aqui..." />
              </div>
              
              <div className="map-preview-container" style={{ position: 'relative', height: '100%', minHeight: '400px' }}>
                <MapComponent 
                  center={[-23.55052, -46.633308]}
                  zoom={10}
                  markers={[
                    { id: 'start', lat: -23.55052, lng: -46.633308, label: 'Origem: SP', status: 'normal' },
                    { id: 'end', lat: -22.7331, lng: -47.6465, label: 'Destino: Piracicaba', status: 'active' }
                  ]}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Nested Delivery Modal */}
      <DeliveryModal 
        isOpen={isDeliveryModalOpen} 
        onClose={() => setIsDeliveryModalOpen(false)} 
        onSave={handleSaveDelivery} 
        transportId="" 
      />
    </div>,
    document.body
  );
};

export default TransportModal;
