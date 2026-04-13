import React, { useState, useEffect } from 'react';
import { Search, Save, XOctagon, UserCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profiles.css';
import { userService } from '../services/userService';
import { driverService } from '../services/driverService';
import { companyService } from '../services/companyService';
import DataTable from '../components/DataTable';

const ProfilesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [feedback, setFeedback] = useState({ type: '', message: '' }); // 'error' ou 'success'

  // Edit Mode Controllers
  const [editingId, setEditingId] = useState(null);

  const initialFormState = {
    name: '',
    email: '',
    cpf: '',
    password: '',
    userProfile: '',
    companyId: 'd9d7b435-c256-405b-877c-848f4a22e22a', // Padrão inicial
    cnhNumber: '',
    cnhExpiration: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setProfiles(data);
    } catch (err) {
      console.error("Erro ao puxar perfis: ", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (err) {
      console.error("Erro ao puxar empresas: ", err);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchCompanies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      let savedUserId;

      if (editingId) {
        // Modo UPDATE
        const payload = {
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
          password: formData.password || "IgnoreM3!", // Opcional no input, mas swagger do PUT exige
          "User Profile": formData.userProfile,
          userProfile: formData.userProfile,
          companyId: formData.companyId
        };
        await userService.updateUser(editingId, payload);
        savedUserId = editingId;
        alert("Usuário atualizado com sucesso!");
      } else {
        // Modo CREATE
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          cpf: formData.cpf,
          "User Profile": formData.userProfile,
          userProfile: formData.userProfile, // Essa é a chave que o Spring efetivamente precisa
          companyId: formData.companyId
        };
        const newUserResponse = await userService.createUser(payload);
        // O swagger do CREATE reponde com o Objeto final incluindo UUID
        savedUserId = newUserResponse?.id;
        alert("Cadastro realizado com sucesso.");
      }

      // Chain function: Se for DRIVER, deve criar via driverService tbm.
      if (formData.userProfile === 'DRIVER' && savedUserId && !editingId) {
        await driverService.createDriver({
          cnhNumber: formData.cnhNumber,
          cnhExpiration: formData.cnhExpiration,
          userId: savedUserId
        });
      }

      setFormData(initialFormState);
      setEditingId(null);
      setFeedback({ type: 'success', message: 'Operação concluída com sucesso.' });
      fetchProfiles();
    } catch (error) {
      console.error("Erro ao salvar:", error);

      let mensagens = "Erro na operação do usuário.";
      if (error.response?.data?.errors) {
        mensagens = error.response.data.errors.map(err => err.defaultMessage || err.message).join('\n');
      } else if (error.response?.data?.message) {
        mensagens = error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        mensagens = error.response.data;
      }

      setFeedback({ type: 'error', message: mensagens });
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Certeza que deseja escluir este usuário?")) return;
    try {
      await userService.deleteUser(row.id);
      fetchProfiles();
      // Garantir reset de form e página atual se deletar o que ta editando
      if (editingId === row.id) {
        setEditingId(null);
        setFormData(initialFormState);
      }
      setFeedback({ type: 'success', message: 'Usuário removido com sucesso.' });
    } catch (error) {
      setFeedback({ type: 'error', message: "Erro ao excluir usuário." });
    }
  };

  const handleEditClick = (profile) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFeedback({ type: '', message: '' });
    setEditingId(profile.id);
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      cpf: profile.cpf || '',
      password: '',
      userProfile: profile.userProfile || '',
      companyId: profile.companyId || '',
      cnhNumber: '',
      cnhExpiration: ''
    });
  };

  const filteredProfiles = profiles.filter(p => {
    const q = searchTerm.toLowerCase();
    return (p.name && p.name.toLowerCase().includes(q)) ||
      (p.cpf && p.cpf.toLowerCase().includes(q));
  });

  const profileColumns = [
    { label: 'Nome', key: 'name' },
    { label: 'Email', key: 'email' },
    {
      label: 'Perfil', key: 'userProfile', render: (row) => (
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: row.userProfile === 'ADMIN' ? 'red' : 'blue' }}>
          {row.userProfile}
        </span>
      )
    },
    { label: 'CPF', key: 'cpf', render: (row) => row.cpf || 'Não Informado' }
  ];

  return (
    <div className="profiles-page fade-in">
      <button className="back-button" onClick={() => navigate('/')}>
        <ChevronLeft size={18} /> Voltar à Dashboard
      </button>

      {/* Header and Form Section */}
      <div className="profiles-form-section">
        <div className="profiles-form">
          <div className="form-header">
            <UserCircle size={24} className="form-icon" />
            <h3>{editingId ? 'Editar Perfil' : 'Novo Perfil'}</h3>
          </div>

          {feedback.message && (
            <div className={`form-feedback ${feedback.type} fade-in`} style={{ gridColumn: '1 / -1', padding: '1rem', borderRadius: '4px', background: feedback.type === 'error' ? '#fee2e2' : '#dcfce3', color: feedback.type === 'error' ? '#991b1b' : '#166534', border: `1px solid ${feedback.type === 'error' ? '#f87171' : '#86efac'}`, marginBottom: '1rem', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
              {feedback.message}
            </div>
          )}

          <div className="profiles-layout">
            {/* Left Column: Search & Total */}
            <div className="profiles-search-col">
              <label className="profiles-label">Consultar Perfil</label>
              <span className="profiles-count">{profiles.length} perfis cadastrados</span>

              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Pesquisar por Nome ou CPF..."
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
                  <label className="profiles-label">Nome Completo</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="profiles-input" />
                </div>

                <div className="form-field">
                  <label className="profiles-label">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="profiles-input" placeholder="exemplo@gmail.com" />
                </div>

                <div className="form-field">
                  <label className="profiles-label">CPF</label>
                  <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className="profiles-input" placeholder="000.000.000-00" />
                </div>

                <div className="form-field">
                  <label className="profiles-label" ttle="Pelo menos 8 caracteres, contendo 1 Número, 1 Maiúscula, 1 Minúscula e 1 Especial">
                    Senha
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="profiles-input"
                    placeholder="***"
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                    title="A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial."
                  />
                </div>

                  <div className="form-field">
                    <label className="profiles-label">Cargo (Role)</label>
                    <select name="userProfile" value={formData.userProfile} onChange={handleInputChange} className="profiles-input">
                      <option value="">Selecione</option>
                      <option value="DRIVER">Motorista</option>
                      <option value="OPERATOR">Apoio Logístico / Operador</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="profiles-label">Empresa</label>
                    <select name="companyId" value={formData.companyId} onChange={handleInputChange} className="profiles-input">
                      <option value="">Selecione a empresa</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.legalName}</option>
                      ))}
                    </select>
                  </div>

                {formData.userProfile === 'DRIVER' && (
                  <>
                    <div className="form-field fade-in">
                      <label className="profiles-label">Nº CNH (Ex: +11111111111)</label>
                      <input type="text" name="cnhNumber" value={formData.cnhNumber} onChange={handleInputChange} className="profiles-input" placeholder="+00000000000" />
                    </div>

                    <div className="form-field fade-in">
                      <label className="profiles-label">Vencimento CNH</label>
                      <input type="date" name="cnhExpiration" value={formData.cnhExpiration} onChange={handleInputChange} className="profiles-input" />
                    </div>
                  </>
                )}

                <div className="form-actions" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn-exclude" onClick={() => { setFormData(initialFormState); setEditingId(null); }}>
                    <XOctagon size={16} /> Cancelar / Limpar
                  </button>
                  <button className="btn-save" onClick={handleSave}>
                    <Save size={16} /> {editingId ? 'Atualizar Perfil' : 'Salvar Novo Perfil'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="profiles-actions-panel fade-in">
        <DataTable
          columns={profileColumns}
          data={filteredProfiles}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          itemsPerPage={15}
        />
      </div>

    </div>
  );
};

export default ProfilesPage;
