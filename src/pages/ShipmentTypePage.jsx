import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Package, Plus, Save, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { shipmentTypeService } from '../services/shipmentTypeService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const ShipmentTypePage = () => {
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
      const data = await shipmentTypeService.getAll();
      setTypes(data);
    } catch (error) {
      console.error('Erro ao carregar tipos de carga:', error);
      showToast('Erro ao carregar lista de tipos de carga.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await shipmentTypeService.update(editingId, formData);
        showToast('Tipo de carga atualizado com sucesso!', 'success');
      } else {
        await shipmentTypeService.create(formData);
        showToast('Tipo de carga salvo com sucesso!', 'success');
      }
      handleCloseModal();
      fetchTypes();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast('Erro ao salvar tipo de carga.', 'error');
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
      await shipmentTypeService.delete(typeToDelete.id);
      showToast('Tipo de carga excluído com sucesso!', 'success');
      fetchTypes();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      showToast('Erro ao excluir tipo de carga.', 'error');
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
    { label: 'Nome do Tipo de Carga', key: 'name' },
    { label: 'Descrição da Mercadoria', key: 'description' },
    { label: 'Cuidados / Manuseio', key: 'care' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Tipos de Carga"
        description="Categorização de produtos, requisitos de acondicionamento e regras de SLA."
        icon={Package}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Tipo de Carga
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
                <Package size={22} color="var(--primary-color)" />
                {editingId ? 'Editar Tipo de Carga' : 'Novo Tipo de Carga'}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  
                  <div className="form-group">
                    <label className="form-label">Nome do Tipo de Carga</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="Ex: Carga Paletizada / Granel Liquido"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descrição</label>
                    <input 
                      type="text" 
                      name="description" 
                      value={formData.description} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="Mercadorias secas em caixas de papelão"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cuidados Especiais de Transporte</label>
                    <textarea 
                      name="care" 
                      value={formData.care} 
                      onChange={handleInputChange} 
                      className="form-textarea" 
                      rows="3"
                      placeholder="Não empilhar mais de 4 caixas."
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
        title="Excluir Tipo de Carga"
        message={`Deseja realmente remover o tipo de carga ${typeToDelete?.name}?`}
      />
    </div>
  );
};

export default ShipmentTypePage;
