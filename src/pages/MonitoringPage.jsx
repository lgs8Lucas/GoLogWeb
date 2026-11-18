import { translateStatus } from '../utils/enumTranslations';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ChevronRight, Truck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Monitoring.css';
import MonitoringModal from '../components/MonitoringModal';
import MapComponent from '../components/MapComponent';
import { deliveryService } from '../services/deliveryService';
import { transportService } from '../services/transportService';
import { occurrenceService } from '../services/occurrenceService';
import { decodePolyline } from '../utils/polyline';
import { isTripFinished } from '../utils/tripStatus';

const TRIP_PALETTE = ['#2ab29b', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#ec4899', '#84cc16'];
const hashCode = (str = '') => [...str].reduce((h, ch) => ((h << 5) - h + ch.charCodeAt(0)) | 0, 0);
const REFRESH_MS = 30000;

const signalAge = (at) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `há ${h}h` : `há ${Math.floor(h / 24)}d`;
};

/** Última posição recebida por telemetria (gravada pelo backend na viagem). */
const lastPosition = (t) => {
  const lat = Number(t.lastTelemetryLat);
  const lng = Number(t.lastTelemetryLon);
  if (t.lastTelemetryLat == null || t.lastTelemetryLon == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { coord: [lat, lng], at: t.lastTelemetryAt };
};

const MonitoringPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetchRealData = useCallback(async () => {
      try {
        const [shipments, occurrences, transports] = await Promise.all([
          deliveryService.getAllPersonalized(),
          occurrenceService.getAll(),
          transportService.getAll().catch(() => [])
        ]);
        const safeShipments = Array.isArray(shipments) ? shipments : (shipments?.content || []);
        const safeOccurrences = Array.isArray(occurrences) ? occurrences : (occurrences?.content || []);
        const safeTransports = Array.isArray(transports) ? transports : (transports?.content || []);
        // Group shipments by transport
        const transportsMap = {};

        // Inicia o mapa com todos os transportes conhecidos
        safeTransports.forEach(t => {
          if (!t || !t.id) return;
          transportsMap[t.id] = {
            id: t.id,
            code: t.codeTransport || t.id.substring(0, 8),
            plate: t.equipamentGroup?.equipament1?.plate || 'Cavalo',
            plate2: t.equipamentGroup?.equipament2?.plate || '-',
            driver: t.driver?.user?.name || 'Sem motorista',
            driverUserId: t.driver?.user?.id,
            routePlanned: t.routePlanned,
            routeCompleted: t.routeCompleted,
            calculedDistance: t.calculedDistance || 0,
            distanceTraveled: t.distanceTraveled || 0,
            totalTimeCalculed: t.totalTimeCalculed || 0,
            totalTime: t.totalTime || 0,
            totalCostCalculed: t.totalCostCalculed || 0,
            totalCost: t.totalCost || 0,
            costKmCalculed: t.costKmCalculed,
            costHourCalculed: t.costHourCalculed,
            travelDuration: t.travelDuration,
            lastTelemetryLat: t.lastTelemetryLat,
            lastTelemetryLon: t.lastTelemetryLon,
            lastTelemetryAt: t.lastTelemetryAt,
            shipments: []
          };
        });

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
              driverUserId: s.transport.driver?.user?.id,
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
              lastTelemetryLat: s.transport.lastTelemetryLat,
              lastTelemetryLon: s.transport.lastTelemetryLon,
              lastTelemetryAt: s.transport.lastTelemetryAt,
              shipments: []
            };
          }
          transportsMap[tid].shipments.push(s);
        });

        // Monitoramento mostra só viagens em operação: as que têm todas as paradas finalizadas saem do painel
        const groupedTrips = Object.values(transportsMap)
          .filter(t => !isTripFinished(t.shipments, t))
          .map(t => {
          t.shipments.sort((a, b) => {
            const seqA = a.routeStop?.sequenceOrder ?? 999;
            const seqB = b.routeStop?.sequenceOrder ?? 999;
            return seqA - seqB;
          });

          // Decode planned and completed coordinates
          t.routePlannedCoords = decodePolyline(t.routePlanned);
          t.routeCompletedCoords = decodePolyline(t.routeCompleted);
          t.position = lastPosition(t);
          t.occurrences = safeOccurrences.filter(occ => (occ.transportId || occ.transport?.id) === t.id);

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
        setUpdatedAt(new Date());
      } catch (error) {
        console.error('Erro ao carregar dados de monitoramento:', error);
      } finally {
        setLoading(false);
      }
  }, []);

  // Carga inicial + atualização periódica (pausa com a aba em segundo plano)
  useEffect(() => {
    fetchRealData();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchRealData();
    }, REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchRealData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [fetchRealData]);

  // O modal acompanha os dados atualizados da viagem selecionada
  const selectedVehicle = useMemo(() => trips.find(t => t.id === selectedId) || null, [trips, selectedId]);

  const filteredTrips = trips.filter(t => 
    (t.plate || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.driver || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.code || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Map trips to polylines for the map view
  // Rotas da busca atual; cores ficam a cargo da paleta fixa do mapa (cor segue a viagem, não o índice do filtro)
  const mapPolylines = filteredTrips.flatMap((t) => {
    const color = TRIP_PALETTE[Math.abs(hashCode(t.id)) % TRIP_PALETTE.length];
    const label = `Viagem #${t.code} · ${t.plate} · ${t.driver}`;
    const planned = {
    id: t.id,
    coords: t.routePlannedCoords,
    color,
    label,
    vehicle: t.position ? { ...t.position, label } : null,
    stops: t.shipments
      .map(s => {
        const addr = s.address || s.customer?.address;
        if (!addr || !addr.latitude || !addr.longitude) return null;
        return {
          coord: [parseFloat(addr.latitude), parseFloat(addr.longitude)],
          type: s.typeOperation,
          label: s.customer?.legalName || 'Cliente',
          status: s.status,
          statusLabel: translateStatus(s.status),
          sequence: s.routeStop?.sequenceOrder
        };
      })
      .filter(Boolean)
    };
    if (t.routeCompletedCoords?.length < 2) return [planned];
    return [planned, { id: `${t.id}-realizado`, variant: 'realized', coords: t.routeCompletedCoords, color, label: `Realizado · ${label}`, stops: [] }];
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
            <span>MONITORAMENTO</span>
          </div>
          <h2>{trips.length} {trips.length === 1 ? 'viagem' : 'viagens'} em operação</h2>
          {updatedAt && (
            <span className="monitoring-updated-at">
              Atualizado às {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · a cada 30 s
            </span>
          )}
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
              onClick={() => setSelectedId(trip.id)}
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
                    {trip.position?.at && (
                      <span className="badge-signal" title={`Última posição: ${new Date(trip.position.at).toLocaleString('pt-BR')}`}>
                        sinal {signalAge(trip.position.at)}
                      </span>
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
        onClose={() => setSelectedId(null)} 
        vehicle={selectedVehicle}
      />
    </div>
  );
};

export default MonitoringPage;
