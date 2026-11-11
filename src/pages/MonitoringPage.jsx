import { translateStatus } from '../utils/enumTranslations';
import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Truck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Monitoring.css';
import MonitoringModal from '../components/MonitoringModal';
import MapComponent from '../components/MapComponent';
import { deliveryService } from '../services/deliveryService';
import { decodePolyline } from '../utils/polyline';

const TRIP_PALETTE = ['#2ab29b', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#ec4899', '#84cc16'];
const hashCode = (str = '') => [...str].reduce((h, ch) => ((h << 5) - h + ch.charCodeAt(0)) | 0, 0);

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
  // Rotas da busca atual; cores ficam a cargo da paleta fixa do mapa (cor segue a viagem, não o índice do filtro)
  const mapPolylines = filteredTrips.map((t) => ({
    id: t.id,
    coords: t.routePlannedCoords,
    color: TRIP_PALETTE[Math.abs(hashCode(t.id)) % TRIP_PALETTE.length],
    label: `Viagem #${t.code} · ${t.plate} · ${t.driver}`,
    stops: t.shipments
      .filter(s => s.address?.latitude && s.address?.longitude)
      .map(s => ({
        coord: [parseFloat(s.address.latitude), parseFloat(s.address.longitude)],
        type: s.typeOperation,
        label: s.customer?.legalName,
        status: s.status,
        statusLabel: translateStatus(s.status),
        sequence: s.routeStop?.sequenceOrder
      }))
  }));

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
            <span>MONITORAMENTO</span>
          </div>
          <h2>{trips.length} {trips.length === 1 ? 'viagem' : 'viagens'} em operação</h2>
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
                      <span className="badge-distance-km">{((trip.calculedDistance || 0) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km</span>
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
