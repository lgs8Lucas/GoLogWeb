import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Save, X } from 'lucide-react';
import { userService } from '../services/userService';
import { driverService } from '../services/driverService';
import { companyService } from '../services/companyService';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const ProfilesPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const initialFormState = {
    name: '',
    email: '',
    cpf: '',
    password: '',
    userProfile: 'OPERATOR',
    companyId: '',
    cnhNumber: '',
    cnhExpiration: '',
    costPerHour: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setProfiles(data);
    } catch (err) {
      console.error("Erro ao puxar perfis: ", err);
      showToast('Erro ao carregar lista de usuários.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await companyService.getAllCompanies();
      setCompanies(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, companyId: data[0].id }));
      }
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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let savedUserId;

      if (editingId) {
        const payload = {
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
          password: formData.password || 'Senha@123',
          "User Profile": formData.userProfile,
          userProfile: formData.userProfile,
          companyId: formData.companyId
        };
        await userService.updateUser(editingId, payload);
        savedUserId = editingId;
        showToast("Usuário atualizado com sucesso!", "success");
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          cpf: formData.cpf,
          "User Profile": formData.userProfile,
          userProfile: formData.userProfile,
          companyId: formData.companyId
        };
        const newUserResponse = await userService.createUser(payload);
        savedUserId = newUserResponse?.id;
        showToast("Usuário cadastrado com sucesso!", "success");
      }

      if (formData.userProfile === 'DRIVER' && savedUserId && !editingId) {
        await driverService.createDriver({
          cnhNumber: formData.cnhNumber,
          cnhExpiration: formData.cnhExpiration,
          costPerHour: parseFloat(formData.costPerHour || 0),
          userId: savedUserId
        });
      }

      handleCloseModal();
      fetchProfiles();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showToast(error.response?.data?.message || 'Erro ao processar usuário.', "error");
    }
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setFormData({
      name: row.name || '',
      email: row.email || '',
      cpf: row.cpf || '',
      password: '',
      userProfile: row.userProfile || row["User Profile"] || 'OPERATOR',
      companyId: row.company?.id || row.companyId || (companies.length > 0 ? companies[0].id : ''),
      cnhNumber: '',
      cnhExpiration: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    setUserToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete.id);
      showToast("Usuário removido com sucesso!", "success");
      fetchProfiles();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      showToast("Erro ao excluir usuário.", "error");
    } finally {
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      ...initialFormState,
      companyId: companies.length > 0 ? companies[0].id : ''
    });
  };

  const profileColumns = [
    { label: 'Nome Completo', key: 'name' },
    { label: 'E-mail', key: 'email' },
    { label: 'CPF', key: 'cpf' },
    { 
      label: 'Perfil / Nível', 
      key: 'userProfile',
      render: (row) => {
        const role = row.userProfile || row["User Profile"] || 'USER';
        let chipClass = 'info';
        if (role === 'ADMIN') chipClass = 'danger';
        if (role === 'OPERATOR') chipClass = 'active';
        if (role === 'DRIVER') chipClass = 'warning';

        return (
          <span className={`status-chip ${chipClass}`}>
            {role}
          </span>
        );
      }
    },
    { 
      label: 'Empresa Vinculada', 
      key: 'company',
      render: (row) => row.company?.legalName || '-'
    }
  ];

  const profileFilterConfigs = [
    { 
      key: 'userProfile', 
      label: 'Perfil',
      options: [
        { label: 'Administrador (ADMIN)', value: 'ADMIN' },
        { label: 'Operador (OPERATOR)', value: 'OPERATOR' },
        { label: 'Motorista (DRIVER)', value: 'DRIVER' }
      ]
    },
    { 
      key: 'empresa', 
      label: 'Empresa', 
      accessor: (row) => row.company?.legalName || row.companyName || '' 
    }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Usuários & Perfis de Acesso"
        description="Gestão de administradores, operadores logísticos e motoristas cadastrados."
        icon={Users}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Usuário
        </button>
      </PageHeader>

      <div className="card">
        <DataTable 
          columns={profileColumns}
          data={profiles}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          itemsPerPage={12}
          filterConfigs={profileFilterConfigs}
          searchPlaceholder="Pesquisar por nome, e-mail, CPF ou perfil..."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={22} color="var(--primary-color)" />
                {editingId ? 'Editar Usuário' : 'Novo Usuário no Sistema'}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  
                  <div className="form-group">
                    <label className="form-label">Nome Completo</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="Ex: João da Silva"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="joao@golog.com.br"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CPF</label>
                    <input 
                      type="text" 
                      name="cpf" 
                      value={formData.cpf} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="000.000.000-00"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{editingId ? 'Nova Senha (Opcional)' : 'Senha de Acesso'}</label>
                    <input 
                      type="password" 
                      name="password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="••••••••"
                      required={!editingId} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Perfil de Acesso</label>
                    <select 
                      name="userProfile" 
                      value={formData.userProfile} 
                      onChange={handleInputChange} 
                      className="form-select"
                      required
                    >
                      <option value="OPERATOR">Operador Logístico</option>
                      <option value="ADMIN">Administrador (Master)</option>
                      <option value="DRIVER">Motorista</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Empresa Vinculada</label>
                    <select 
                      name="companyId" 
                      value={formData.companyId} 
                      onChange={handleInputChange} 
                      className="form-select"
                      required
                    >
                      <option value="">Selecione a empresa...</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.legalName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.userProfile === 'DRIVER' && !editingId && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Número da CNH</label>
                        <input 
                          type="text" 
                          name="cnhNumber" 
                          value={formData.cnhNumber} 
                          onChange={handleInputChange} 
                          className="form-input" 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Validade da CNH</label>
                        <input 
                          type="date" 
                          name="cnhExpiration" 
                          value={formData.cnhExpiration} 
                          onChange={handleInputChange} 
                          className="form-input" 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Custo por Hora (R$)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          name="costPerHour" 
                          value={formData.costPerHour} 
                          onChange={handleInputChange} 
                          className="form-input" 
                          placeholder="0.00" 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> {editingId ? 'Atualizar Usuário' : 'Salvar Usuário'}
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
        title="Excluir Usuário"
        message={`Deseja realmente excluir o acesso de ${userToDelete?.name}?`}
      />
    </div>
  );
};

export default ProfilesPage;
