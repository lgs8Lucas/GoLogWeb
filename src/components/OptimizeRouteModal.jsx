import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FastForward } from 'lucide-react';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';
import { workScheduleService } from '../services/workScheduleService';
import { useToast } from './ToastContext';

const driverLabel = (d) => d?.name || d?.user?.name || (d?.id ? `Motorista #${d.id.substring(0, 8)}` : 'Sem motorista');

const groupLabel = (g) => {
  const plates = [g?.equipament1?.plate, g?.equipament2?.plate, g?.equipament3?.plate].filter(Boolean);
  return plates.length > 0 ? plates.join(' + ') : (g?.id ? `Conjunto #${g.id.substring(0, 8)}` : 'Sem conjunto');
};

const checkboxListStyle = {
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  maxHeight: '260px',
  overflowY: 'auto',
  padding: '0.5rem'
};

const checkboxItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.5rem',
  padding: '0.5rem',
  borderBottom: '1px solid var(--border-color)',
  cursor: 'pointer'
};

const ROUTE_PRIORITY_OPTIONS = [
  { value: 'ECONOMIA', label: 'Economia', description: 'Prioriza o menor custo de viagem' },
  { value: 'EQUILIBRIO', label: 'Equilíbrio', description: 'Balanceia custo e tempo de viagem' },
  { value: 'TEMPO', label: 'Tempo', description: 'Prioriza a rota mais rápida' }
];

const OptimizeRouteModal = ({ isOpen, onClose, onSuccess }) => {
  const [shipments, setShipments] = useState([]);
  const [workSchedules, setWorkSchedules] = useState([]);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState([]);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState([]);
  const [routePriority, setRoutePriority] = useState('EQUILIBRIO');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    setSelectedShipmentIds([]);
    setSelectedScheduleIds([]);
    setRoutePriority('EQUILIBRIO');
    setLoading(true);

    const loadData = async () => {
      try {
        const [shipmentsData, schedulesData] = await Promise.all([
          deliveryService.getByStatus('PENDENTE'),
          workScheduleService.getAll()
        ]);
        setShipments(shipmentsData || []);
        setWorkSchedules((schedulesData || []).filter(s => s.status === 'ATIVO'));
      } catch (err) {
        console.error('Erro ao carregar dados para otimização de rotas:', err);
        showToast('Erro ao carregar remessas e escalas de trabalho.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleId = (list, setList, id) => {
    setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
  };

  const toggleAll = (items, selected, setSelected) => {
    setSelected(selected.length === items.length ? [] : items.map(i => i.id));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await transportService.optimizeRoutes({
        shipmentIds: selectedShipmentIds,
        workScheduleIds: selectedScheduleIds,
        routePriority
      });
      showToast('Rotas otimizadas com sucesso!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao otimizar rotas:', error);
      const data = error.response?.data;
      const mensagem = (typeof data === 'string' && data.trim()) || data?.message || data?.detail || 'Erro ao otimizar rotas.';
      showToast(mensagem, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FastForward size={24} color="var(--primary-color)" />
            Otimizar Rotas
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '1.5rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>Carregando remessas e escalas...</p>
          ) : (
            <>
              <div className="form-group">
                <label>Prioridade da Otimização</label>
                <select
                  className="modal-input"
                  value={routePriority}
                  onChange={(e) => setRoutePriority(e.target.value)}
                >
                  {ROUTE_PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Remessas Pendentes ({selectedShipmentIds.length}/{shipments.length})</span>
                  <button type="button" className="btn-cancel" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => toggleAll(shipments, selectedShipmentIds, setSelectedShipmentIds)}>
                    {selectedShipmentIds.length === shipments.length && shipments.length > 0 ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </label>
                <div style={checkboxListStyle}>
                  {shipments.length === 0 && <p style={{ padding: '0.5rem', color: 'var(--text-light)' }}>Nenhuma remessa pendente.</p>}
                  {shipments.map(s => (
                    <label key={s.id} style={checkboxItemStyle}>
                      <input
                        type="checkbox"
                        checked={selectedShipmentIds.includes(s.id)}
                        onChange={() => toggleId(selectedShipmentIds, setSelectedShipmentIds, s.id)}
                      />
                      <span>
                        <strong>#{s.id.substring(0, 8)}</strong> — {s.typeOperation || 'ENTREGA'} — {s.customer?.legalName || 'Sem cliente'}
                        <br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          {s.weight || 0} kg | {s.volume || 0} m³ | {s.address?.city || s.customer?.address?.city || 'Araras'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Escalas de Trabalho Ativas ({selectedScheduleIds.length}/{workSchedules.length})</span>
                  <button type="button" className="btn-cancel" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => toggleAll(workSchedules, selectedScheduleIds, setSelectedScheduleIds)}>
                    {selectedScheduleIds.length === workSchedules.length && workSchedules.length > 0 ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </label>
                <div style={checkboxListStyle}>
                  {workSchedules.length === 0 && <p style={{ padding: '0.5rem', color: 'var(--text-light)' }}>Nenhuma escala de trabalho ativa.</p>}
                  {workSchedules.map(w => (
                    <label key={w.id} style={checkboxItemStyle}>
                      <input
                        type="checkbox"
                        checked={selectedScheduleIds.includes(w.id)}
                        onChange={() => toggleId(selectedScheduleIds, setSelectedScheduleIds, w.id)}
                      />
                      <span>
                        <strong>{driverLabel(w.driver)}</strong> — {groupLabel(w.equipamentGroup)}
                        <br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          {w.scheduleDate ? new Date(`${w.scheduleDate}T00:00:00`).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-cancel" onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-save"
              onClick={handleSubmit}
              disabled={loading || submitting || selectedShipmentIds.length === 0 || selectedScheduleIds.length === 0}
              style={{ padding: '0.75rem 1.5rem', color: 'white', backgroundColor: 'var(--success-color, #2f9e44)', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: (loading || submitting || selectedShipmentIds.length === 0 || selectedScheduleIds.length === 0) ? 0.6 : 1 }}
            >
              {submitting ? 'Otimizando...' : 'Otimizar Rotas'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OptimizeRouteModal;
