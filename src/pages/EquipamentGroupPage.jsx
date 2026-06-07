import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Plus, X, Link } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { equipamentGroupService } from '../services/equipamentGroupService';
import { equipamentService } from '../services/equipamentService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/Profiles.css'; 

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

  const [equipments, setEquipments] = useState([]);

  useEffect(() => {
    fetchGroups();
    const loadEquipments = async () => {
      try {
        const data = await equipamentService.getAll();
        setEquipments(data || []);
      } catch (err) {
        console.error("Erro ao carregar equipamentos:", err);
        showToast('Erro ao carregar equipamentos.', 'error');
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
      // Map to appropriate UUID fields for request
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
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchGroups();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (error.response?.status === 409) {
        showToast('Conflito: Um ou mais veículos já pertencem a outro conjunto.', 'error');
      } else {
        showToast('Erro ao salvar conjunto. Verifique se os IDs dos equipamentos estão corretos.', 'error');
      }
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
      const msg = error.response?.data?.message || 'Erro ao excluir conjunto. Ele pode estar vinculado a um transporte ativo.';
      showToast(msg, 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  const columns = [
    { label: 'ID', key: 'id', render: (row) => row.id.substring(0, 8) },
    { label: 'Observação', key: 'observation' },
    { 
      label: 'Qtd. Equipamentos', 
      key: 'qtd', 
      render: (row) => {
        let count = 0;
        if (row.equipament1) count++;
        if (row.equipament2) count++;
        if (row.equipament3) count++;
        return `${count} veículo(s)`;
      }
    },
    {
      label: 'Veículos / Placas',
      key: 'veiculos',
      render: (row) => {
        const plates = [];
        if (row.equipament1?.plate) plates.push(row.equipament1.plate);
        if (row.equipament2?.plate) plates.push(row.equipament2.plate);
        if (row.equipament3?.plate) plates.push(row.equipament3.plate);
        return plates.length > 0 ? plates.join(' + ') : '-';
      }
    }
  ];

  const tractors = equipments.filter(eq => eq.maximumVolume === undefined || eq.maximumVolume === null);
  const trailers = equipments.filter(eq => eq.maximumVolume !== undefined && eq.maximumVolume !== null);

  return (
    <div className="profiles-container fade-in">
      <PageHeader 
        title="Conjuntos"
        description="Agrupe caminhões e carretas para formar uma frota de viagem."
        icon={Layers}
        onBack={true}
      >
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Novo Conjunto
        </button>
      </PageHeader>

      <div className="profiles-content">
        <DataTable 
          columns={columns} 
          data={groups} 
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          emptyMessage="Nenhum conjunto encontrado. Crie um novo ou aguarde a API disponibilizar a listagem."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Conjunto' : 'Novo Conjunto'}</h2>
              <button className="modal-close-btn" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData(initialFormState); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Observação (Opcional)</label>
                  <textarea 
                    name="observation"
                    value={formData.observation}
                    onChange={handleInputChange}
                    className="modal-input" 
                    rows="2"
                    placeholder="Ex: Conjunto principal para viagens longas"
                  />
                </div>
                
                <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Link size={16} /> Vinculação de Equipamentos
                  </h3>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Equipamento 1 (Obrigatório - Cavalo Mecânico / Caminhão)</label>
                    <select 
                      name="equipament1Id"
                      value={formData.equipament1Id}
                      onChange={handleInputChange}
                      className="modal-input" 
                      required 
                    >
                      <option value="">Selecione o caminhão...</option>
                      {tractors.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.plate} - {eq.model || 'Volvo FH'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Equipamento 2 (Opcional - Carreta / Reboque 1)</label>
                    <select 
                      name="equipament2Id"
                      value={formData.equipament2Id}
                      onChange={handleInputChange}
                      className="modal-input" 
                    >
                      <option value="">Selecione a carreta...</option>
                      {trailers.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.plate} - {eq.model || 'Reboque'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Equipamento 3 (Opcional - Carreta / Reboque 2)</label>
                    <select 
                      name="equipament3Id"
                      value={formData.equipament3Id}
                      onChange={handleInputChange}
                      className="modal-input" 
                    >
                      <option value="">Selecione a carreta...</option>
                      {trailers.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.plate} - {eq.model || 'Reboque'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-cancel" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData(initialFormState); }} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
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

      {/* Required ConfirmModal import wasn't included at top, wait I need to make sure ConfirmModal is imported */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Conjunto"
        message="Tem certeza que deseja excluir este conjunto?"
      />
    </div>
  );
};

export default EquipamentGroupPage;
