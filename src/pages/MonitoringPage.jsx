import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Truck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Monitoring.css';
import MonitoringModal from '../components/MonitoringModal';
import MapComponent from '../components/MapComponent';
import { deliveryService } from '../services/deliveryService';
import { decodePolyline } from '../utils/polyline';

const MonitoringPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const shipments = await deliveryService.getAllPersonalized();
        // Group shipments by transport
        const transportsMap = {};

        shipments.forEach(s => {
          if (!s.transport) return;
          const tid = s.transport.id;
          if (!transportsMap[tid]) {
            transportsMap[tid] = {
              id: tid,
              code: s.transport.codeTransport || tid.substring(0, 8),
              plate: s.transport.equipamentGroup?.equipament1?.plate || 'Cavalo',
              plate2: s.transport.equipamentGroup?.equipament2?.plate || '-',
              driver: s.transport.driver?.user?.name || 'Sem motorista',
              routePlanned: s.transport.routePlanned,
              routeCompleted: s.transport.routeCompleted,
              shipments: []
            };
          }
          transportsMap[tid].shipments.push(s);
        });

        const groupedTrips = Object.values(transportsMap).map(t => {
          t.shipments.sort((a, b) => {
            const seqA = a.routeStop?.sequenceOrder ?? 999;
            const seqB = b.routeStop?.sequenceOrder ?? 999;
            return seqA - seqB;
          });

          // Decode planned and completed coordinates
          t.routePlannedCoords = decodePolyline(t.routePlanned);
          t.routeCompletedCoords = decodePolyline(t.routeCompleted);

          // Decode individual stops coordinates if available
          t.shipments = t.shipments.map(s => {
            const rs = s.routeStop;
            return {
              ...s,
              routePlannedCoords: rs ? decodePolyline(rs.routePlanned) : [],
              routeCompletedCoords: rs ? decodePolyline(rs.routeCompleted) : []
            };
          });

          return t;
        });

        setTrips(groupedTrips);
      } catch (error) {
        console.error('Erro ao carregar dados de monitoramento:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  const filteredTrips = trips.filter(t => 
    (t.plate || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.driver || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.code || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Map trips to polylines for the map view
  const mapPolylines = trips.map((t, idx) => {
    // Generate distinct colors for each transport route
    const colors = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#0891b2'];
    const color = colors[idx % colors.length];

    return {
      id: t.id,
      coords: t.routePlannedCoords,
      color: color,
      label: `Transporte #${t.code} (${t.plate}) - ${t.driver}`,
      distance: t.shipments.reduce((sum, s) => sum + (s.routeStop?.calculatedDistance || 0), 0)
    };
  });

  return (
    <div className="monitoring-page fullscreen-map fade-in">
      
      {/* Real OpenStreetMap Integration as Background */}
      <div className="monitoring-map-bg-wrapper">
         {loading ? (
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-color)' }}>
             Carregando rotas de transporte...
           </div>
         ) : (
           <MapComponent 
             polylines={mapPolylines}
           />
         )}
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
            placeholder="Digite o motorista ou placa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="monitoring-search-input"
          />
          <Search className="search-icon" size={16} />
        </div>

        <div className="vehicles-list">
          {loading ? (
            <div className="no-results">Carregando viagens...</div>
          ) : filteredTrips.map((trip) => (
            <div 
              key={trip.id} 
              className="vehicle-list-item"
              onClick={() => setSelectedVehicle(trip)}
            >
              <div className="vehicle-item-left">
                <Truck size={16} color="var(--text-color)" />
                <span>#{trip.code} | {trip.plate} - {trip.driver}</span>
              </div>
              <ChevronRight size={16} color="var(--text-light)" />
            </div>
          ))}
          {!loading && filteredTrips.length === 0 && (
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
