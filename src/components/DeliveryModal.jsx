import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Save } from 'lucide-react';

const DeliveryModal = ({ isOpen, onClose, onSave, transportId }) => {
  const [formData, setFormData] = useState({
    weight: '',
    volume: '',
    scheduledCollection: '',
    scheduledDelivery: '',
    routePlanned: 'Rota a definir',
    routeCompleted: 'Rota a definir',
    status: 'PENDING',
    deliverySequence: 1,
    userId: '',
    deliveryTypeId: '',
    transportId: transportId || '',
    typeTransportId: '',
    originAdrressId: '',
    destinationAddressId: '',
    customerCollectsId: '',
    customerDeliveryId: ''
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return createPortal(
    <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={24} color="var(--primary-color)" />
            Nova Entrega
          </h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Aviso UUIDs */}
            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--warning-color)', margin: 0 }}>
                <strong>Atenção:</strong> Como a API ainda não possui rotas de listagem para todas as entidades, você precisa colar os <strong>UUIDs exatos</strong> gerados no banco de dados para vincular essa entrega aos usuários, endereços e empresas.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Informações Básicas */}
              <div className="form-group">
                <label>Peso (Kg)</label>
                <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleInputChange} className="modal-input" required />
              </div>
              <div className="form-group">
                <label>Volume (m³)</label>
                <input type="number" step="0.01" name="volume" value={formData.volume} onChange={handleInputChange} className="modal-input" required />
              </div>
              
              <div className="form-group">
                <label>Coleta Agendada</label>
                <input type="datetime-local" name="scheduledCollection" value={formData.scheduledCollection} onChange={handleInputChange} className="modal-input" required />
              </div>
              <div className="form-group">
                <label>Entrega Agendada</label>
                <input type="datetime-local" name="scheduledDelivery" value={formData.scheduledDelivery} onChange={handleInputChange} className="modal-input" required />
              </div>

              {/* Vínculos Administrativos */}
              <div className="form-group">
                <label>UUID Transportadora / Viagem</label>
                <input type="text" name="transportId" value={formData.transportId} onChange={handleInputChange} className="modal-input" required placeholder="ID da viagem" />
              </div>
              <div className="form-group">
                <label>Sequência de Entrega</label>
                <input type="number" name="deliverySequence" value={formData.deliverySequence} onChange={handleInputChange} className="modal-input" required />
              </div>

              {/* Vínculos de IDs (Esquerda) */}
              <div className="form-group">
                <label>UUID Usuário (Operador)</label>
                <input type="text" name="userId" value={formData.userId} onChange={handleInputChange} className="modal-input" required />
              </div>
              <div className="form-group">
                <label>UUID Tipo de Entrega</label>
                <input type="text" name="deliveryTypeId" value={formData.deliveryTypeId} onChange={handleInputChange} className="modal-input" required />
              </div>
              <div className="form-group">
                <label>UUID Tipo de Transporte</label>
                <input type="text" name="typeTransportId" value={formData.typeTransportId} onChange={handleInputChange} className="modal-input" required />
              </div>

              {/* Vínculos Geográficos (Direita) */}
              <div className="form-group">
                <label>UUID Empresa (Coleta)</label>
                <input type="text" name="customerCollectsId" value={formData.customerCollectsId} onChange={handleInputChange} className="modal-input" required />
              </div>
              <div className="form-group">
                <label>UUID Endereço (Origem)</label>
                <input type="text" name="originAdrressId" value={formData.originAdrressId} onChange={handleInputChange} className="modal-input" required />
              </div>
              
              <div className="form-group">
                <label>UUID Empresa (Destino)</label>
                <input type="text" name="customerDeliveryId" value={formData.customerDeliveryId} onChange={handleInputChange} className="modal-input" required />
              </div>
              <div className="form-group">
                <label>UUID Endereço (Destino)</label>
                <input type="text" name="destinationAddressId" value={formData.destinationAddressId} onChange={handleInputChange} className="modal-input" required />
              </div>
            </div>

            {/* Actions */}
            <div className="modal-action-buttons" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={onClose} style={{ padding: '0.85rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', flex: '0 1 120px' }}>
                Cancelar
              </button>
              <button type="submit" className="btn-confirm" style={{ flex: '0 1 180px' }}>
                <Save size={16} /> Salvar Entrega
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeliveryModal;
