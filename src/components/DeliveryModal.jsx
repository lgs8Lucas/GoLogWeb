import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Save } from 'lucide-react';
import { userService } from '../services/userService';
import { shipmentTypeService } from '../services/shipmentTypeService';
import { typeTransportService } from '../services/typeTransportService';
import { companyService } from '../services/companyService';
import { addressService } from '../services/addressService';

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
    typeTransportId: '',
    originAdrressId: '',
    destinationAddressId: '',
    customerCollectsId: '',
    customerDeliveryId: ''
  });

  const [users, setUsers] = useState([]);
  const [shipmentTypes, setShipmentTypes] = useState([]);
  const [typeTransports, setTypeTransports] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const loadSelectData = async () => {
      try {
        const [usersData, typesData, transData, compsData, addrsData] = await Promise.all([
          userService.getAllUsers(),
          shipmentTypeService.getAll(),
          typeTransportService.getAll(),
          companyService.getAllCompanies(),
          addressService.getAll()
        ]);
        setUsers(usersData || []);
        setShipmentTypes(typesData || []);
        setTypeTransports(transData || []);
        setCompanies(compsData || []);
        setAddresses(addrsData || []);
      } catch (e) {
        console.error("Erro ao carregar dados em DeliveryModal:", e);
      }
    };
    loadSelectData();
  }, [isOpen]);

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
            
            {/* Informações de Seleção de Elementos */}
            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--primary-color)', margin: 0 }}>
                <strong>Vínculo de Viagem:</strong> Selecione abaixo os elementos de cadastro para vincular à entrega.
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


              <div className="form-group">
                <label>Sequência de Entrega</label>
                <input type="number" name="deliverySequence" value={formData.deliverySequence} onChange={handleInputChange} className="modal-input" required />
              </div>

              {/* Vínculos de IDs (Esquerda) */}
              <div className="form-group">
                <label>Usuário (Operador)</label>
                <select name="userId" value={formData.userId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione o operador...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.userProfile})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de Entrega</label>
                <select name="deliveryTypeId" value={formData.deliveryTypeId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione o tipo de entrega...</option>
                  {shipmentTypes.map(st => (
                    <option key={st.id} value={st.id}>{st.name || `Tipo #${st.id.substring(0,8)}`}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de Transporte</label>
                <select name="typeTransportId" value={formData.typeTransportId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione o tipo de transporte...</option>
                  {typeTransports.map(tt => (
                    <option key={tt.id} value={tt.id}>{tt.name || `Transporte #${tt.id.substring(0,8)}`}</option>
                  ))}
                </select>
              </div>

              {/* Vínculos Geográficos (Direita) */}
              <div className="form-group">
                <label>Empresa (Coleta)</label>
                <select name="customerCollectsId" value={formData.customerCollectsId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione a empresa de coleta...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.legalName} ({c.isCliente ? 'Cliente' : 'Fornecedor'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Endereço (Origem)</label>
                <select name="originAdrressId" value={formData.originAdrressId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione o endereço de origem...</option>
                  {addresses.map(a => (
                    <option key={a.id} value={a.id}>{a.street}, {a.number} - {a.city}/{a.state}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Empresa (Destino)</label>
                <select name="customerDeliveryId" value={formData.customerDeliveryId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione a empresa de destino...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.legalName} ({c.isCliente ? 'Cliente' : 'Fornecedor'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Endereço (Destino)</label>
                <select name="destinationAddressId" value={formData.destinationAddressId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione o endereço de destino...</option>
                  {addresses.map(a => (
                    <option key={a.id} value={a.id}>{a.street}, {a.number} - {a.city}/{a.state}</option>
                  ))}
                </select>
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
