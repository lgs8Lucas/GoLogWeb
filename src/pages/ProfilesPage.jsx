import React, { useState } from 'react';
import { Search, Save, XOctagon, Edit, Trash2, UserCircle } from 'lucide-react';
import '../styles/Profiles.css';

const MOCK_DATA = [
  { id: 1, nome: "João Silva", email: "joao.silva@empresa.com", perfil: "Motorista", status: "Ativo", cpf: "xxx.xxx.xxx-xx", cnh: "xxx.xxx", validade: "01/01/2025" },
  { id: 2, nome: "Maria Fernandes", email: "maria.fernandes@logistica.net", perfil: "Apoio Logístico", status: "Inativo", cpf: "xxx.xxx.xxx-xx", cnh: "-", validade: "-" },
  { id: 3, nome: "Carla Souza", email: "carla.souza@transporte.com.br", perfil: "Administrador", status: "Ativo", cpf: "xxx.xxx.xxx-xx", cnh: "-", validade: "-" },
  { id: 4, nome: "Rodrigo Almeida", email: "rodrigo.almeida@supplychain.org", perfil: "Motorista", status: "Ativo", cpf: "xxx.xxx.xxx-xx", cnh: "xxx.xxx", validade: "01/01/2025" },
  { id: 5, nome: "Paulo Santos", email: "paulo.santos@corpbrasil.com", perfil: "Motorista", status: "Inativo", cpf: "xxx.xxx.xxx-xx", cnh: "xxx.xxx", validade: "01/01/2025" },
];

const ProfilesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="profiles-page fade-in">
      
      {/* Header and Form Section */}
      <div className="profiles-form-section">
        <div className="profiles-header">
          <div className="user-icon-avatar">
            <UserCircle size={32} color="#1f304c" />
          </div>
          <h2>Perfis</h2>
        </div>

        <div className="profiles-layout">
          {/* Left Column: Search & Total */}
          <div className="profiles-search-col">
            <label className="profiles-label">Consultar Perfil</label>
            <span className="profiles-count">20 perfis cadastrados</span>
            
            <div className="search-input-wrapper">
              <input 
                type="text" 
                placeholder="Value" 
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
                <label className="profiles-label">Nome</label>
                <input type="text" className="profiles-input" />
              </div>
              
              <div className="form-field">
                <label className="profiles-label">Status</label>
                <select className="profiles-input">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div className="form-field">
                <label className="profiles-label">Validade CNH</label>
                <input type="date" className="profiles-input" defaultValue="1900-01-01" />
              </div>

              <div className="form-field">
                <label className="profiles-label">Email</label>
                <input type="email" className="profiles-input" placeholder="Exemplo@gmail.com" />
              </div>

              <div className="form-field">
                <label className="profiles-label">CPF</label>
                <input type="text" className="profiles-input" placeholder="000.000.000-00" />
              </div>

              <div className="form-field">
                <label className="profiles-label">Senha</label>
                <input type="password" className="profiles-input" placeholder="***" />
              </div>

              <div className="form-field">
                <label className="profiles-label">Perfil</label>
                <select className="profiles-input">
                  <option value="">Selecione</option>
                  <option value="motorista">Motorista</option>
                  <option value="Apoio logístico">Apoio Logístico</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div className="form-field">
                <label className="profiles-label">CNH</label>
                <input type="text" className="profiles-input" placeholder="000.000.000-00" />
              </div>

              <div className="form-actions">
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
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>CPF</th>
              <th>CNH</th>
              <th>Validade CNH</th>
              <th className="actions-header"></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DATA.map((row) => (
              <tr key={row.id}>
                <td>{row.nome}</td>
                <td>{row.email}</td>
                <td>{row.perfil}</td>
                <td>
                  <span className={`status-badge ${row.status.toLowerCase()}`}>
                    {row.status === 'Ativo' ? '✓' : '✖'} {row.status}
                  </span>
                </td>
                <td>{row.cpf}</td>
                <td>{row.cnh}</td>
                <td>{row.validade}</td>
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

export default ProfilesPage;
