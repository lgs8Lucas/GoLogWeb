import React, { useState, useEffect } from 'react';
import { Search, Save, XOctagon, Edit, Trash2, Truck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profiles.css'; /* Reusing mainly Profiles css to keep consistency */
import '../styles/Fleet.css'; /* Specific tweaks for Fleet */
import { mockApi } from '../services/api';

const FleetPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getFleet().then(data => {
      setFleet(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="profiles-page fade-in">
      <button className="back-button" onClick={() => navigate('/')}>
        <ChevronLeft size={18} /> Voltar à Dashboard
      </button>
      
      {/* Header and Form Section */}
      <div className="profiles-form-section">
        <div className="profiles-header">
          <div className="user-icon-avatar">
            <Truck size={32} color="#1f304c" />
          </div>
          <h2>Frota</h2>
        </div>

        <div className="profiles-layout">
          {/* Left Column: Search & Total */}
          <div className="profiles-search-col">
            <label className="profiles-label">Consultar Frota</label>
            <span className="profiles-count">{fleet.length} veículos cadastrados</span>
            
            <div className="search-input-wrapper">
              <input 
                type="text" 
                placeholder="Placa ou Motorista" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="profiles-input"
              />
              <Search className="search-icon" size={18} />
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="profiles-form-col">
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
                <label className="profiles-label">Motorista Vinculado</label>
                <select className="profiles-input">
                  <option value="">Nenhum</option>
                  <option value="1">João Silva</option>
                  <option value="2">Lucas Gonçalves</option>
                  <option value="3">Jonathan Alves</option>
                  <option value="4">João Neves</option>
                </select>
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

              <div className="form-actions fleet-actions">
                <button className="btn-exclude">
                  <XOctagon size={16} /> Excluir
                </button>
                <button className="btn-save">
                  <Save size={16} /> Salvar
                </button>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="profiles-table-container">
        <table className="profiles-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Motorista</th>
              <th>Status</th>
              <th>Renavam</th>
              <th>Ano</th>
              <th>Marca</th>
              <th>Capacid.</th>
              <th>Tipo</th>
              <th className="actions-header"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{textAlign:'center'}}>Carregando...</td></tr>
            ) : fleet.map((row) => (
              <tr key={row.id}>
                <td style={{fontWeight: 'bold'}}>{row.placa}</td>
                <td>{row.motorista}</td>
                <td>
                  <span className={`status-badge ${row.status === 'Ativo' ? 'ativo' : row.status === 'Inativo' ? 'inativo' : 'manutencao'}`}>
                    {row.status === 'Ativo' ? '✓ Ativo' : row.status === 'Inativo' ? '✖ Inativo' : '🔧 Manutenção'}
                  </span>
                </td>
                <td>{row.renavam}</td>
                <td>{row.ano}</td>
                <td>{row.marca}</td>
                <td>{row.capacidade}</td>
                <td>{row.tipo}</td>
                <td className="actions-cell">
                  <button className="table-action-btn edit-btn" aria-label="Edit">
                    <Edit size={18} />
                  </button>
                  <button className="table-action-btn delete-btn" aria-label="Delete">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default FleetPage;
