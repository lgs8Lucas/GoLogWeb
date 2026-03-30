import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Truck } from 'lucide-react';
import '../styles/Monitoring.css';
import MonitoringModal from '../components/MonitoringModal';
import { mockApi } from '../services/api';

const MonitoringPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getActiveVehicles().then(data => {
      setVehicles(data);
      setLoading(false);
    });
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="monitoring-page fade-in">
      <div className="monitoring-header">
        <h2>Monitoramento de veículos em transporte</h2>
      </div>

      <div className="monitoring-map-container">
        {/* Background Map Placeholder */}
        <img 
          src="/@fs/home/fgsl/.gemini/antigravity/brain/d408a495-8f95-45cf-a16d-c77606a503b7/media__1774837734012.png" 
          alt="Map" 
          className="monitoring-map-bg"
        />

        {/* Map Pins */}
        {loading ? (
             <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)'}}>Carregando...</div>
        ) : vehicles.map((vehicle) => (
          <div 
            key={vehicle.id}
            className="monitoring-pin"
            style={{ top: vehicle.lat, left: vehicle.lng }}
            onClick={() => setSelectedVehicle(vehicle)}
          >
            <div className="pin-circle">
              <Truck size={14} color="#c92a2a" />
            </div>
            <div className="pin-label">{vehicle.driver.split(' ')[0]}</div>
          </div>
        ))}

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
