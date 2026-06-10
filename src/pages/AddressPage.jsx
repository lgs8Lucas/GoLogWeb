import React, { useState, useEffect } from 'react';
import { Map, Plus, Edit, Trash2, Save, X, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { addressService } from '../services/addressService';
import { createPortal } from 'react-dom';
import '../styles/Profiles.css'; // Reusing standard UI table styles

const AddressModal = ({ isOpen, onClose, onSave, address }) => {
  const [formData, setFormData] = useState({
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    country: 'Brasil',
    cep: '',
    complement: '',
    latitude: '',
    longitude: ''
  });
  const [loadingCoords, setLoadingCoords] = useState(false);

  const fetchCoordinates = async () => {
    if (!formData.street || !formData.city || !formData.state) {
      alert('Preencha Logradouro, Cidade e Estado para buscar as coordenadas.');
      return;
    }
    setLoadingCoords(true);
    try {
      const query = `${formData.street}, ${formData.number ? formData.number + ', ' : ''}${formData.city}, ${formData.state}, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, latitude: data[0].lat, longitude: data[0].lon }));
      } else {
        alert('Coordenadas não encontradas. Tente ser mais específico no endereço.');
      }
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      alert('Erro de rede ao buscar coordenadas.');
    } finally {
      setLoadingCoords(false);
    }
  };

  useEffect(() => {
    if (address) {
      setFormData({
        street: address.street || '',
        number: address.number || '',
        district: address.district || '',
        city: address.city || '',
        state: address.state || '',
        country: address.country || 'Brasil',
        cep: address.cep || '',
        complement: address.complement || '',
        latitude: address.latitude || '',
        longitude: address.longitude || ''
      });
    } else {
      setFormData({
        street: '',
        number: '',
        district: '',
        city: '',
        state: '',
        country: 'Brasil',
        cep: '',
        complement: '',
        latitude: '',
        longitude: ''
      });
    }
  }, [address, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clean payload for API validation constraints
    const payload = { ...formData };
    if (!payload.complement || payload.complement.trim() === '') {
      delete payload.complement;
    }
    
    // Ensure coords are strings
    if (payload.latitude) payload.latitude = String(payload.latitude);
    if (payload.longitude) payload.longitude = String(payload.longitude);

    onSave(payload);
  };

  return createPortal(
    <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>{address ? 'Editar Endereço' : 'Novo Endereço'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Logradouro (Rua/Avenida)</label>
              <input type="text" name="street" value={formData.street} onChange={handleInputChange} required className="modal-input" />
            </div>
            
            <div className="form-group">
              <label>Número</label>
              <input type="text" name="number" value={formData.number} onChange={handleInputChange} required className="modal-input" />
            </div>
            
            <div className="form-group">
              <label>CEP</label>
              <input type="text" name="cep" value={formData.cep} onChange={handleInputChange} required className="modal-input" />
            </div>

            <div className="form-group">
              <label>Bairro</label>
              <input type="text" name="district" value={formData.district} onChange={handleInputChange} required className="modal-input" />
            </div>

            <div className="form-group">
              <label>Complemento</label>
              <input type="text" name="complement" value={formData.complement} onChange={handleInputChange} className="modal-input" />
            </div>

            <div className="form-group">
              <label>Cidade</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="modal-input" />
            </div>

            <div className="form-group">
              <label>Estado (UF)</label>
              <input type="text" name="state" value={formData.state} onChange={handleInputChange} required className="modal-input" maxLength="2" placeholder="Ex: SP" />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
              <button type="button" onClick={fetchCoordinates} disabled={loadingCoords} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Map size={18} />
                {loadingCoords ? 'Buscando nas bases de dados...' : 'Buscar Coordenadas Automaticamente'}
              </button>
            </div>

            <div className="form-group">
              <label>Latitude</label>
              <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} className="modal-input" placeholder="-23.5505" />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} className="modal-input" placeholder="-46.6333" />
            </div>
          </div>

          <div className="modal-action-buttons" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-confirm">
              <Save size={18} /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const AddressPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAll();
      setAddresses(data);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSave = async (formData) => {
    try {
      if (editingAddress) {
        await addressService.update(editingAddress.id, formData);
        alert('Endereço atualizado com sucesso!');
      } else {
        await addressService.create(formData);
        alert('Endereço criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      alert('Erro ao salvar endereço. Verifique os dados.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este endereço?')) {
      try {
        await addressService.delete(id);
        alert('Endereço excluído!');
        fetchAddresses();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir endereço.');
      }
    }
  };

  const openNewModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const filtered = addresses.filter(a => 
    (a.street || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.cep || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { label: 'Logradouro', key: 'street', render: (row) => `${row.street}, ${row.number}` },
    { label: 'Bairro', key: 'district', render: (row) => row.district || '-' },
    { label: 'Cidade/UF', key: 'city', render: (row) => `${row.city} - ${row.state}` },
    { label: 'CEP', key: 'cep', render: (row) => row.cep || '-' },
    { label: 'Coordenadas', key: 'coords', render: (row) => (row.latitude && row.longitude) ? `${row.latitude}, ${row.longitude}` : '-' },
    { 
      label: 'Ações', 
      key: 'actions', 
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => openEditModal(row)} className="action-btn edit" title="Editar">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="action-btn delete" title="Excluir">
            <Trash2 size={18} />
          </button>
        </div>
      ) 
    }
  ];

  return (
    <div className="profiles-container fade-in">
      <PageHeader 
        title="Endereços"
        description="Gerencie os endereços de coleta, entrega e das empresas."
        icon={Map}
        onBack={true}
      >
        <button className="btn-primary" onClick={openNewModal}>
          <Plus size={20} />
          Novo Endereço
        </button>
      </PageHeader>

      <div className="profiles-table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
          <div className="search-input-wrapper" style={{ minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Pesquisar por rua, cidade ou CEP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="profiles-input"
              style={{ width: '100%', paddingRight: '2.5rem' }}
            />
            <Search className="search-icon" size={18} style={{ position: 'absolute', right: '12px' }} />
          </div>
          <span className="profiles-count" style={{ margin: 0 }}>{filtered.length} resultados</span>
        </div>
        
        <DataTable 
          columns={columns} 
          data={filtered} 
          loading={loading}
          emptyMessage="Nenhum endereço encontrado."
          itemsPerPage={10}
        />
      </div>

      <AddressModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        address={editingAddress} 
      />
    </div>
  );
};

export default AddressPage;
