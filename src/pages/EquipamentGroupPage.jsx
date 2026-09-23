import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Plus, Save, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { equipamentGroupService } from '../services/equipamentGroupService';
import { equipamentService } from '../services/equipamentService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const EquipamentGroupPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  
  const initialFormState = {
    observation: '',
    equipament1Id: '',
    equipament2Id: '',
    equipament3Id: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [equipments, setEquipments] = useState([]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await equipamentGroupService.getAll();
      setGroups(data);
    } catch (error) {
      console.error('Erro ao carregar conjuntos:', error);
      showToast('Erro ao carregar lista de conjuntos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    const loadEquipments = async () => {
      try {
        const data = await equipamentService.getAll();
        setEquipments(data || []);
      } catch (err) {
        console.error("Erro ao carregar equipamentos:", err);
      }
    };
    loadEquipments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        observation: formData.observation,
        equipament1Id: formData.equipament1Id,
        equipament2Id: formData.equipament2Id || null,
        equipament3Id: formData.equipament3Id || null
      };
      if (editingId) {
        await equipamentGroupService.update(editingId, payload);
        showToast('Conjunto atualizado com sucesso!', 'success');
      } else {
        await equipamentGroupService.create(payload);
        showToast('Conjunto salvo com sucesso!', 'success');
      }
      handleCloseModal();
      fetchGroups();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast('Erro ao salvar conjunto.', 'error');
    }
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setFormData({
      observation: row.observation || '',
      equipament1Id: row.equipament1?.id || '',
      equipament2Id: row.equipament2?.id || '',
      equipament3Id: row.equipament3?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    setGroupToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await equipamentGroupService.delete(groupToDelete.id);
      showToast('Conjunto excluído com sucesso!', 'success');
      fetchGroups();
    } catch (error) {
      console.error('Erro ao deletar conjunto:', error);
      showToast('Erro ao excluir conjunto.', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const columns = [
    { label: 'Código', key: 'id', render: (row) => row.id.substring(0, 8) },
    { label: 'Identificação / Observação', key: 'observation' },
    { 
      label: 'Placas Vinculadas', 
      key: 'plates',
      render: (row) => {
        const plates = [];
        if (row.equipament1?.plate) plates.push(row.equipament1.plate);
        if (row.equipament2?.plate) plates.push(row.equipament2.plate);
        if (row.equipament3?.plate) plates.push(row.equipament3.plate);
        return plates.length > 0 ? plates.join(' + ') : '-';
      }
    }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Conjuntos de Equipamentos"
        description="Associação entre caminhões tratores e carretas para formação de composições rodoviárias."
        icon={Layers}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Conjunto
        </button>
      </PageHeader>

      <div className="card">
        <DataTable 
          columns={columns} 
          data={groups} 
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          itemsPerPage={12}
          searchPlaceholder="Pesquisar por identificação, código ou placa..."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={22} color="var(--primary-color)" />
                {editingId ? 'Editar Conjunto' : 'Novo Conjunto de Veículos'}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  
                  <div className="form-group">
                    <label className="form-label">Identificação / Observação</label>
                    <input 
                      type="text" 
                      name="observation" 
                      value={formData.observation} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="Ex: Bitrem Graos - Cavalo Volvo + 2 Carretas"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Veículo Principal (Cavalo / Trator)</label>
                    <select 
                      name="equipament1Id" 
                      value={formData.equipament1Id} 
                      onChange={handleInputChange} 
                      className="form-select" 
                      required
                    >
                      <option value="">Selecione o veículo principal...</option>
                      {equipments.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.plate} - {e.model || 'Veículo'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Segunda Unidade (Carreta 1 - Opcional)</label>
                    <select 
                      name="equipament2Id" 
                      value={formData.equipament2Id} 
                      onChange={handleInputChange} 
                      className="form-select"
                    >
                      <option value="">Nenhum (Apenas 1 unidade)</option>
                      {equipments.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.plate} - {e.model || 'Carreta'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Terceira Unidade (Carreta 2 - Opcional)</label>
                    <select 
                      name="equipament3Id" 
                      value={formData.equipament3Id} 
                      onChange={handleInputChange} 
                      className="form-select"
                    >
                      <option value="">Nenhum</option>
                      {equipments.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.plate} - {e.model || 'Carreta'}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Salvar Conjunto
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
        title="Excluir Conjunto"
        message={`Deseja realmente remover o conjunto ${groupToDelete?.observation}?`}
      />
    </div>
  );
};

export default EquipamentGroupPage;
