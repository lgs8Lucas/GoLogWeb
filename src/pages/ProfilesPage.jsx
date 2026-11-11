import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, Plus, Save, X, Building2 } from 'lucide-react';
import { userService } from '../services/userService';
import { driverService } from '../services/driverService';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { translateUserRole } from '../utils/enumTranslations';
import { extractErrorMessage } from '../utils/errorUtils';
import { loadTenantOptions, defaultTenantId, tenantLabel } from '../utils/tenantOptions';

const ProfilesPage = () => {
  const [searchParams] = useSearchParams();
  const editParamId = searchParams.get('edit');
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
      setProfiles(data || []);

      if (editParamId && data && data.length > 0) {
        const target = data.find(u => u.id === editParamId);
        if (target) {
          handleEditClick(target);
        }
      }
    } catch (err) {
      console.error("Erro ao puxar perfis: ", err);
      showToast('Erro ao carregar lista de usuários.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Usuários pertencem a um tenant (matriz/filial) — nunca a um cliente
  const fetchCompanies = async () => {
    const tenantList = await loadTenantOptions();
    setCompanies(tenantList);
    setFormData(prev => ({ ...prev, companyId: prev.companyId || defaultTenantId(tenantList) }));
  };

  const [drivers, setDrivers] = useState([]);
  const fetchDrivers = async () => {
    try {
      setDrivers((await driverService.getAllDrivers()) || []);
    } catch {
      setDrivers([]);
    }
  };
  const driverOfUser = (userId) => drivers.find(d => d.userId === userId);

  // <input type="date"> usa yyyy-MM-dd; a API de motoristas usa dd/MM/yyyy
  const toApiDate = (value) => {
    if (value && value.includes('-')) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}/${y}`;
    }
    return value;
  };

  useEffect(() => {
    fetchProfiles();
    fetchCompanies();
    fetchDrivers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isDriverProfile = formData.userProfile === 'DRIVER';
    const existingDriver = editingId ? driverOfUser(editingId) : null;

    if (isDriverProfile && !existingDriver && (!formData.cnhNumber || !formData.cnhExpiration)) {
      showToast('Para o perfil Motorista informe o número e a validade da CNH.', 'error');
      return;
    }

    let createdUserId = null;
    try {
      let savedUserId;
      const basePayload = {
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        userProfile: formData.userProfile,
        companyId: formData.companyId
      };

      if (editingId) {
        await userService.updateUser(editingId, {
          ...basePayload,
          ...(formData.password && formData.password.trim() ? { password: formData.password } : {})
        });
        savedUserId = editingId;
      } else {
        const newUserResponse = await userService.createUser({ ...basePayload, password: formData.password });
        savedUserId = newUserResponse?.id;
        createdUserId = savedUserId;
      }

      if (isDriverProfile && savedUserId) {
        const driverPayload = {
          cnhNumber: formData.cnhNumber,
          cnhExpiration: toApiDate(formData.cnhExpiration),
          costPerHour: parseFloat(formData.costPerHour) || 25.0,
          userId: savedUserId
        };
        if (existingDriver) {
          await driverService.patchDriver(existingDriver.id, {
            ...(formData.cnhNumber ? { cnhNumber: formData.cnhNumber } : {}),
            ...(formData.cnhExpiration ? { cnhExpiration: toApiDate(formData.cnhExpiration) } : {}),
            ...(formData.costPerHour ? { costPerHour: parseFloat(formData.costPerHour) } : {})
          });
        } else {
          await driverService.createDriver(driverPayload);
        }
      }

      showToast(editingId ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!', 'success');
      handleCloseModal();
      fetchProfiles();
      fetchDrivers();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      // Usuário criado agora mas o cadastro de motorista falhou: desfaz para não deixar motorista sem CNH
      if (createdUserId) {
        try { await userService.deleteUser(createdUserId); } catch { /* ignora */ }
      }
      showToast(extractErrorMessage(error, 'Erro ao processar usuário.'), "error");
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
      companyId: row.company?.id || row.companyId || defaultTenantId(companies),
      cnhNumber: driverOfUser(row.id)?.cnhNumber || '',
      cnhExpiration: driverOfUser(row.id)?.cnhExpiration || '',
      costPerHour: driverOfUser(row.id)?.costPerHour ?? ''
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
      showToast(extractErrorMessage(error, "Erro ao excluir usuário."), "error");
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
      companyId: defaultTenantId(companies)
    });
  };

  const profileColumns = [
    { 
      label: 'Nome Completo', 
      key: 'name',
      render: (row) => (
        <span 
          style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary-color)' }}
          onClick={() => handleEditClick(row)}
          title="Clique para editar este usuário"
        >
          {row.name}
        </span>
      )
    },
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
            {translateUserRole(role)}
          </span>
        );
      }
    },
    { 
      label: 'Empresa Vinculada', 
      key: 'company',
      render: (row) => row.company?.id ? (
        <Link 
          to={`/empresas?edit=${row.company.id}`} 
          className="entity-link"
          title={`Ver empresa ${row.company.legalName}`}
        >
          <Building2 size={13} />
          <span>{row.company.legalName || 'Empresa'}</span>
        </Link>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>{row.company?.legalName || '-'}</span>
      )
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

  const handleOpenNewModal = () => {
    const defaultCompId = defaultTenantId(companies);
    setEditingId(null);
    setFormData({
      ...initialFormState,
      companyId: defaultCompId
    });
    setIsModalOpen(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Usuários & Perfis de Acesso"
        description="Gestão de administradores, operadores logísticos e motoristas cadastrados."
        icon={Users}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={handleOpenNewModal}>
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
                        <option key={c.id} value={c.id}>{tenantLabel(c)}</option>
                      ))}
                    </select>
                  </div>

                  {formData.userProfile === 'DRIVER' && (
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
                      <div className="form-group col-span-2">
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
