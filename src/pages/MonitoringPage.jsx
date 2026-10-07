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
        const safeShipments = Array.isArray(shipments) ? shipments : (shipments?.content || []);
        // Group shipments by transport
        const transportsMap = {};

        safeShipments.forEach(s => {
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
              calculedDistance: s.transport.calculedDistance || 0,
              distanceTraveled: s.transport.distanceTraveled || 0,
              totalTimeCalculed: s.transport.totalTimeCalculed || 0,
              totalTime: s.transport.totalTime || 0,
              totalCostCalculed: s.transport.totalCostCalculed || 0,
              totalCost: s.transport.totalCost || 0,
              costKmCalculed: s.transport.costKmCalculed,
              costHourCalculed: s.transport.costHourCalculed,
              travelDuration: s.transport.travelDuration,
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

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'IN_TRANSIT'

  return (
    <div className="monitoring-page fullscreen-map fade-in">
      {/* Background Map */}
      <div className="monitoring-map-bg-wrapper">
         {loading ? (
           <div className="monitoring-loading-box">
             Carregando malha logística de transporte...
           </div>
         ) : (
           <MapComponent 
             polylines={mapPolylines}
             interactive={true}
           />
         )}
      </div>

      {/* Floating Header (Top Left) */}
      <div className="floating-header-panel">
        <div className="header-controls-row">
          <button className="back-button glass-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} /> Dashboard
          </button>

          <button 
            className="panel-toggle-btn glass-btn" 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            title={isPanelOpen ? "Recolher painel lateral" : "Expandir painel de frotas"}
          >
            {isPanelOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            <span>{isPanelOpen ? 'Ocultar Painel' : 'Ver Veículos'}</span>
          </button>
        </div>

        <div className="monitoring-header">
          <div className="header-badge-live">
            <span className="live-dot"></span>
            <span>TELEMETRIA GLOBAL</span>
          </div>
          <h2>{trips.length} Veículos em Monitoramento</h2>
        </div>
      </div>

      {/* Floating Collapsible Panel (Right) */}
      <div className={`floating-panel ${!isPanelOpen ? 'collapsed' : ''}`}>
        <div className="floating-panel-header">
          <div>
            <h3>Frotas em Rota</h3>
            <span className="panel-subtitle">{filteredTrips.length} viagens disponíveis</span>
          </div>
          <button 
            className="panel-close-trigger" 
            onClick={() => setIsPanelOpen(false)}
            title="Minimizar painel"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        <div className="search-input-wrapper">
          <input 
            type="text" 
            placeholder="Buscar por placa, motorista ou nº..." 
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
                <div className="vehicle-icon-box">
                  <Truck size={18} />
                </div>
                <div className="vehicle-meta">
                  <span className="vehicle-primary-text">#{trip.code} • {trip.plate}</span>
                  <span className="vehicle-driver-text">{trip.driver}</span>
                  <div className="vehicle-sub-badges">
                    <span className="badge-stops-count">{trip.shipments.length} paradas</span>
                    {trip.calculedDistance > 0 && (
                      <span className="badge-distance-km">{trip.calculedDistance.toFixed(0)} km</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="vehicle-arrow-icon" />
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
