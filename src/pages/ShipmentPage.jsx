import React, { useState, useEffect } from 'react';
import { Package, Trash2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { deliveryService } from '../services/deliveryService';
import '../styles/Profiles.css'; // Reusing standard styles

const ShipmentPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const data = await deliveryService.getAll();
      setShipments(data);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta entrega?')) {
      try {
        await deliveryService.delete(id);
        alert('Entrega excluída com sucesso!');
        fetchShipments();
      } catch (error) {
        console.error('Erro ao excluir entrega:', error);
        alert('Erro ao excluir entrega.');
      }
    }
  };

  const filteredShipments = shipments.filter(item => 
    (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.typeOperation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { label: 'Código', key: 'id', render: (row) => row.id ? row.id.substring(0, 8) : 'N/A' },
    { label: 'Operação', key: 'typeOperation', render: (row) => row.typeOperation || 'ENTREGA' },
    { label: 'Peso', key: 'weight', render: (row) => `${row.weight || 0} kg` },
    { label: 'Volume', key: 'volume', render: (row) => `${row.volume || 0} m³` },
    { label: 'Agendamento', key: 'schedulind', render: (row) => row.schedulind ? new Date(row.schedulind).toLocaleString('pt-BR') : '-' },
    { label: 'Status', key: 'status', render: (row) => row.status || 'PENDING' },
    { 
      label: 'Ações', 
      key: 'actions', 
      render: (row) => (
        <button 
          onClick={() => handleDelete(row.id)} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}
          title="Excluir Entrega"
        >
          <Trash2 size={18} />
        </button>
      ) 
    }
  ];

  return (
    <div className="profiles-container fade-in">
      <PageHeader 
        title="Entregas & Cargas"
        description="Acompanhe todas as ordens de coleta e entrega registradas no sistema."
        icon={Package}
        onBack={true}
      />

      <div className="profiles-table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
          <div className="search-input-wrapper" style={{ minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Pesquisar por ID, status ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="profiles-input"
              style={{ width: '100%', paddingRight: '2.5rem' }}
            />
            <Search className="search-icon" size={18} style={{ position: 'absolute', right: '12px' }} />
          </div>
          <span className="profiles-count" style={{ margin: 0 }}>{filteredShipments.length} resultados</span>
        </div>
        
        <DataTable 
          columns={columns} 
          data={filteredShipments} 
          loading={loading}
          emptyMessage="Nenhuma entrega registrada."
          itemsPerPage={15}
        />
      </div>
    </div>
  );
};

export default ShipmentPage;
