import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tags, Plus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { typeTransportService } from '../services/typeTransportService';
import '../styles/Profiles.css'; // Reusing standard page layout

const TypeTransportPage = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    care: ''
  });

  useEffect(() => {
    // TODO: A API ainda não possui endpoint GET ALL para Type Transport (/type-transport).
    // Assim que a rota existir, chamaremos typeTransportService.getAll()
    setTypes([]);
    setLoading(false);
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
      await typeTransportService.create(formData);
      alert('Tipo de transporte salvo com sucesso! (Não aparecerá na tabela até a API implementar a listagem)');
      setIsModalOpen(false);
      setFormData({ name: '', description: '', care: '' });
      // TODO: refresh list when GET ALL is available
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar tipo de transporte.');
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
          emptyMessage="Nenhum tipo encontrado. Crie um novo ou aguarde a API disponibilizar a listagem."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Novo Tipo de Transporte</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
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

export default TypeTransportPage;
