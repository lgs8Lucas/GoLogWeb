import React, { useState, useEffect } from 'react';
import { Search, Save, XOctagon, Building2, MapPin, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Company.css';
import { companyService } from '../services/companyService';
import { addressService } from '../services/addressService';
import DataTable from '../components/DataTable';

const CompanyPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const initialFormState = {
    legalName: '',
    cnpjCpf: '',
    email: '',
    phoneNumber: '',
    isCliente: true,
    // Address fields
    cep: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    country: 'Brasil',
    complement: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      setFeedback({ type: 'error', message: 'Erro ao carregar lista de empresas.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            district: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    try {
      let addressId = editingAddressId;

      const addressPayload = {
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        district: formData.district,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        complement: formData.complement
      };

      if (editingId && addressId) {
        // Update Address
        await addressService.updateAddress(addressId, addressPayload);
      } else {
        // Create Address
        const newAddress = await addressService.createAddress(addressPayload);
        addressId = newAddress.id;
      }

      const companyPayload = {
        legalName: formData.legalName,
        cnpjCpf: formData.cnpjCpf,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        isCliente: formData.isCliente,
        addressId: addressId
      };

      if (editingId) {
        await companyService.updateCompany(editingId, companyPayload);
        setFeedback({ type: 'success', message: 'Empresa atualizada com sucesso.' });
      } else {
        await companyService.createCompany(companyPayload);
        setFeedback({ type: 'success', message: 'Empresa cadastrada com sucesso.' });
      }

      setFormData(initialFormState);
      setEditingId(null);
      setEditingAddressId(null);
      fetchCompanies();
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      setFeedback({ type: 'error', message: error.response?.data?.message || 'Erro ao realizar operação.' });
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Deseja realmente excluir a empresa ${row.legalName}?`)) return;
    try {
      await companyService.deleteCompany(row.id);
      setFeedback({ type: 'success', message: 'Empresa excluída com sucesso.' });
      fetchCompanies();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      setFeedback({ type: 'error', message: 'Erro ao excluir empresa.' });
    }
  };

  const handleEditClick = (company) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(company.id);
    setEditingAddressId(company.address?.id || null);
    setFormData({
      legalName: company.legalName || '',
      cnpjCpf: company.cnpjCpf || '',
      email: company.email || '',
      phoneNumber: company.phoneNumber || '',
      isCliente: company.isCliente ?? true,
      cep: company.address?.cep || '',
      street: company.address?.street || '',
      number: company.address?.number || '',
      district: company.address?.district || '',
      city: company.address?.city || '',
      state: company.address?.state || '',
      country: company.address?.country || 'Brasil',
      complement: company.address?.complement || ''
    });
  };

  const filteredCompanies = companies.filter(c => {
    const q = searchTerm.toLowerCase();
    return (c.legalName && c.legalName.toLowerCase().includes(q)) || 
           (c.cnpjCpf && c.cnpjCpf.toLowerCase().includes(q));
  });

  const companyColumns = [
    { label: 'Razão Social', key: 'legalName' },
    { label: 'CNPJ/CPF', key: 'cnpjCpf' },
    { label: 'E-mail', key: 'email' },
    { label: 'Telefone', key: 'phoneNumber' },
    { 
      label: 'Tipo', 
      key: 'isCliente', 
      render: (row) => (
        <span className={`status-badge ${row.isCliente ? 'ativo' : 'status-transportando'}`} style={{
          padding: '4px 12px',
          borderRadius: '50px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          background: row.isCliente ? '#dcfce3' : '#e0f2fe',
          color: row.isCliente ? '#166534' : '#0369a1'
        }}>
          {row.isCliente ? 'CLIENTE' : 'FORNECEDOR'}
        </span>
      )
    }
  ];

  return (
    <div className="company-page fade-in">
      <button className="back-button" onClick={() => navigate('/')}>
        <ChevronLeft size={18} /> Voltar à Dashboard
      </button>

      <div className="company-form-section">
        <div className="company-form-container">
          <div className="form-header">
            <Building2 size={24} className="form-icon" />
            <h3>{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h3>
          </div>

          {feedback.message && (
            <div className={`form-feedback ${feedback.type} fade-in`}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSave} className="company-form">
            <div className="form-section-title">Dados Gerais</div>
            <div className="form-grid">
              <div className="form-field">
                <label className="company-label">Razão Social / Nome</label>
                <input type="text" name="legalName" value={formData.legalName} onChange={handleInputChange} className="company-input" required />
              </div>
              <div className="form-field">
                <label className="company-label">CNPJ / CPF</label>
                <input type="text" name="cnpjCpf" value={formData.cnpjCpf} onChange={handleInputChange} className="company-input" required />
              </div>
              <div className="form-field">
                <label className="company-label">E-mail</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="company-input" required />
              </div>
              <div className="form-field">
                <label className="company-label">Telefone</label>
                <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="company-input" placeholder="(00) 00000-0000" required />
              </div>
              <div className="form-field checkbox-field">
                <label className="company-label">Tipo de Relalação</label>
                <select name="isCliente" value={formData.isCliente} onChange={handleInputChange} className="company-input">
                  <option value={true}>Cliente</option>
                  <option value={false}>Fornecedor / Parceiro</option>
                </select>
              </div>
            </div>

            <div className="form-section-title" style={{ marginTop: '2rem' }}>
              <MapPin size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Endereço
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label className="company-label">CEP</label>
                <input type="text" name="cep" value={formData.cep} onChange={handleInputChange} onBlur={handleCepBlur} className="company-input" placeholder="00000-000" required />
              </div>
              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label className="company-label">Logradouro / Rua</label>
                <input type="text" name="street" value={formData.street} onChange={handleInputChange} className="company-input" required />
              </div>
              <div className="form-field">
                <label className="company-label">Número</label>
                <input type="text" name="number" value={formData.number} onChange={handleInputChange} className="company-input" required />
              </div>
              <div className="form-field">
                <label className="company-label">Bairro</label>
                <input type="text" name="district" value={formData.district} onChange={handleInputChange} className="company-input" required />
              </div>
              <div className="form-field">
                <label className="company-label">Cidade</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="company-input" required />
              </div>
              <div className="form-field">
                <label className="company-label">Estado (UF)</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="company-input" maxLength="2" required />
              </div>
              <div className="form-field">
                <label className="company-label">Complemento</label>
                <input type="text" name="complement" value={formData.complement} onChange={handleInputChange} className="company-input" />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => { setFormData(initialFormState); setEditingId(null); }}>
                <XOctagon size={16} /> Cancelar
              </button>
              <button type="submit" className="btn-save">
                <Save size={16} /> {editingId ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="company-list-section">
        <div className="list-header">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Pesquisar empresa..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="list-search-input"
            />
          </div>
          <span className="list-count">{companies.length} empresas</span>
        </div>

        <div className="list-container">
          <DataTable 
            columns={companyColumns} 
            data={filteredCompanies} 
            loading={loading} 
            onEdit={handleEditClick} 
            onDelete={handleDelete} 
            itemsPerPage={10} 
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyPage;
