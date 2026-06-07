import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tags, Plus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { shipmentTypeService } from '../services/shipmentTypeService';
import '../styles/Profiles.css'; // Reusing standard page layout

const ShipmentTypePage = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    care: ''
  });

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const data = await shipmentTypeService.getAll();
      setTypes(data);
    } catch (error) {
      console.error('Erro ao carregar tipos de carga:', error);
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
      await shipmentTypeService.create(formData);
      alert('Tipo de carga salvo com sucesso!');
      setIsModalOpen(false);
      setFormData({ name: '', description: '', care: '' });
      fetchTypes();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      let mensagens = 'Erro ao salvar tipo de carga. Certifique-se de que o nome e descrição tenham pelo menos 5 caracteres.';
      if (Array.isArray(error.response?.data)) {
        mensagens = error.response.data.join('\n');
      } else if (error.response?.data?.message) {
        mensagens = error.response.data.message;
      }
      alert(mensagens);
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
        title="Tipos de Carga"
        description="Gerencie as categorias de mercadorias/entregas e suas regras de SLA."
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
          emptyMessage="Nenhum tipo de carga encontrado."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Novo Tipo de Carga</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Nome (Mín. 5 letras)</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                    minLength={5}
                    placeholder="EX: ALIMENTOS FRESCOS"
                  />
                </div>
                <div className="form-group">
                  <label>Descrição (Mín. 5 letras)</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                    minLength={5}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Cuidados Especiais (Mín. 5 letras)</label>
                  <textarea 
                    name="care"
                    value={formData.care}
                    onChange={handleInputChange}
                    className="modal-input" 
                    minLength={5}
                    rows="3"
                    placeholder="Ex: Não empilhar mais de 4 caixas..."
                  />
                </div>
                
                <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save" style={{ padding: '0.75rem 1.5rem', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ShipmentTypePage;
