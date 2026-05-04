import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Truck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Monitoring.css';
import MonitoringModal from '../components/MonitoringModal';
import MapComponent from '../components/MapComponent';

const MonitoringPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: A API possui endpoints para inserir/atualizar telemetria (/telemetry e /telemetry/{id}),
    // mas falta um endpoint (GET All) que traga o último status atualizado de todos os veículos ativos.
    // Assim que a API tiver (ex: GET /telemetry/active), puxamos aqui.
    
    // DADOS TEMPORÁRIOS MOCKADOS APENAS PARA DEMONSTRAR O MAPA (OpenStreetMap)
    const mockMapVehicles = [
      { id: '1', plate: 'ABC-1234', driver: 'João Silva', lat: -23.55052, lng: -46.633308, status: 'active', speed: 60 },
      { id: '2', plate: 'XYZ-9876', driver: 'Lucas Gonçalves', lat: -23.5615, lng: -46.6550, status: 'normal', speed: 45 },
      { id: '3', plate: 'DEF-5678', driver: 'Jonathan Alves', lat: -23.5420, lng: -46.6200, status: 'delayed', speed: 0 }
    ];

    setVehicles(mockMapVehicles);
    setLoading(false);
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="monitoring-page fullscreen-map fade-in">
      
      {/* Real OpenStreetMap Integration as Background */}
      <div className="monitoring-map-bg-wrapper">
         <MapComponent 
           markers={vehicles.map(v => ({
             id: v.id,
             lat: v.lat,
             lng: v.lng,
             label: v.driver,
             status: v.status,
             speed: v.speed
           }))}
         />
      </div>

      {/* Floating Header (Top Left) */}
      <div className="floating-header-panel">
        <button className="back-button glass-btn" onClick={() => navigate('/')}>
          <ChevronLeft size={18} /> Voltar à Dashboard
        </button>
        <div className="monitoring-header">
          <h2>Monitoramento de veículos em transporte</h2>
        </div>
      </div>

      {/* Floating Panel (Right) */}
        <div className="floating-panel">
          <h3>Buscar Motorista / Caminhão</h3>
          
          <div className="search-input-wrapper">
            <input 
              type="text" 
              placeholder="Value" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="monitoring-search-input"
            />
            <Search className="search-icon" size={16} />
          </div>

          <div className="vehicles-list">
            {filteredVehicles.map((vehicle) => (
              <div 
                key={vehicle.id} 
                className="vehicle-list-item"
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div className="vehicle-item-left">
                  <Truck size={16} color="var(--text-color)" />
                  <span>{vehicle.plate} - {vehicle.driver}</span>
                </div>
                <ChevronRight size={16} color="var(--text-light)" />
              </div>
            ))}
            {filteredVehicles.length === 0 && (
              <div className="no-results">Nenhum veículo encontrado</div>
            )}
          </div>
        </div>

      {/* Modal Details */}
      <MonitoringModal 
        isOpen={!!selectedVehicle} 
        onClose={() => setSelectedVehicle(null)} 
        vehicle={selectedVehicle}
      />
    </div>
  );
};

export default MonitoringPage;
