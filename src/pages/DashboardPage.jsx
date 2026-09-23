import React, { useState, useEffect } from 'react';
import {
  Users,
  Truck,
  Package,
  TrendingUp,
  MapPin,
  Clock,
  ArrowDownIcon,
  ArrowUpIcon,
  BarChart3,
  AlertTriangle,
  Leaf,
  DollarSign,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import { deliveryService } from '../services/deliveryService';
import { dashboardService } from '../services/dashboardService';
import { decodePolyline } from '../utils/polyline';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [polylines, setPolylines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const metrics = await dashboardService.getAll();
        setStats(metrics);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setStats({
          quantidadeMotoristas: 0,
          rotasEmAndamento: 0,
          quantidadeEntregasEmTransporte: 0,
          backlogEntregasPendentes: 0,
          taxaAlocacao: 0,
          rotasConcluidas: 0,
          slaDia: 0,
          atrasos: 0,
          emissaoCo2Efetiva: 0,
          emissaoCo2Planejada: 0,
          custoTotalPlanejado: 0,
          custoTotalEfetivo: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();

    const fetchMapRoutes = async () => {
      try {
        const shipments = await deliveryService.getAllPersonalized();
        const transportsMap = {};

        shipments.forEach(s => {
          if (!s.transport) return;
          const tid = s.transport.id;
          if (!transportsMap[tid]) {
            transportsMap[tid] = {
              id: tid,
              routePlanned: s.transport.routePlanned,
              stops: []
            };
          }
          if (s.address && s.address.latitude && s.address.longitude) {
            transportsMap[tid].stops.push({
               coord: [parseFloat(s.address.latitude), parseFloat(s.address.longitude)],
               type: s.typeOperation,
               label: s.customer?.legalName || 'Cliente'
            });
          }
        });

        const decoded = Object.values(transportsMap).map(t => ({
          id: t.id,
          coords: decodePolyline(t.routePlanned),
          stops: t.stops
        }));

        setPolylines(decoded);
      } catch (error) {
        console.error('Erro ao carregar rotas no dashboard:', error);
      }
    };
    fetchMapRoutes();
  }, []);

  const [isMapExpanded, setIsMapExpanded] = useState(false);

  return (
    <div className={`dashboard-grid-container fade-in ${isMapExpanded ? 'map-fullwidth' : ''}`}>
      {/* Map Section (Main Interactive View) */}
      <div className={`dashboard-map-card card ${isMapExpanded ? 'expanded' : ''}`}>
        <div className="dashboard-card-header">
          <div className="dashboard-card-title">
            <div className="icon-badge">
              <MapPin size={22} color="var(--secondary-color)" />
            </div>
            <div>
              <div className="dashboard-title-row">
                <h2>Monitoramento de Frotas em Tempo Real</h2>
                <span className="live-pill-badge">
                  <span className="live-dot"></span> AO VIVO
                </span>
              </div>
              <p>Rastreamento operacional de rotas planejadas, coletas e entregas na malha logística</p>
            </div>
          </div>
          
          <div className="dashboard-header-actions">
            <div className="active-routes-counter">
              <span className="count-num">{polylines.length}</span>
              <span className="count-label">rotas no mapa</span>
            </div>

            <button 
              className="btn btn-icon btn-secondary" 
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              title={isMapExpanded ? "Restaurar layout padrão" : "Expandir visualização do mapa"}
            >
              <TrendingUp size={16} style={{ transform: isMapExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              <span>{isMapExpanded ? 'Reduzir' : 'Expandir'}</span>
            </button>

            <button className="btn btn-primary" onClick={() => navigate('/monitoramento')}>
              Central Telemetria
            </button>
          </div>
        </div>

        <div className="map-view-wrapper">
          <MapComponent 
            interactive={true}
            zoom={10}
            polylines={polylines}
          />
        </div>
      </div>

      {/* Statistics Column */}
      <div className="dashboard-stats-column">
        {/* Sustainability Carbon Footprint KPI */}
        <div className="sustainability-kpi-card">
          <div className="sustainability-header">
            <div className="leaf-badge">
              <Leaf size={22} color="#10b981" />
            </div>
            <div>
              <span className="sustainability-label">Pegada de Carbono da Frota</span>
              <h3 className="sustainability-title">Emissão de CO₂ Logístico</h3>
            </div>
          </div>

          <div className="sustainability-values">
            <div className="main-co2-val">
              {stats ? (stats.emissaoCo2Efetiva || 0).toFixed(2) : '0.00'} <small>kg CO₂</small>
            </div>
            <div className="target-co2-val" title="Meta Planejada">
              Meta: {stats ? (stats.emissaoCo2Planejada || 0).toFixed(2) : '0.00'} kg
            </div>
          </div>

          <p className="sustainability-footnote">
            Diferencial GoLog Verde para rastreamento de transporte sustentável.
          </p>
        </div>

        {/* Operational Metrics Cards Grid */}
        <div className="stats-kpi-grid">
          <div className="metric-kpi-card">
            <div className="metric-icon-box primary">
              <Users size={18} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Motoristas</span>
              <span className="metric-value">{stats ? stats.quantidadeMotoristas : '-'}</span>
            </div>
          </div>

          <div className="metric-kpi-card">
            <div className="metric-icon-box warning">
              <Truck size={18} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Rotas Ativas</span>
              <span className="metric-value">{stats ? stats.rotasEmAndamento : '-'}</span>
            </div>
          </div>

          <div className="metric-kpi-card">
            <div className="metric-icon-box info">
              <Package size={18} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Entregas Ativas</span>
              <span className="metric-value">{stats ? stats.quantidadeEntregasEmTransporte : '-'}</span>
            </div>
          </div>

          <div className="metric-kpi-card">
            <div className="metric-icon-box danger">
              <Clock size={18} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Backlog Pendente</span>
              <span className="metric-value">{stats ? stats.backlogEntregasPendentes : '-'}</span>
            </div>
          </div>
        </div>

        {/* Financial & Performance SLA KPI */}
        <div className="performance-kpi-card card">
          <h3 className="section-subtitle">
            <Activity size={18} color="var(--primary-color)" /> Indicadores de Performance & Custo
          </h3>

          <div className="kpi-metrics-row">
            <div className="kpi-metric-item">
              <span className="kpi-sublabel">Taxa de Alocação</span>
              <div className="kpi-big-value warning">
                {stats ? (stats.taxaAlocacao || 0).toFixed(1) : '0'}%
              </div>
            </div>

            <div className="kpi-metric-item">
              <span className="kpi-sublabel">SLA do Dia</span>
              <div className="kpi-big-value success">
                {stats ? (stats.slaDia || 0).toFixed(1) : '0'}%
              </div>
            </div>

            <div className="kpi-metric-item">
              <span className="kpi-sublabel">Atrasos Identificados</span>
              <div className="kpi-big-value danger">
                {stats ? stats.atrasos : '0'}
              </div>
            </div>
          </div>

          <div className="cost-breakdown-box">
            <div className="cost-item">
              <span className="cost-label">Custo Planejado Total</span>
              <span className="cost-value primary">
                R$ {stats ? (stats.custoTotalPlanejado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </span>
            </div>
            <div className="cost-divider"></div>
            <div className="cost-item text-right">
              <span className="cost-label">Custo Efetivo Realizado</span>
              <span className="cost-value danger">
                R$ {stats ? (stats.custoTotalEfetivo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
