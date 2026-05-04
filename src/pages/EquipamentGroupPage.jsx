import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Plus, X, Link } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { equipamentGroupService } from '../services/equipamentGroupService';
import '../styles/Profiles.css'; 

const EquipamentGroupPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    observation: '',
    equipament1Id: '',
    equipament2Id: '',
    equipament3Id: ''
  });

  useEffect(() => {
    // TODO: A API ainda não possui endpoint GET ALL para Equipament Group (/equipament-group).
    setGroups([]);
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await equipamentGroupService.create(formData);
      alert('Conjunto salvo com sucesso! (Não aparecerá na tabela até a API implementar a listagem)');
      setIsModalOpen(false);
      setFormData({ observation: '', equipament1Id: '', equipament2Id: '', equipament3Id: '' });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar conjunto. Verifique se os IDs dos equipamentos estão corretos e existem no banco.');
    }
  };

  const columns = [
    { label: 'ID', key: 'id' },
    { label: 'Observação', key: 'observation' },
    { label: 'Qtd. Equipamentos', key: 'qtd', render: () => '...' }
  ];

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
          emptyMessage="Nenhum conjunto encontrado. Crie um novo ou aguarde a API disponibilizar a listagem."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Novo Conjunto</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
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
                  <p style={{ fontSize: '0.8rem', color: 'var(--warning-color)', marginBottom: '1rem' }}>
                    Nota: Como a API ainda não lista os caminhões/carretas, você precisa colar o ID (UUID) exato do equipamento gerado pelo banco de dados.
                  </p>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Equipamento 1 (Obrigatório - Geralmente o Cavalo/Caminhão)</label>
                    <input 
                      type="text" 
                      name="equipament1Id"
                      value={formData.equipament1Id}
                      onChange={handleInputChange}
                      className="modal-input" 
                      required 
                      placeholder="Cole o UUID aqui..."
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Equipamento 2 (Opcional - Carreta 1)</label>
                    <input 
                      type="text" 
                      name="equipament2Id"
                      value={formData.equipament2Id}
                      onChange={handleInputChange}
                      className="modal-input" 
                      placeholder="Cole o UUID aqui..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Equipamento 3 (Opcional - Carreta 2 / Bitrem)</label>
                    <input 
                      type="text" 
                      name="equipament3Id"
                      value={formData.equipament3Id}
                      onChange={handleInputChange}
                      className="modal-input" 
                      placeholder="Cole o UUID aqui..."
                    />
                  </div>
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

export default EquipamentGroupPage;
