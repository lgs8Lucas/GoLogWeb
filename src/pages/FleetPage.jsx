import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Save, XOctagon, Edit, Trash2, Truck, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profiles.css'; 
import '../styles/Fleet.css'; 
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';

const FleetPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // TODO: A API possui endpoints para Tractor e Trailer, mas não possui endpoints 
    // de listagem (GET ALL). É necessário que o backend crie GET /tractor e GET /trailer
    // para preenchermos essa tabela de forma dinâmica.
    setFleet([]);
    setLoading(false);
  }, []);

  const fleetColumns = [
    { label: 'Placa', key: 'placa' },
    { label: 'Motorista', key: 'motorista' },
    { label: 'Status', key: 'status' },
    { label: 'Renavam', key: 'renavam' },
    { label: 'Ano', key: 'ano' },
    { label: 'Marca', key: 'marca' },
    { label: 'Capacid.', key: 'capacidade' },
    { label: 'Tipo', key: 'tipo' }
  ];

  return (
    <div className="profiles-page fade-in">
      <PageHeader 
        title="Frota"
        description="Gerencie os caminhões e carretas disponíveis no pátio."
        icon={Truck}
        onBack={true}
      >
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Novo Veículo
        </button>
      </PageHeader>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={24} color="var(--primary-color)" />
                Novo Veículo
              </h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                
                <div className="form-field">
                  <label className="profiles-label">Placa</label>
                  <input type="text" className="profiles-input" placeholder="ABC-1234" />
                </div>
                
                <div className="form-field">
                  <label className="profiles-label">Status</label>
                  <select className="profiles-input">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="manutencao">Em Manutenção</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="profiles-label">UUID Motorista Vinculado</label>
                  <input type="text" className="profiles-input" placeholder="Cole o UUID..." />
                </div>

                <div className="form-field">
                  <label className="profiles-label">Renavam</label>
                  <input type="text" className="profiles-input" placeholder="00000000000" />
                </div>

                <div className="form-field">
                  <label className="profiles-label">Ano</label>
                  <input type="text" className="profiles-input" placeholder="2022" />
                </div>

                <div className="form-field">
                  <label className="profiles-label">Marca/Modelo</label>
                  <input type="text" className="profiles-input" placeholder="Volvo FH" />
                </div>

                <div className="form-field">
                  <label className="profiles-label">Capacidade</label>
                  <input type="text" className="profiles-input" placeholder="30t" />
                </div>

                <div className="form-field">
                  <label className="profiles-label">Tipo</label>
                  <select className="profiles-input">
                    <option value="">Selecione</option>
                    <option value="carreta">Carreta</option>
                    <option value="truck">Truck</option>
                    <option value="toco">Toco</option>
                    <option value="vuc">VUC</option>
                  </select>
                </div>

                <div className="modal-action-buttons" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn-cancel" onClick={() => setIsModalOpen(false)} style={{ padding: '0.85rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                    <XOctagon size={16} /> Cancelar
                  </button>
                  <button className="btn-primary" onClick={() => alert("Simulação de salvar.")}>
                    <Save size={16} /> Salvar Veículo
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Table Section */}
      <div className="profiles-table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
          <div className="search-input-wrapper" style={{ minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Pesquisar placa ou motorista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="profiles-input"
              style={{ width: '100%', paddingRight: '2.5rem' }}
            />
            <Search className="search-icon" size={18} style={{ position: 'absolute', right: '12px' }} />
          </div>
          <span className="profiles-count" style={{ margin: 0 }}>{fleet.length} resultados</span>
        </div>
        <DataTable
          columns={fleetColumns}
          data={fleet}
          loading={loading}
          itemsPerPage={15}
        />
      </div>

    </div>
  );
};

export default FleetPage;
