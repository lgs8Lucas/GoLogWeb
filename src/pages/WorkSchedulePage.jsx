import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarClock, Plus, X, Clock, ShieldCheck, Settings, Sliders, Coffee, User, Layers, Truck, Box } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { workScheduleService } from '../services/workScheduleService';
import { workShiftTemplateService } from '../services/workShiftTemplateService';
import { driverService } from '../services/driverService';
import { equipamentGroupService } from '../services/equipamentGroupService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { translateStatus } from '../utils/enumTranslations';
import '../styles/Profiles.css';

const STATUS_LABELS = {
  ATIVO: 'Ativo',
  DESATIVADO: 'Desativado'
};

const SHIFT_TYPE_LABELS = {
  COMERCIAL_PADRAO: 'Comercial Padrão',
  ESCALA_12X36_DIURNO: '12x36 Diurno',
  ESCALA_12X36_NOTURNO: '12x36 Noturno',
  TURNO_NOTURNO: 'Turno Noturno',
  DIARISTA_FLEXIVEL: 'Diarista Flexível',
  PERSONALIZADO: 'Personalizado'
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
  const [searchParams] = useSearchParams();
  const editParamId = searchParams.get('edit');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  const [drivers, setDrivers] = useState([]);
  const [equipamentGroups, setEquipamentGroups] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);

  const initialFormState = {
    driverId: '',
    equipamentGroupId: '',
    scheduleDate: '',
    shiftTemplateId: '',
    startWorkday: '',
    endWorkday: '',
    breakDurationMinutes: 60,
    earliestBreakTime: '11:30',
    latestBreakTime: '13:30',
    maxDrivingHoursWithoutBreak: 4,
    minDrivingBreakMinutes: 30,
    customizeBreaks: false,
    status: 'ATIVO'
  };
  const [formData, setFormData] = useState(initialFormState);

  const initialTemplateState = {
    name: '',
    description: '',
    shiftType: 'COMERCIAL_PADRAO',
    defaultStartWorkday: '08:00',
    defaultEndWorkday: '18:00',
    breakDurationMinutes: 60,
    earliestBreakTime: '11:30',
    latestBreakTime: '13:30',
    maxDrivingHoursWithoutBreak: 4,
    minDrivingBreakMinutes: 30,
    isDefault: false
  };
  const [templateFormData, setTemplateFormData] = useState(initialTemplateState);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await workScheduleService.getAll();
      setSchedules(data || []);

      if (editParamId && data && data.length > 0) {
        const target = data.find(s => s.id === editParamId);
        if (target) {
          handleEditClick(target);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar escalas de trabalho:', error);
      showToast('Erro ao carregar lista de escalas de trabalho.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await workShiftTemplateService.getAll();
      setShiftTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar modelos de turno:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchTemplates();
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    if (!templateId) {
      setFormData((prev) => ({
        ...prev,
        shiftTemplateId: ''
      }));
      return;
    }

    const template = shiftTemplates.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        shiftTemplateId: template.id,
        startWorkday: toTimeInputValue(template.defaultStartWorkday),
        endWorkday: toTimeInputValue(template.defaultEndWorkday),
        breakDurationMinutes: template.breakDurationMinutes ?? 60,
        earliestBreakTime: toTimeInputValue(template.earliestBreakTime) || '11:30',
        latestBreakTime: toTimeInputValue(template.latestBreakTime) || '13:30',
        maxDrivingHoursWithoutBreak: template.maxDrivingHoursWithoutBreak ?? 4,
        minDrivingBreakMinutes: template.minDrivingBreakMinutes ?? 30
      }));
    }
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
        shiftTemplateId: formData.shiftTemplateId || null,
        startWorkday: formData.startWorkday,
        endWorkday: formData.endWorkday,
        breakDurationMinutes: formData.breakDurationMinutes ? parseInt(formData.breakDurationMinutes, 10) : 60,
        earliestBreakTime: formData.earliestBreakTime || null,
        latestBreakTime: formData.latestBreakTime || null,
        maxDrivingHoursWithoutBreak: formData.maxDrivingHoursWithoutBreak ? parseInt(formData.maxDrivingHoursWithoutBreak, 10) : 4,
        minDrivingBreakMinutes: formData.minDrivingBreakMinutes ? parseInt(formData.minDrivingBreakMinutes, 10) : 30,
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

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: templateFormData.name,
        description: templateFormData.description,
        shiftType: templateFormData.shiftType,
        defaultStartWorkday: templateFormData.defaultStartWorkday,
        defaultEndWorkday: templateFormData.defaultEndWorkday,
        breakDurationMinutes: parseInt(templateFormData.breakDurationMinutes, 10) || 60,
        earliestBreakTime: templateFormData.earliestBreakTime || null,
        latestBreakTime: templateFormData.latestBreakTime || null,
        maxDrivingHoursWithoutBreak: parseInt(templateFormData.maxDrivingHoursWithoutBreak, 10) || 4,
        minDrivingBreakMinutes: parseInt(templateFormData.minDrivingBreakMinutes, 10) || 30,
        isDefault: templateFormData.isDefault
      };
      await workShiftTemplateService.create(payload);
      showToast('Modelo de turno cadastrado com sucesso!', 'success');
      setIsTemplateModalOpen(false);
      setTemplateFormData(initialTemplateState);
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao criar modelo de turno:', error);
      const msg = error.response?.data?.message || 'Erro ao cadastrar modelo de turno.';
      showToast(msg, 'error');
    }
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setFormData({
      driverId: row.driver?.id || '',
      equipamentGroupId: row.equipamentGroup?.id || '',
      scheduleDate: row.scheduleDate || '',
      shiftTemplateId: row.shiftTemplate?.id || '',
      startWorkday: toTimeInputValue(row.startWorkday),
      endWorkday: toTimeInputValue(row.endWorkday),
      breakDurationMinutes: row.breakDurationMinutes ?? 60,
      earliestBreakTime: toTimeInputValue(row.earliestBreakTime) || '11:30',
      latestBreakTime: toTimeInputValue(row.latestBreakTime) || '13:30',
      maxDrivingHoursWithoutBreak: row.maxDrivingHoursWithoutBreak ?? 4,
      minDrivingBreakMinutes: row.minDrivingBreakMinutes ?? 30,
      customizeBreaks: !!(row.breakDurationMinutes || row.earliestBreakTime || row.maxDrivingHoursWithoutBreak),
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
    { 
      label: 'Motorista', 
      key: 'motorista', 
      render: (row) => row.driver ? (
        <Link
          to={`/perfis?edit=${row.driver?.user?.id || row.driver?.userId || row.driver?.id}`}
          className="entity-link"
          title="Ver/Editar perfil do motorista"
        >
          <User size={13} />
          <span>{driverLabel(row.driver)}</span>
        </Link>
      ) : '-' 
    },
    { 
      label: 'Conjunto / Placas', 
      key: 'conjunto', 
      render: (row) => {
        const g = row.equipamentGroup;
        if (!g) return '-';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <Link 
              to={`/conjuntos?edit=${g.id}`}
              className="entity-link secondary"
              title="Ver/Editar este conjunto de equipamentos"
            >
              <Layers size={13} />
              <span>{g.observation || `Conjunto #${g.id.substring(0, 8)}`}</span>
            </Link>
            <div className="equip-badges-container">
              {g.equipament1 && (
                <Link 
                  to={`/frota?edit=${g.equipament1.id}`} 
                  className="equip-pill tractor" 
                  title="Ver cavalo mecânico na frota"
                >
                  <Truck size={12} />
                  <span>{g.equipament1.plate}</span>
                </Link>
              )}
              {g.equipament2 && (
                <Link 
                  to={`/frota?edit=${g.equipament2.id}`} 
                  className="equip-pill trailer" 
                  title="Ver carreta 1 na frota"
                >
                  <Box size={12} />
                  <span>{g.equipament2.plate}</span>
                </Link>
              )}
              {g.equipament3 && (
                <Link 
                  to={`/frota?edit=${g.equipament3.id}`} 
                  className="equip-pill trailer" 
                  title="Ver carreta 2 na frota"
                >
                  <Box size={12} />
                  <span>{g.equipament3.plate}</span>
                </Link>
              )}
            </div>
          </div>
        );
      }
    },
    {
      label: 'Válida até',
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
    {
      label: 'Modelo / Jornada',
      key: 'modelo',
      render: (row) => (
        <span
          className="badge"
          style={{
            backgroundColor: row.shiftTemplate ? 'rgba(79, 70, 229, 0.1)' : 'rgba(100, 116, 139, 0.1)',
            color: row.shiftTemplate ? '#4f46e5' : '#64748b',
            border: `1px solid ${row.shiftTemplate ? 'rgba(79, 70, 229, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 500
          }}
        >
          {row.shiftTemplate?.name || 'Personalizado'}
        </span>
      )
    },
    {
      label: 'Intervalo / Lei 13.103',
      key: 'descanso',
      render: (row) => {
        const mins = row.breakDurationMinutes ?? 60;
        const maxH = row.maxDrivingHoursWithoutBreak ?? 4;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', gap: '0.15rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-color)' }}>
              <Coffee size={13} color="#f59e0b" /> {mins}m refeição
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}>
              <ShieldCheck size={13} color="#10b981" /> máx {maxH}h condução
            </span>
          </div>
        );
      }
    },
    {
      label: 'Custo/Hora',
      key: 'costPerHour',
      render: (row) => row.costPerHour != null ? row.costPerHour.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    },
    { 
      label: 'Status', 
      key: 'status', 
      render: (row) => {
        const text = translateStatus(row.status);
        return (
          <span className={`status-chip ${text === 'Ativo' ? 'active' : 'danger'}`}>
            {text}
          </span>
        );
      }
    }
  ];

  const scheduleFilterConfigs = [
    { key: 'status', label: 'Status' },
    {
      key: 'driver',
      label: 'Motorista',
      accessor: (row) => row.driver?.user?.name || row.driver?.name || ''
    }
  ];

  return (
    <div className="profiles-container fade-in">
      <PageHeader
        title="Escalas de Trabalho & Jornadas"
        description="Gestão flexível de motoristas, veículos e turnos de trabalho integrados à Lei nº 13.103."
        icon={CalendarClock}
        onBack={true}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsTemplateModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Clock size={16} />
            Novo Modelo de Turno
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Nova Escala
          </button>
        </div>
      </PageHeader>

      <div className="profiles-content">
        <DataTable
          columns={columns}
          data={schedules}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          filterConfigs={scheduleFilterConfigs}
          emptyMessage="Nenhuma escala de trabalho cadastrada."
        />
      </div>

      {/* Modal de Criação / Edição de Escala */}
      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CalendarClock size={22} color="var(--primary-color)" />
                {editingId ? 'Editar Escala de Trabalho' : 'Nova Escala de Trabalho'}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Motorista Alocado</label>
                  <select
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Selecione o motorista...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{driverLabel(d)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Conjunto de Equipamentos / Veículos</label>
                  <select
                    name="equipamentGroupId"
                    value={formData.equipamentGroupId}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Selecione o conjunto...</option>
                    {equipamentGroups.map(g => (
                      <option key={g.id} value={g.id}>{groupLabel(g)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Data de Validade da Escala</label>
                    <input
                      type="date"
                      name="scheduleDate"
                      value={formData.scheduleDate}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Modelo de Turno Pré-definido</label>
                    <select
                      name="shiftTemplateId"
                      value={formData.shiftTemplateId}
                      onChange={handleTemplateChange}
                      className="form-select"
                    >
                      <option value="">Personalizado (Sem modelo fixo)</option>
                      {shiftTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.isSystemGlobal ? '(Sistema)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Início da Jornada</label>
                    <input
                      type="time"
                      name="startWorkday"
                      value={formData.startWorkday}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Término da Jornada</label>
                    <input
                      type="time"
                      name="endWorkday"
                      value={formData.endWorkday}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                {/* Seção de Customização Fina da Jornada / Lei 13.103 */}
                <div style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(79, 70, 229, 0.04)',
                  border: '1px solid rgba(79, 70, 229, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sliders size={18} color="var(--primary-color)" />
                      <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-color)' }}>
                        Regras de Descanso & Lei do Motorista nº 13.103
                      </span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        name="customizeBreaks"
                        checked={formData.customizeBreaks}
                        onChange={handleInputChange}
                      />
                      <span>Personalizar</span>
                    </label>
                  </div>

                  {(formData.customizeBreaks || !formData.shiftTemplateId) && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div className="form-grid form-grid-3">
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem' }}>Duração do Almoço (min)</label>
                          <input
                            type="number"
                            name="breakDurationMinutes"
                            min="0"
                            max="240"
                            value={formData.breakDurationMinutes}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem' }}>Janela Almoço De</label>
                          <input
                            type="time"
                            name="earliestBreakTime"
                            value={formData.earliestBreakTime}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem' }}>Janela Almoço Até</label>
                          <input
                            type="time"
                            name="latestBreakTime"
                            value={formData.latestBreakTime}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div className="form-grid form-grid-2">
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem' }}>
                            Máx. horas de direção contínua
                          </label>
                          <input
                            type="number"
                            name="maxDrivingHoursWithoutBreak"
                            min="1"
                            max="8"
                            value={formData.maxDrivingHoursWithoutBreak}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Padrão legal: máx 4h a 5h30</span>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem' }}>
                            Tempo de descanso obrigatório (min)
                          </label>
                          <input
                            type="number"
                            name="minDrivingBreakMinutes"
                            min="15"
                            max="120"
                            value={formData.minDrivingBreakMinutes}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Padrão legal: 30 minutos</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Status da Escala</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="DESATIVADO">Desativado</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Atualizar Escala' : 'Salvar Escala'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Criação de Modelo de Turno */}
      {isTemplateModalOpen && createPortal(
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={22} color="var(--primary-color)" />
                Novo Modelo de Turno
              </h2>
              <button className="modal-close-btn" onClick={() => setIsTemplateModalOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveTemplate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nome do Modelo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Turno Diurno Express 07h-16h"
                    className="form-input"
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    placeholder="Detalhes ou acordos coletivos aplicados..."
                    value={templateFormData.description}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                  />
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Tipo de Turno</label>
                    <select
                      className="form-select"
                      value={templateFormData.shiftType}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, shiftType: e.target.value })}
                    >
                      {Object.entries(SHIFT_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.8rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={templateFormData.isDefault}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, isDefault: e.target.checked })}
                      />
                      <span>Modelo Padrão da Empresa</span>
                    </label>
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Início Padrão</label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={templateFormData.defaultStartWorkday}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, defaultStartWorkday: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Término Padrão</label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={templateFormData.defaultEndWorkday}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, defaultEndWorkday: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Almoço (min)</label>
                    <input
                      type="number"
                      min="0"
                      max="240"
                      className="form-input"
                      value={templateFormData.breakDurationMinutes}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, breakDurationMinutes: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Janela Início</label>
                    <input
                      type="time"
                      className="form-input"
                      value={templateFormData.earliestBreakTime}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, earliestBreakTime: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Janela Fim</label>
                    <input
                      type="time"
                      className="form-input"
                      value={templateFormData.latestBreakTime}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, latestBreakTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Máx. Horas Sem Pausa (Lei 13.103)</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      className="form-input"
                      value={templateFormData.maxDrivingHoursWithoutBreak}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, maxDrivingHoursWithoutBreak: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tempo Parada Obrigatória (min)</label>
                    <input
                      type="number"
                      min="15"
                      max="120"
                      className="form-input"
                      value={templateFormData.minDrivingBreakMinutes}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, minDrivingBreakMinutes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsTemplateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Modelo
                </button>
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
