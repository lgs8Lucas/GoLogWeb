import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Save, XOctagon, Edit, Trash2, Truck, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profiles.css'; 
import '../styles/Fleet.css'; 
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { equipamentService } from '../services/equipamentService';
import { tractorService } from '../services/tractorService';
import { trailerService } from '../services/trailerService';

const FleetPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    plate: '',
    status: 'ativo',
    renavam: '',
    model: '',
    maximumCapacity: '',
    numberAxles: '2',
    tipo: 'carreta', // 'carreta' (Trailer) or 'truck'/'toco'/'vuc' (Tractor)
    // Tractor specific
    typeFuel: 'DIESEL',
    kmPerLiter: '2.5',
    // Trailer specific
    maximumVolume: '100',
    companyId: '7f564f96-d90f-42cc-beb2-e37cf63a324d' // Default GoLogTransportes UUID
  });

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const data = await equipamentService.getAll();
      const mapped = data.map(item => {
        // Simple heuristic to distinguish tractor vs trailer based on model/capacity/axles
        const isTrailer = item.model?.toLowerCase().includes('carreta') || item.model?.toLowerCase().includes('reboque') || (item.maximumCapacity > 15000);
        return {
          id: item.id,
          placa: item.plate,
          status: item.active !== false ? 'Ativo' : 'Inativo',
          renavam: item.renavam,
          marca: item.model || 'Volvo FH',
          capacidade: `${item.maximumCapacity || 0} kg`,
          tipo: isTrailer ? 'Carreta' : 'Caminhão'
        };
      });
      setFleet(mapped);
    } catch (error) {
      console.error('Erro ao buscar frota:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    try {
      const isTrailer = formData.tipo === 'carreta';
      const commonPayload = {
        plate: formData.plate,
        renavam: formData.renavam,
        model: formData.model,
        numberAxles: parseInt(formData.numberAxles, 10),
        maximumCapacity: parseFloat(formData.maximumCapacity || 0),
        companyId: formData.companyId
      };

      if (isTrailer) {
        const trailerPayload = {
          ...commonPayload,
          maximumVolume: parseFloat(formData.maximumVolume || 0)
        };
        await trailerService.create(trailerPayload);
      } else {
        const tractorPayload = {
          ...commonPayload,
          typeFuel: formData.typeFuel,
          "Type Fuel": formData.typeFuel, // Backwards-compatibility/typo map
          kmPerLiter: parseFloat(formData.kmPerLiter || 0)
        };
        await tractorService.create(tractorPayload);
      }

      alert('Veículo criado com sucesso!');
      setIsModalOpen(false);
      // Reset form
      setFormData({
        plate: '',
        status: 'ativo',
        renavam: '',
        model: '',
        maximumCapacity: '',
        numberAxles: '2',
        tipo: 'carreta',
        typeFuel: 'DIESEL',
        kmPerLiter: '2.5',
        maximumVolume: '100',
        companyId: '7f564f96-d90f-42cc-beb2-e37cf63a324d'
      });
      fetchFleet();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      let mensagens = 'Erro ao salvar veículo. Verifique se o UUID da empresa está correto e se preencheu todos os campos requeridos.';
      if (Array.isArray(error.response?.data)) {
        mensagens = error.response.data.join('\n');
      } else if (error.response?.data?.message) {
        mensagens = error.response.data.message;
      }
      alert(mensagens);
    }
  };

  const filteredFleet = fleet.filter(item => 
    (item.placa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.tipo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fleetColumns = [
    { label: 'Placa', key: 'placa' },
    { label: 'Status', key: 'status' },
    { label: 'Renavam', key: 'renavam' },
    { label: 'Marca/Modelo', key: 'marca' },
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
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={24} color="var(--primary-color)" />
                Novo Veículo
              </h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle}>
              <div className="modal-body">
                <div className="form-grid">
                  
                  <div className="form-field">
                    <label className="profiles-label">Placa (Ex: AAA-1234 ou AAA1A23)</label>
                    <input 
                      type="text" 
                      name="plate" 
                      value={formData.plate} 
                      onChange={handleInputChange} 
                      className="profiles-input" 
                      placeholder="ABC-1234" 
                      required 
                    />
                  </div>
                  
                  <div className="form-field">
                    <label className="profiles-label">Status</label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange} 
                      className="profiles-input"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="manutencao">Em Manutenção</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="profiles-label">UUID Empresa Vinculada</label>
                    <input 
                      type="text" 
                      name="companyId" 
                      value={formData.companyId} 
                      onChange={handleInputChange} 
                      className="profiles-input" 
                      required 
                    />
                  </div>

                  <div className="form-field">
                    <label className="profiles-label">Renavam (Exatamente 11 dígitos)</label>
                    <input 
                      type="text" 
                      name="renavam" 
                      value={formData.renavam} 
                      onChange={handleInputChange} 
                      className="profiles-input" 
                      placeholder="00000000000" 
                      required 
                    />
                  </div>

                  <div className="form-field">
                    <label className="profiles-label">Número de Eixos</label>
                    <input 
                      type="number" 
                      name="numberAxles" 
                      value={formData.numberAxles} 
                      onChange={handleInputChange} 
                      className="profiles-input" 
                      required 
                    />
                  </div>

                  <div className="form-field">
                    <label className="profiles-label">Marca/Modelo</label>
                    <input 
                      type="text" 
                      name="model" 
                      value={formData.model} 
                      onChange={handleInputChange} 
                      className="profiles-input" 
                      placeholder="Volvo FH" 
                      required 
                    />
                  </div>

                  <div className="form-field">
                    <label className="profiles-label">Capacidade Máxima (Kg)</label>
                    <input 
                      type="number" 
                      name="maximumCapacity" 
                      value={formData.maximumCapacity} 
                      onChange={handleInputChange} 
                      className="profiles-input" 
                      placeholder="30000" 
                      required 
                    />
                  </div>

                  <div className="form-field">
                    <label className="profiles-label">Tipo de Veículo</label>
                    <select 
                      name="tipo" 
                      value={formData.tipo} 
                      onChange={handleInputChange} 
                      className="profiles-input"
                      required
                    >
                      <option value="carreta">Carreta (Trailer)</option>
                      <option value="truck">Caminhão - Truck (Tractor)</option>
                      <option value="toco">Caminhão - Toco (Tractor)</option>
                      <option value="vuc">Caminhão - VUC (Tractor)</option>
                    </select>
                  </div>

                  {/* Trailer-specific field */}
                  {formData.tipo === 'carreta' && (
                    <div className="form-field">
                      <label className="profiles-label">Volume Máximo (m³)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        name="maximumVolume" 
                        value={formData.maximumVolume} 
                        onChange={handleInputChange} 
                        className="profiles-input" 
                        required 
                      />
                    </div>
                  )}

                  {/* Tractor-specific fields */}
                  {formData.tipo !== 'carreta' && (
                    <>
                      <div className="form-field">
                        <label className="profiles-label">Tipo de Combustível</label>
                        <select 
                          name="typeFuel" 
                          value={formData.typeFuel} 
                          onChange={handleInputChange} 
                          className="profiles-input"
                          required
                        >
                          <option value="DIESEL">Diesel</option>
                          <option value="GASOLINA">Gasolina</option>
                          <option value="ETANOL">Etanol</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="profiles-label">Consumo (Km/L)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          name="kmPerLiter" 
                          value={formData.kmPerLiter} 
                          onChange={handleInputChange} 
                          className="profiles-input" 
                          required 
                        />
                      </div>
                    </>
                  )}

                  <div className="modal-action-buttons" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)} style={{ padding: '0.85rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                      <XOctagon size={16} /> Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      <Save size={16} /> Salvar Veículo
                    </button>
                  </div>
                  
                </div>
              </div>
            </form>
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
              placeholder="Pesquisar placa, modelo ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="profiles-input"
              style={{ width: '100%', paddingRight: '2.5rem' }}
            />
            <Search className="search-icon" size={18} style={{ position: 'absolute', right: '12px' }} />
          </div>
          <span className="profiles-count" style={{ margin: 0 }}>{filteredFleet.length} resultados</span>
        </div>
        <DataTable
          columns={fleetColumns}
          data={filteredFleet}
          loading={loading}
          itemsPerPage={15}
        />
      </div>

    </div>
  );
};

export default FleetPage;
