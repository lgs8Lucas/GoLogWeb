import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarClock, Plus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { workScheduleService } from '../services/workScheduleService';
import { driverService } from '../services/driverService';
import { equipamentGroupService } from '../services/equipamentGroupService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/Profiles.css';

const STATUS_LABELS = {
  ATIVO: 'Ativo',
  DESATIVADO: 'Desativado'
};

const driverLabel = (d) => d.name || d.user?.name || `Motorista #${d.id.substring(0, 8)}`;

const groupLabel = (g) => {
  const plates = [g.equipament1?.plate, g.equipament2?.plate, g.equipament3?.plate].filter(Boolean);
  return plates.length > 0 ? plates.join(' + ') : `Conjunto #${g.id.substring(0, 8)}`;
};

const toTimeInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.substring(0, 5);
  if (typeof value === 'object' && value.hour !== undefined) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(value.hour)}:${pad(value.minute)}`;
  }
  return '';
};

const WorkSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  const [drivers, setDrivers] = useState([]);
  const [equipamentGroups, setEquipamentGroups] = useState([]);

  const initialFormState = {
    driverId: '',
    equipamentGroupId: '',
    scheduleDate: '',
    startWorkday: '',
    endWorkday: '',
    status: 'ATIVO'
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await workScheduleService.getAll();
      setSchedules(data || []);
    } catch (error) {
      console.error('Erro ao carregar escalas de trabalho:', error);
      showToast('Erro ao carregar lista de escalas de trabalho.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    const loadSelectData = async () => {
      try {
        const [driversData, groupsData] = await Promise.all([
          driverService.getAll(),
          equipamentGroupService.getAll()
        ]);
        setDrivers(driversData || []);
        setEquipamentGroups(groupsData || []);
      } catch (err) {
        console.error('Erro ao carregar motoristas/conjuntos:', err);
        showToast('Erro ao carregar motoristas ou conjuntos.', 'error');
      }
    };
    loadSelectData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        driverId: formData.driverId,
        equipamentGroupId: formData.equipamentGroupId,
        scheduleDate: formData.scheduleDate,
        startWorkday: formData.startWorkday,
        endWorkday: formData.endWorkday,
        status: formData.status
      };
      if (editingId) {
        await workScheduleService.update(editingId, payload);
        showToast('Escala de trabalho atualizada com sucesso!', 'success');
      } else {
        await workScheduleService.create(payload);
        showToast('Escala de trabalho criada com sucesso!', 'success');
      }
      handleCloseModal();
      fetchSchedules();
    } catch (error) {
      console.error('Erro ao salvar escala de trabalho:', error.response?.data ?? error);
      const data = error.response?.data;
      let mensagens = 'Erro ao salvar escala de trabalho. Verifique se os campos foram preenchidos corretamente.';
      if (Array.isArray(data)) {
        mensagens = data.join('\n');
      } else if (typeof data === 'string' && data.trim()) {
        mensagens = data;
      } else if (data?.message) {
        mensagens = data.message;
      } else if (data?.detail) {
        mensagens = data.detail;
      } else if (data?.error) {
        mensagens = data.error;
      }
      showToast(mensagens, 'error');
    }
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setFormData({
      driverId: row.driver?.id || '',
      equipamentGroupId: row.equipamentGroup?.id || '',
      scheduleDate: row.scheduleDate || '',
      startWorkday: toTimeInputValue(row.startWorkday),
      endWorkday: toTimeInputValue(row.endWorkday),
      status: row.status || 'ATIVO'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    setScheduleToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;
    try {
      await workScheduleService.delete(scheduleToDelete.id);
      showToast('Escala de trabalho excluída com sucesso!', 'success');
      fetchSchedules();
    } catch (error) {
      console.error('Erro ao excluir escala de trabalho:', error);
      const msg = error.response?.data?.message || 'Erro ao excluir escala de trabalho.';
      showToast(msg, 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setScheduleToDelete(null);
    }
  };

  const columns = [
    { label: 'Motorista', key: 'motorista', render: (row) => row.driver ? driverLabel(row.driver) : '-' },
    { label: 'Conjunto / Placas', key: 'conjunto', render: (row) => row.equipamentGroup ? groupLabel(row.equipamentGroup) : '-' },
    {
      label: 'Data da Escala',
      key: 'scheduleDate',
      render: (row) => row.scheduleDate ? new Date(`${row.scheduleDate}T00:00:00`).toLocaleDateString('pt-BR') : '-'
    },
    {
      label: 'Turno',
      key: 'turno',
      render: (row) => {
        const start = toTimeInputValue(row.startWorkday);
        const end = toTimeInputValue(row.endWorkday);
        return start || end ? `${start || '--:--'} às ${end || '--:--'}` : '-';
      }
    },
    { label: 'Status', key: 'status', render: (row) => STATUS_LABELS[row.status] || row.status || '-' }
  ];

  return (
    <div className="profiles-container fade-in">
      <PageHeader
        title="Escala de Trabalho"
        description="Defina qual motorista opera qual conjunto de veículos em cada data."
        icon={CalendarClock}
        onBack={true}
      >
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Nova Escala
        </button>
      </PageHeader>

      <div className="profiles-content">
        <DataTable
          columns={columns}
          data={schedules}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          emptyMessage="Nenhuma escala de trabalho cadastrada."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarClock size={24} color="var(--primary-color)" />
                {editingId ? 'Editar Escala' : 'Nova Escala'}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Motorista</label>
                  <select
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleInputChange}
                    className="modal-input"
                    required
                  >
                    <option value="">Selecione o motorista...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{driverLabel(d)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Conjunto (Veículos)</label>
                  <select
                    name="equipamentGroupId"
                    value={formData.equipamentGroupId}
                    onChange={handleInputChange}
                    className="modal-input"
                    required
                  >
                    <option value="">Selecione o conjunto...</option>
                    {equipamentGroups.map(g => (
                      <option key={g.id} value={g.id}>{groupLabel(g)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Data da Escala</label>
                  <input
                    type="date"
                    name="scheduleDate"
                    value={formData.scheduleDate}
                    onChange={handleInputChange}
                    className="modal-input"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Início do Turno</label>
                    <input
                      type="time"
                      name="startWorkday"
                      value={formData.startWorkday}
                      onChange={handleInputChange}
                      className="modal-input"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Final do Turno</label>
                    <input
                      type="time"
                      name="endWorkday"
                      value={formData.endWorkday}
                      onChange={handleInputChange}
                      className="modal-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="modal-input"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="DESATIVADO">Desativado</option>
                  </select>
                </div>

                <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-cancel" onClick={handleCloseModal} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save" style={{ padding: '0.75rem 1.5rem', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                    {editingId ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Escala de Trabalho"
        message="Tem certeza que deseja excluir esta escala de trabalho?"
      />
    </div>
  );
};

export default WorkSchedulePage;
