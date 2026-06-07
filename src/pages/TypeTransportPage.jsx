import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tags, Plus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { typeTransportService } from '../services/typeTransportService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/Profiles.css'; // Reusing standard page layout

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
      // API schema demands ^[A-Z ]+$
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
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
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

  const columns = [
    { label: 'Nome', key: 'name' },
    { label: 'Descrição', key: 'description' },
    { label: 'Cuidados Especiais', key: 'care' }
  ];

  return (
    <div className="profiles-container fade-in">
      <PageHeader 
        title="Tipos de Transporte"
        description="Gerencie as categorias de transporte e seus cuidados."
        icon={Tags}
        onBack={true}
      >
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Novo Tipo
        </button>
      </PageHeader>

      <div className="profiles-content">
        <DataTable 
          columns={columns} 
          data={types} 
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          emptyMessage="Nenhum tipo encontrado. Crie um novo ou aguarde a API disponibilizar a listagem."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Tipo de Transporte' : 'Novo Tipo de Transporte'}</h2>
              <button className="modal-close-btn" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData(initialFormState); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Nome (Apenas letras maiúsculas)</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                    placeholder="EX: TRANSPORTE SECO"
                  />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="modal-input" 
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Cuidados Especiais</label>
                  <textarea 
                    name="care"
                    value={formData.care}
                    onChange={handleInputChange}
                    className="modal-input" 
                    rows="3"
                    placeholder="Ex: Cuidado frágil, manter seco..."
                  />
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
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Tipo de Transporte"
        message={`Tem certeza que deseja excluir o tipo de transporte ${typeToDelete?.name}?`}
      />
    </div>
  );
};

export default TypeTransportPage;
