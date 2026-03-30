import React, { useState } from 'react';
import { Search, ChevronRight, Truck } from 'lucide-react';
import '../styles/Monitoring.css';
import MonitoringModal from '../components/MonitoringModal';

const MOCK_VEHICLES = [
  { id: '1', plate: 'EZP7A66', driver: 'Lucas Gonçalves', lat: '40%', lng: '30%', status: 'Em viagem' },
  { id: '2', plate: 'HMT2570', driver: 'Jonathan Alves', lat: '45%', lng: '45%', status: 'Em viagem' },
  { id: '3', plate: 'EPG4667', driver: 'João Neves', lat: '75%', lng: '60%', status: 'Em viagem' }
];

const MonitoringPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const filteredVehicles = MOCK_VEHICLES.filter(v => 
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
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
          alt="Map" 
          className="monitoring-map-bg"
        />

        {/* Map Pins */}
        {MOCK_VEHICLES.map((vehicle) => (
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
