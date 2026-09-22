import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Save } from 'lucide-react';
import { userService } from '../services/userService';
import { shipmentTypeService } from '../services/shipmentTypeService';
import { typeTransportService } from '../services/typeTransportService';
import { companyService } from '../services/companyService';
import { addressService } from '../services/addressService';
import { deliveryService } from '../services/deliveryService';

const DEFAULT_FORM_DATA = {
  typeOperation: 'ENTREGA',
  weight: '',
  volume: '',
  scheduledCollection: '',
  scheduledDelivery: '',
  routePlanned: 'Rota a definir',
  routeCompleted: 'Rota a definir',
  status: 'PENDENTE',
  deliverySequence: 1,
  userId: '',
  deliveryTypeId: '',
  typeTransportId: '',
  originAdrressId: '',
  destinationAddressId: '',
  customerCollectsId: '',
  customerDeliveryId: '',
  operationOrigemId: ''
};

// Maps a shipment record (ShipmentResponse) back to the modal's form shape for editing
const mapShipmentToForm = (s) => {
  const isColeta = s.typeOperation === 'COLETA';
  const scheduled = (s.shedulind || s.schedulind || '').toString().slice(0, 16);
  return {
    ...DEFAULT_FORM_DATA,
    typeOperation: s.typeOperation || 'ENTREGA',
    weight: isColeta ? '' : (s.weight ?? ''),
    volume: isColeta ? '' : (s.volume ?? ''),
    scheduledCollection: isColeta ? scheduled : '',
    scheduledDelivery: isColeta ? '' : scheduled,
    status: s.status || 'PENDENTE',
    deliverySequence: s.routeStop?.sequenceOrder ?? 1,
    userId: s.user?.id || '',
    deliveryTypeId: s.shipmentType?.id || '',
    typeTransportId: s.typeTransport?.id || '',
    originAdrressId: isColeta ? (s.address?.id || '') : '',
    destinationAddressId: isColeta ? '' : (s.address?.id || ''),
    customerCollectsId: isColeta ? (s.customer?.id || '') : '',
    customerDeliveryId: isColeta ? '' : (s.customer?.id || ''),
    operationOrigemId: s.operationOrigem?.id || ''
  };
};

const DeliveryModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [users, setUsers] = useState([]);
  const [shipmentTypes, setShipmentTypes] = useState([]);
  const [typeTransports, setTypeTransports] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    // Populate the form: edit mode fills from initialData, create mode resets to defaults
    const loadSelectData = async () => {
      setFormData(initialData ? mapShipmentToForm(initialData) : DEFAULT_FORM_DATA);
      try {
        const [usersData, typesData, transData, compsData, addrsData, shipmentsData] = await Promise.all([
          userService.getAllUsers(),
          shipmentTypeService.getAll(),
          typeTransportService.getAll(),
          companyService.getAllCompanies(),
          addressService.getAll(),
          deliveryService.getAll()
        ]);
        setUsers(usersData || []);
        setShipmentTypes(typesData || []);
        setTypeTransports(transData || []);
        setCompanies(compsData || []);
        setAddresses(addrsData || []);
        setCollections((shipmentsData || []).filter(s => s.typeOperation === 'COLETA'));
      } catch (e) {
        console.error("Erro ao carregar dados em DeliveryModal:", e);
      }
    };
    loadSelectData();
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // ENTREGA: peso e volume são informados no formulário.
    // COLETA: não são informados — envia zero (a validação da API exige o campo;
    // o peso/volume real é atribuído quando uma entrega é vinculada à coleta).
    const isColetaOp = formData.typeOperation === 'COLETA';
    onSave(
      {
        ...formData,
        weight: isColetaOp ? 0.0 : formData.weight,
        volume: isColetaOp ? 0.0 : formData.volume
      },
      initialData?.id
    );
  };

  const isColeta = formData.typeOperation === 'COLETA';

  return createPortal(
    <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={24} color="var(--primary-color)" />
            {isEditing ? 'Editar Remessa' : 'Nova Remessa'}
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
                <strong>Vínculo de Viagem:</strong> Selecione abaixo os elementos de cadastro para vincular à remessa.
              </p>
            </div>

            {/* Tipo de Operação: Coleta ou Entrega */}
            <div className="form-group">
              <label>Tipo de Operação</label>
              <select name="typeOperation" value={formData.typeOperation} onChange={handleInputChange} className="modal-input" required>
                <option value="ENTREGA">Entrega</option>
                <option value="COLETA">Coleta</option>
              </select>
            </div>

            {/* Coleta de origem: vincula a entrega à coleta que a originou */}
            {formData.typeOperation === 'ENTREGA' && (
              <div className="form-group">
                <label>Coleta de Origem</label>
                <select name="operationOrigemId" value={formData.operationOrigemId} onChange={handleInputChange} className="modal-input">
                  <option value="">Nenhuma (opcional)...</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.id.substring(0, 8)} - {c.customer?.legalName || 'Cliente'} ({c.weight || 0}kg / {c.volume || 0}m³)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Peso e volume só na ENTREGA. Na COLETA são atribuídos pela API quando uma entrega é vinculada a ela. */}
              {!isColeta && (
                <>
                  <div className="form-group">
                    <label>Peso (Kg)</label>
                    <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleInputChange} className="modal-input" required />
                  </div>
                  <div className="form-group">
                    <label>Volume (m³)</label>
                    <input type="number" step="0.01" name="volume" value={formData.volume} onChange={handleInputChange} className="modal-input" required />
                  </div>
                </>
              )}

              {isColeta && (
                <div className="form-group">
                  <label>Coleta Agendada</label>
                  <input type="datetime-local" name="scheduledCollection" value={formData.scheduledCollection} onChange={handleInputChange} className="modal-input" required />
                </div>
              )}
              {!isColeta && (
                <div className="form-group">
                  <label>Entrega Agendada</label>
                  <input type="datetime-local" name="scheduledDelivery" value={formData.scheduledDelivery} onChange={handleInputChange} className="modal-input" required />
                </div>
              )}


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

              {/* Vínculos Geográficos — mesmo atributo na tabela; o rótulo muda conforme a operação.
                  COLETA usa customerCollectsId / originAdrressId, ENTREGA usa customerDeliveryId / destinationAddressId
                  (o buildShipmentPayload consolida ambos em customerId / addressId). */}
              <div className="form-group">
                <label>{isColeta ? 'Empresa (Coleta)' : 'Empresa (Entrega)'}</label>
                <select
                  name={isColeta ? 'customerCollectsId' : 'customerDeliveryId'}
                  value={isColeta ? formData.customerCollectsId : formData.customerDeliveryId}
                  onChange={handleInputChange}
                  className="modal-input"
                  required
                >
                  <option value="">{isColeta ? 'Selecione a empresa de coleta...' : 'Selecione a empresa de entrega...'}</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.legalName} ({c.isCliente ? 'Cliente' : 'Fornecedor'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{isColeta ? 'Endereço (Coleta)' : 'Endereço (Entrega)'}</label>
                <select
                  name={isColeta ? 'originAdrressId' : 'destinationAddressId'}
                  value={isColeta ? formData.originAdrressId : formData.destinationAddressId}
                  onChange={handleInputChange}
                  className="modal-input"
                  required
                >
                  <option value="">{isColeta ? 'Selecione o endereço de coleta...' : 'Selecione o endereço de entrega...'}</option>
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
                <Save size={16} /> {isEditing ? 'Atualizar' : 'Salvar Remessa'}
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
