import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Save, Truck } from 'lucide-react';
import '../styles/TransportModal.css';
import MapComponent from './MapComponent';
import DeliveryModal from './DeliveryModal';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';
import { driverService } from '../services/driverService';
import { extractErrorMessage } from '../utils/errorUtils';
import { loadTenantOptions, defaultTenantId, tenantLabel } from '../utils/tenantOptions';
import { equipamentGroupService } from '../services/equipamentGroupService';
import { useToast } from './ToastContext';

const TransportModal = ({ isOpen, onClose, onSuccess }) => {
  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [equipGroups, setEquipGroups] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState([]);
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
    if (!isOpen) {
      setSelectedDeliveryIds([]);
      return;
    }

    const loadModalData = async () => {
      try {
        const [driversData, tenantList, groupsData] = await Promise.all([
          driverService.getAll(),
          loadTenantOptions(),
          equipamentGroupService.getAll()
        ]);
        setDrivers(driversData || []);
        setCompanies(tenantList);
        setEquipGroups(groupsData || []);
        setTransportFormData(prev => ({ ...prev, transporterId: prev.transporterId || defaultTenantId(tenantList) }));
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

  const toggleSelectAll = () => {
    if (selectedDeliveryIds.length === pendingDeliveries.length) {
      setSelectedDeliveryIds([]);
    } else {
      setSelectedDeliveryIds(pendingDeliveries.map(d => d.id).filter(Boolean));
    }
  };

  const toggleSelectDelivery = (id) => {
    if (!id) return;
    setSelectedDeliveryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateTransport = async () => {
    if (!transportFormData.driverId || !transportFormData.equipamentGroupId) {
      showToast('Selecione o motorista e o conjunto de equipamentos.', 'error');
      return;
    }
    try {
      await transportService.create({
        ...transportFormData,
        deliveryQuantity: selectedDeliveryIds.length,
        shipmentIds: selectedDeliveryIds
      });
      showToast('Viagem salva com sucesso!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar viagem:', error);
      showToast(extractErrorMessage(error, 'Erro ao salvar viagem.'), 'error');
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
      showToast(extractErrorMessage(error, 'Erro ao salvar entrega.'), 'error');
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
                    {d.name || d.user?.name || `Motorista #${d.id.substring(0,8)}`}
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
                    {tenantLabel(c)}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
                  Entregas no Backlog ({pendingDeliveries.length})
                </h3>
                {selectedDeliveryIds.length > 0 && (
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #333)', background: 'var(--bg-active, #e0f2fe)', padding: '2px 8px', borderRadius: '4px' }}>
                    {selectedDeliveryIds.length} selecionada{selectedDeliveryIds.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button type="button" className="btn btn-outline" style={{ fontSize: '0.8125rem' }} onClick={() => setIsDeliveryModalOpen(true)}>
                <Plus size={16} /> Adicionar Nova Entrega
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table className="tms-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={pendingDeliveries.length > 0 && selectedDeliveryIds.length === pendingDeliveries.length}
                        onChange={toggleSelectAll}
                        title="Selecionar todas"
                        aria-label="Selecionar todas"
                      />
                    </th>
                    <th>Código</th>
                    <th>Operação</th>
                    <th>Cliente</th>
                    <th>Cidade / Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeliveries.map((s, idx) => {
                    const isSelected = selectedDeliveryIds.includes(s.id);
                    return (
                      <tr
                        key={s.id || idx}
                        onClick={() => s.id && toggleSelectDelivery(s.id)}
                        style={{ cursor: 'pointer', backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.08)' : undefined }}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectDelivery(s.id)}
                            aria-label={`Selecionar entrega ${s.id}`}
                          />
                        </td>
                        <td style={{ fontWeight: 700 }}>#{s.id ? s.id.substring(0, 8) : 'N/A'}</td>
                        <td>{s.typeOperation || 'ENTREGA'}</td>
                        <td>{s.customer?.legalName || '-'}</td>
                        <td>{s.address?.city || s.customer?.address?.city || 'Araras'} - {s.address?.state || s.customer?.address?.state || 'SP'}</td>
                      </tr>
                    );
                  })}
                  {pendingDeliveries.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
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
