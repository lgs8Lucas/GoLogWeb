import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Truck, Plus, Save, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { equipamentService } from '../services/equipamentService';
import { tractorService } from '../services/tractorService';
import { trailerService } from '../services/trailerService';
import { companyService } from '../services/companyService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const FleetPage = () => {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const [formData, setFormData] = useState({
    plate: '',
    status: 'ATIVO', // EquipamentStatus: ATIVO | DESATIVADO | EM_MANUTENCAO
    renavam: '',
    model: '',
    maximumCapacity: '',
    numberAxles: '2',
    tipo: 'carreta',
    typeFuel: 'DIESEL',
    costPerKilometer: '',
    maximumVolume: '100',
    companyId: ''
  });

  const STATUS_LABELS = {
    ATIVO: 'Ativo',
    DESATIVADO: 'Desativado',
    EM_MANUTENCAO: 'Em Manutenção'
  };

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const data = await equipamentService.getAll();
      const mapped = data.map(item => {
        const isTrailer = item.maximumVolume !== undefined && item.maximumVolume !== null;
        const statusText = item.active !== false ? 'Ativo' : 'Inativo';
        return {
          id: item.id,
          placa: item.plate,
          status: STATUS_LABELS[item.status] || (item.active !== false ? 'Ativo' : 'Inativo'),
          renavam: item.renavam,
          marca: item.model || 'Volvo FH',
          capacidade: `${item.maximumCapacity || 0} kg`,
          tipo: isTrailer ? 'Carreta' : 'Caminhão',
          isTrailer: isTrailer,
          custoKm: !isTrailer && item.costPerKilometer != null
            ? item.costPerKilometer.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '-',
          empresa: item.company?.legalName || '-',
          raw: item
        };
      });
      setFleet(mapped);
    } catch (error) {
      console.error('Erro ao buscar frota:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
    const fetchCompanies = async () => {
      try {
        const comps = await companyService.getAllCompanies();
        setCompanies(comps || []);
        if (comps && comps.length > 0) {
          setFormData(prev => ({ ...prev, companyId: comps[0].id }));
        }
      } catch (err) {
        console.error("Erro ao buscar empresas para frota:", err);
      }
    };
    fetchCompanies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    try {
      const isTrailer = formData.tipo === 'carreta';
      // PUT /tractor/{id} and /trailer/{id} use the same CreateRequest schema as POST
      // (all fields required, incl. status/plate/renavam), since the backend's CORS config
      // blocks PATCH on these routes.
      const commonPayload = {
        plate: formData.plate,
        renavam: formData.renavam,
        model: formData.model,
        numberAxles: parseInt(formData.numberAxles, 10),
        maximumCapacity: parseFloat(formData.maximumCapacity || 0),
        status: formData.status,
        companyId: formData.companyId
      };

      if (isTrailer) {
        const trailerPayload = {
          ...commonPayload,
          maximumVolume: parseFloat(formData.maximumVolume || 0)
        };
        if (editingId) {
          await trailerService.update(editingId, trailerPayload);
        } else {
          await trailerService.create(trailerPayload);
        }
      } else {
        const tractorPayload = {
          ...commonPayload,
          typeFuel: formData.typeFuel,
          "Type Fuel": formData.typeFuel,
          costPerKilometer: parseFloat(formData.costPerKilometer || 0)
        };
        if (editingId) {
          await tractorService.update(editingId, tractorPayload);
        } else {
          await tractorService.create(tractorPayload);
        }
      }

      showToast(editingId ? 'Veículo atualizado com sucesso!' : 'Veículo criado com sucesso!', 'success');
      handleCloseModal();
      fetchFleet();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error.response?.data ?? error);
      const data = error.response?.data;
      let mensagens = 'Erro ao salvar veículo. Verifique se o UUID da empresa está correto e se preencheu todos os campos requeridos.';
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
      plate: row.raw.plate || '',
      status: row.raw.status || (row.raw.active !== false ? 'ATIVO' : 'DESATIVADO'),
      renavam: row.raw.renavam || '',
      model: row.raw.model || '',
      maximumCapacity: row.raw.maximumCapacity?.toString() || '',
      numberAxles: row.raw.numberAxles?.toString() || '2',
      tipo: row.isTrailer ? 'carreta' : 'truck',
      typeFuel: row.raw.typeFuel || 'DIESEL',
      costPerKilometer: row.raw.costPerKilometer?.toString() || '',
      maximumVolume: row.raw.maximumVolume?.toString() || '100',
      companyId: row.raw.company?.id || row.raw.companyId || (companies.length > 0 ? companies[0].id : '')
    });
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    setVehicleToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      if (vehicleToDelete.isTrailer) {
        await trailerService.delete(vehicleToDelete.id);
      } else {
        await tractorService.delete(vehicleToDelete.id);
      }
      showToast('Veículo excluído com sucesso!', 'success');
      fetchFleet();
    } catch (error) {
      console.error('Erro ao deletar veículo:', error);
      const msg = error.response?.data?.message || 'Erro ao excluir veículo.';
      showToast(msg, 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setVehicleToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      plate: '',
      status: 'ATIVO',
      renavam: '',
      model: '',
      maximumCapacity: '',
      numberAxles: '2',
      tipo: 'carreta',
      typeFuel: 'DIESEL',
      kmPerLiter: '2.5',
      maximumVolume: '100',
      companyId: companies.length > 0 ? companies[0].id : ''
    });
  };

  const fleetColumns = [
    { label: 'Placa', key: 'placa' },
    { 
      label: 'Status', 
      key: 'status',
      render: (row) => (
        <span className={`status-chip ${row.status === 'Ativo' ? 'active' : 'danger'}`}>
          {row.status}
        </span>
      )
    },
    { label: 'Renavam', key: 'renavam' },
    { label: 'Marca / Modelo', key: 'marca' },
    { label: 'Capacidade', key: 'capacidade' },
    { label: 'Custo/Km', key: 'custoKm' },
    { label: 'Tipo', key: 'tipo' },
    { label: 'Empresa Vinculada', key: 'empresa' }
  ];

  const fleetFilterConfigs = [
    { key: 'tipo', label: 'Tipo' },
    { key: 'status', label: 'Status' },
    { key: 'empresa', label: 'Empresa' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Frota de Veículos"
        description="Gerenciamento de caminhões tratores e carretas operacionais."
        icon={Truck}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Veículo
        </button>
      </PageHeader>

      <div className="card">
        <DataTable
          columns={fleetColumns}
          data={fleet}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          itemsPerPage={12}
          filterConfigs={fleetFilterConfigs}
          searchPlaceholder="Pesquisar placa, modelo, tipo ou renavam..."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={22} color="var(--primary-color)" />
                {editingId ? 'Editar Veículo' : 'Novo Veículo na Frota'}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  
                  <div className="form-group">
                    <label className="form-label">Placa do Veículo</label>
                    <input 
                      type="text" 
                      name="plate" 
                      value={formData.plate} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="ABC-1234 / AAA1A23" 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Status Operacional</label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange} 
                      className="form-select"
                    >
                      <option value="ATIVO">Ativo</option>
                      <option value="DESATIVADO">Desativado</option>
                      <option value="EM_MANUTENCAO">Em Manutenção</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Empresa Proprietária</label>
                    <select 
                      name="companyId" 
                      value={formData.companyId} 
                      onChange={handleInputChange} 
                      className="form-select" 
                      required 
                    >
                      <option value="">Selecione a empresa...</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.legalName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Código Renavam</label>
                    <input 
                      type="text" 
                      name="renavam" 
                      value={formData.renavam} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="00000000000" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Número de Eixos</label>
                    <input 
                      type="number" 
                      name="numberAxles" 
                      value={formData.numberAxles} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Marca / Modelo</label>
                    <input 
                      type="text" 
                      name="model" 
                      value={formData.model} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="Volvo FH 540 / Scania R450" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Capacidade Máxima (Kg)</label>
                    <input 
                      type="number" 
                      name="maximumCapacity" 
                      value={formData.maximumCapacity} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="30000" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de Equipamento</label>
                    <select 
                      name="tipo" 
                      value={formData.tipo} 
                      onChange={handleInputChange} 
                      className="form-select"
                      required
                    >
                      <option value="carreta">Carreta (Trailer)</option>
                      <option value="truck">Caminhão - Truck (Tractor)</option>
                      <option value="toco">Caminhão - Toco (Tractor)</option>
                      <option value="vuc">Caminhão - VUC (Tractor)</option>
                    </select>
                  </div>

                  {formData.tipo === 'carreta' && (
                    <div className="form-group">
                      <label className="form-label">Volume Máximo (m³)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        name="maximumVolume" 
                        value={formData.maximumVolume} 
                        onChange={handleInputChange} 
                        className="form-input" 
                        required 
                      />
                    </div>
                  )}

                  {formData.tipo !== 'carreta' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Tipo de Combustível</label>
                        <select 
                          name="typeFuel" 
                          value={formData.typeFuel} 
                          onChange={handleInputChange} 
                          className="form-select"
                          required
                        >
                          <option value="DIESEL">Diesel</option>
                          <option value="GASOLINA">Gasolina</option>
                          <option value="ETANOL">Etanol</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Custo por Km (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="costPerKilometer"
                          value={formData.costPerKilometer}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> {editingId ? 'Atualizar Veículo' : 'Salvar Veículo'}
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
        title="Excluir Veículo"
        message={`Deseja realmente remover o veículo de placa ${vehicleToDelete?.placa} da frota?`}
      />
    </div>
  );
};

export default FleetPage;
