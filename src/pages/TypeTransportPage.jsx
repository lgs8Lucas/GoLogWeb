import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tags, Plus, Save, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { typeTransportService } from '../services/typeTransportService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const TypeTransportPage = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const initialFormState = {
    name: '',
    description: '',
    care: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const data = await typeTransportService.getAll();
      setTypes(data);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
      showToast('Erro ao carregar tipos de transporte.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData({ ...formData, [name]: value.toUpperCase().replace(/[^A-Z ]/g, '') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await typeTransportService.update(editingId, formData);
        showToast('Tipo de transporte atualizado com sucesso!', 'success');
      } else {
        await typeTransportService.create(formData);
        showToast('Tipo de transporte salvo com sucesso!', 'success');
      }
      handleCloseModal();
      fetchTypes();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast('Erro ao salvar tipo de transporte.', 'error');
    }
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setFormData({
      name: row.name || '',
      description: row.description || '',
      care: row.care || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    setTypeToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!typeToDelete) return;
    try {
      await typeTransportService.delete(typeToDelete.id);
      showToast('Tipo de transporte excluído com sucesso!', 'success');
      fetchTypes();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      showToast('Erro ao excluir tipo de transporte.', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setTypeToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const columns = [
    { label: 'Nome da Categoria', key: 'name' },
    { label: 'Descrição Operacional', key: 'description' },
    { label: 'Cuidados Especiais / Regras', key: 'care' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Tipos de Transporte"
        description="Categorização de modais, restrições e requisitos de manuseio."
        icon={Tags}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Tipo de Transporte
        </button>
      </PageHeader>

      <div className="card">
        <DataTable 
          columns={columns} 
          data={types} 
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          itemsPerPage={12}
          searchPlaceholder="Pesquisar por nome, descrição ou cuidados..."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tags size={22} color="var(--primary-color)" />
                {editingId ? 'Editar Tipo de Transporte' : 'Novo Tipo de Transporte'}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  
                  <div className="form-group">
                    <label className="form-label">Nome da Categoria (APENAS MAIÚSCULAS)</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="EX: FRAGIL / REFRIGERADO"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descrição da Categoria</label>
                    <input 
                      type="text" 
                      name="description" 
                      value={formData.description} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="Transporte com temperatura controlada"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cuidados Especiais & Instruções</label>
                    <textarea 
                      name="care" 
                      value={formData.care} 
                      onChange={handleInputChange} 
                      className="form-textarea" 
                      rows="3"
                      placeholder="Manter em temperatura entre 2°C e 8°C."
                      required 
                    />
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Salvar Tipo
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
        title="Excluir Tipo de Transporte"
        message={`Deseja realmente remover o tipo de transporte ${typeToDelete?.name}?`}
      />
    </div>
  );
};

export default TypeTransportPage;
