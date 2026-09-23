import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package, FastForward, Save, Truck } from 'lucide-react';
import '../styles/TransportModal.css';
import MapComponent from './MapComponent';
import DeliveryModal from './DeliveryModal';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';
import { driverService } from '../services/driverService';
import { companyService } from '../services/companyService';
import { equipamentGroupService } from '../services/equipamentGroupService';
import { useToast } from './ToastContext';

const TransportModal = ({ isOpen, onClose, onSuccess }) => {
  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [equipGroups, setEquipGroups] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const { showToast } = useToast();

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

  const loadPendingDeliveries = async () => {
    setLoadingDeliveries(true);
    try {
      const data = await deliveryService.getAll();
      // Filtrar as entregas que não têm transporte atrelado
      const filtered = (data || []).filter(s => !s.transport && (!s.status || s.status.toUpperCase() === 'PENDENTE' || s.status.toUpperCase() === 'PENDING' || s.status === ''));
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
        setCompanies((companiesData || []).filter(c => !c.isCliente));
        setEquipGroups(groupsData || []);
      } catch (err) {
        console.error("Erro ao carregar dados do modal de transporte:", err);
      }
    };
    loadModalData();
    loadPendingDeliveries();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransportFormData({ ...transportFormData, [name]: value });
  };

  const handleCreateTransport = async () => {
    try {
      await transportService.create(transportFormData);
      showToast('Viagem salva com sucesso!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar viagem:', error);
      showToast('Erro ao salvar viagem. Verifique se os dados estão corretos.', 'error');
    }
  };

  const handleSaveDelivery = async (deliveryData) => {
    try {
      await deliveryService.create(deliveryData);
      showToast('Entrega salva com sucesso!', 'success');
      setIsDeliveryModalOpen(false);
      loadPendingDeliveries();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao salvar entrega:', error);
      showToast('Erro ao salvar entrega.', 'error');
    }
  };

  const handleOptimize = async () => {
    try {
      await transportService.optimizeRoutes();
      showToast('Otimização de rotas concluída com sucesso!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao otimizar rotas no modal:", err);
      showToast("Erro ao otimizar rotas.", 'error');
    }
  };

  return createPortal(
    <div className="modal-overlay fade-in">
      <div className="modal-content" style={{ maxWidth: '960px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={22} color="var(--primary-color)" />
            Novo Transporte / Roteirização
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '1.5rem' }}>
          <div className="form-grid form-grid-2">
            
            <div className="form-group">
              <label className="form-label">Motorista Alocado</label>
              <select name="driverId" value={transportFormData.driverId} onChange={handleInputChange} className="form-select" required>
                <option value="">Selecione o motorista...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name || `Motorista #${d.id.substring(0,8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Empresa Transportadora</label>
              <select name="transporterId" value={transportFormData.transporterId} onChange={handleInputChange} className="form-select" required>
                <option value="">Selecione a transportadora...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.legalName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Conjunto de Equipamentos (Cavalo + Carretas)</label>
              <select name="equipamentGroupId" value={transportFormData.equipamentGroupId} onChange={handleInputChange} className="form-select" required>
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

          </div>

          {/* Pending Deliveries Section */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                Entregas no Backlog ({pendingDeliveries.length})
              </h3>
              <button type="button" className="btn btn-outline" style={{ fontSize: '0.8125rem' }} onClick={() => setIsDeliveryModalOpen(true)}>
                <Plus size={16} /> Adicionar Nova Entrega
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table className="tms-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Operação</th>
                    <th>Cliente</th>
                    <th>Cidade / Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeliveries.map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td style={{ fontWeight: 700 }}>#{s.id ? s.id.substring(0, 8) : 'N/A'}</td>
                      <td>{s.typeOperation || 'ENTREGA'}</td>
                      <td>{s.customer?.legalName || '-'}</td>
                      <td>{s.address?.city || s.customer?.address?.city || 'Araras'} - {s.address?.state || s.customer?.address?.state || 'SP'}</td>
                    </tr>
                  ))}
                  {pendingDeliveries.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                        Nenhuma entrega pendente de alocação.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleOptimize}>
            <FastForward size={16} /> Otimizar Rotas
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCreateTransport}>
            <Save size={16} /> Salvar Viagem
          </button>
        </div>
      </div>

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
