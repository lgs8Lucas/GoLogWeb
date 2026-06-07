import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package, FastForward, Save } from 'lucide-react';
import '../styles/TransportModal.css';
import MapComponent from './MapComponent';
import DeliveryModal from './DeliveryModal';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';
import { driverService } from '../services/driverService';
import { companyService } from '../services/companyService';
import { equipamentGroupService } from '../services/equipamentGroupService';

const TransportModal = ({ isOpen, onClose, onSuccess }) => {
  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [equipGroups, setEquipGroups] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const loadPendingDeliveries = async () => {
    setLoadingDeliveries(true);
    try {
      const data = await deliveryService.getAll();
      // Filtrar as entregas que não têm transporte atrelado
      const filtered = (data || []).filter(s => !s.transport && (!s.status || s.status.toUpperCase() === 'PENDING' || s.status === ''));
      setPendingDeliveries(filtered);
    } catch (err) {
      console.error("Erro ao carregar entregas pendentes:", err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const loadModalData = async () => {
      try {
        const [driversData, companiesData, groupsData] = await Promise.all([
          driverService.getAll(),
          companyService.getAllCompanies(),
          equipamentGroupService.getAll()
        ]);
        setDrivers(driversData || []);
        // Filtra empresas para pegar transportadoras (onde isCliente === false)
        setCompanies((companiesData || []).filter(c => !c.isCliente));
        setEquipGroups(groupsData || []);
      } catch (err) {
        console.error("Erro ao carregar dados do modal de transporte:", err);
      }
    };
    loadModalData();
    loadPendingDeliveries();
  }, [isOpen]);

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
      alert('Viagem salva com sucesso!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar viagem:', error);
      alert('Erro ao salvar viagem. Verifique se os dados estão corretos.');
    }
  };

  const handleSaveDelivery = async (deliveryData) => {
    try {
      await deliveryService.create(deliveryData);
      alert('Entrega salva com sucesso!');
      setIsDeliveryModalOpen(false);
      loadPendingDeliveries();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao salvar entrega:', error);
      alert('Erro ao salvar entrega.');
    }
  };

  const handleOptimize = async () => {
    try {
      await transportService.optimizeRoutes();
      alert('Otimização de rotas concluída com sucesso!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao otimizar rotas no modal:", err);
      alert("Erro ao otimizar rotas.");
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
                <label>Motorista</label>
                <select name="driverId" value={transportFormData.driverId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione o motorista...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.user?.name || `Motorista #${d.id.substring(0,8)}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Empresa Transportadora</label>
                <select name="transporterId" value={transportFormData.transporterId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione a transportadora...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.legalName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Delivery Cards Carousel */}
              <div className="deliveries-carousel">
                {/* Add Delivery Button Card */}
                <button className="delivery-card add-delivery-card" onClick={() => setIsDeliveryModalOpen(true)}>
                  <Plus size={48} color="var(--border-medium)" strokeWidth={1} />
                  <span>Adicionar<br />entrega</span>
                </button>

                {pendingDeliveries.map((s, index) => (
                  <div key={s.id || index} className="delivery-card outline-card">
                    <div className="delivery-card-icon">
                      <Package size={40} color="var(--primary-color)" strokeWidth={1.5} />
                    </div>
                    <div className="delivery-card-info">
                      <strong>#{s.id ? s.id.substring(0, 8) : `Carga #${index+1}`}</strong>
                      <span>{s.typeOperation}</span>
                      <span>{s.weight || 0} kg | {s.volume || 0} m³</span>
                      <span style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.customer?.legalName || 'Sem cliente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Linked Deliveries Table */}
              <div className="linked-deliveries-section">
                <h3>Cargas Aguardando Roteirização ({pendingDeliveries.length})</h3>
                <div className="linked-table-wrapper">
                  <table className="linked-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Operação</th>
                        <th>Cliente</th>
                        <th>Cidade/Destino</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDeliveries.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td>{s.id ? s.id.substring(0, 8) : 'N/A'}</td>
                          <td>{s.typeOperation || 'ENTREGA'}</td>
                          <td>{s.customer?.legalName || '-'}</td>
                          <td>{s.address?.city || s.customer?.address?.city || 'Araras'} - {s.address?.state || s.customer?.address?.state || 'SP'}</td>
                        </tr>
                      ))}
                      {pendingDeliveries.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-light)' }}>Nenhuma entrega pendente.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-action-buttons">
                <button className="btn-optimize" onClick={handleOptimize}>
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
                <label>Conjunto de Equipamentos</label>
                <select name="equipamentGroupId" value={transportFormData.equipamentGroupId} onChange={handleInputChange} className="modal-input" required>
                  <option value="">Selecione o conjunto...</option>
                  {equipGroups.map(g => {
                    const plates = [];
                    if (g.equipament1?.plate) plates.push(g.equipament1.plate);
                    if (g.equipament2?.plate) plates.push(g.equipament2.plate);
                    if (g.equipament3?.plate) plates.push(g.equipament3.plate);
                    const plateStr = plates.length > 0 ? ` (${plates.join(' + ')})` : '';
                    return (
                      <option key={g.id} value={g.id}>
                        {g.observation || `Conjunto #${g.id.substring(0,8)}`}{plateStr}
                      </option>
                    );
                  })}
                </select>
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
