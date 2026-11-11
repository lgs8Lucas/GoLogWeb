import { geocodeAddress, PRECISION_LABEL } from '../utils/geocode';
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Save, X, Search, Map } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { addressService } from '../services/addressService';
import { createPortal } from 'react-dom';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

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
  const [geoMessage, setGeoMessage] = useState('');

  const fetchCoordinates = async () => {
    if (!formData.street || !formData.city || !formData.state) {
      setGeoMessage('Preencha logradouro, cidade e UF para buscar as coordenadas.');
      return;
    }
    setLoadingCoords(true);
    setGeoMessage('');
    try {
      const geo = await geocodeAddress(formData);
      if (geo) {
        setFormData(prev => ({ ...prev, latitude: geo.latitude, longitude: geo.longitude }));
        if (geo.precision !== 'endereco') {
          setGeoMessage(`Localizado pelo ${PRECISION_LABEL[geo.precision]} — confira as coordenadas.`);
        }
      } else {
        setGeoMessage('Coordenadas não encontradas. Revise o endereço ou informe latitude/longitude manualmente.');
      }
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      setGeoMessage('Erro de rede ao buscar coordenadas.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, state: (formData.state || '').toUpperCase(), country: formData.country || 'Brasil' };
    // Sem coordenadas o endereço não serve para roteirização: tenta localizar automaticamente
    if (!payload.latitude || !payload.longitude) {
      setLoadingCoords(true);
      const geo = await geocodeAddress(payload).catch(() => null);
      setLoadingCoords(false);
      if (!geo) {
        setGeoMessage('Não foi possível localizar o endereço. Informe latitude e longitude para salvar.');
        return;
      }
      payload.latitude = geo.latitude;
      payload.longitude = geo.longitude;
    }
    if (!payload.complement || payload.complement.trim() === '') {
      delete payload.complement;
    }
    if (payload.latitude) payload.latitude = String(payload.latitude);
    if (payload.longitude) payload.longitude = String(payload.longitude);

    onSave(payload);
  };

  return createPortal(
    <div className="modal-overlay fade-in">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={22} color="var(--primary-color)" />
            {address ? 'Editar Endereço' : 'Novo Endereço'}
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid form-grid-2">
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Logradouro (Rua / Avenida)</label>
                <input type="text" name="street" value={formData.street} onChange={handleInputChange} required className="form-input" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Número</label>
                <input type="text" name="number" value={formData.number} onChange={handleInputChange} required className="form-input" />
              </div>
              
              <div className="form-group">
                <label className="form-label">CEP</label>
                <input type="text" name="cep" value={formData.cep} onChange={handleInputChange} required className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Bairro</label>
                <input type="text" name="district" value={formData.district} onChange={handleInputChange} required className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Complemento</label>
                <input type="text" name="complement" value={formData.complement} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Estado (UF)</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} maxLength="2" required className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} className="form-input" placeholder="-22.3659" />
              </div>

              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} className="form-input" placeholder="-47.3809" />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-start' }}>
                <button type="button" onClick={fetchCoordinates} disabled={loadingCoords} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
                  {loadingCoords ? 'Buscando coordenadas…' : 'Buscar coordenadas pelo endereço'}
                </button>
                {geoMessage && (
                  <span style={{ marginLeft: '0.75rem', alignSelf: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{geoMessage}</span>
                )}
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Salvar Endereço
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAllAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      showToast('Erro ao carregar lista de endereços.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreate = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDelete = (address) => {
    setAddressToDelete(address);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      await addressService.deleteAddress(addressToDelete.id);
      showToast('Endereço excluído com sucesso!', 'success');
      fetchAddresses();
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      showToast('Erro ao excluir o endereço.', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleSave = async (payload) => {
    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, payload);
        showToast('Endereço atualizado com sucesso!', 'success');
      } else {
        await addressService.createAddress(payload);
        showToast('Endereço cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      showToast(error.response?.data?.message || 'Falha ao salvar o endereço.', 'error');
    }
  };

  const addressColumns = [
    { 
      label: 'Logradouro', 
      key: 'street',
      render: (row) => `${row.street || ''}, ${row.number || 'S/N'}` 
    },
    { label: 'Bairro', key: 'district' },
    { label: 'Cidade / UF', key: 'city', render: (row) => `${row.city || '-'} (${row.state || '-'})` },
    { label: 'CEP', key: 'cep' },
    { label: 'Coordenadas GPS', key: 'latitude', render: (row) => row.latitude ? `${row.latitude}, ${row.longitude}` : '-' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Endereços"
        description="Gerenciamento de pontos de coleta, entrega e coordenadas GPS."
        icon={Map}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={handleCreate}>
          <Plus size={18} /> Novo Endereço
        </button>
      </PageHeader>

      <div className="card">
        <DataTable 
          columns={addressColumns}
          data={addresses}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          itemsPerPage={12}
          searchPlaceholder="Pesquisar por logradouro, cidade, bairro ou CEP..."
        />
      </div>

      <AddressModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        address={editingAddress}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Endereço"
        message={`Deseja realmente excluir o endereço ${addressToDelete?.street}, ${addressToDelete?.number}?`}
      />
    </div>
  );
};

export default AddressPage;
