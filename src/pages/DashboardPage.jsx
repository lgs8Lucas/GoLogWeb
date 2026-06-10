import React, { useState, useEffect } from 'react';
import {
  User,
  Truck,
  Package,
  TrendingUp,
  MapPin,
  Clock,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  BarChart3,
  Building2,
  Layers,
  Tags,
  AlertTriangle,
  Leaf
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import MapComponent from '../components/MapComponent';
import { deliveryService } from '../services/deliveryService';
import { dashboardService } from '../services/dashboardService';
import { decodePolyline } from '../utils/polyline';

const DashboardPage = () => {
  const navigate = useNavigate();
  const primaryColor = "var(--primary-color)";
  const userRole = authService.getUserRole();

  const [stats, setStats] = useState(null);
  const [polylines, setPolylines] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const metrics = await dashboardService.getAll();
        setStats(metrics);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Fallback in case of error
        setStats({
          quantidadeMotoristas: 0,
          rotasEmAndamento: 0,
          quantidadeEntregasEmTransporte: 0,
          backlogEntregasPendentes: 0,
          taxaAlocacao: 0,
          rotasConcluidas: 0,
          slaDia: 0,
          atrasos: 0
        });
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

  return (
    <div className="dashboard-page fade-in" style={{ flexDirection: 'row', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
      {/* Map Section (Left Column) */}
      <div className="monitoring-card" style={{ flex: '2', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="monitoring-header">
          <MapPin size={24} color={primaryColor} className="monitoring-icon" />
          <h3>Monitoramento Global</h3>
        </div>

        <div className="monitoring-content" style={{ flexDirection: 'column', flex: '1' }}>
          <div className="monitoring-map-placeholder" style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
            <MapComponent 
                interactive={true}
                zoom={10}
                polylines={polylines}
            />
          </div>
        </div>
      </div>

      {/* Stats Section (Right Column) */}
      <div className="stats-section" style={{ flex: '1', display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingLeft: '1rem' }}>
        <h3 className="section-title">
          <BarChart3 size={20} color={primaryColor} /> Indicadores Globais
        </h3>

        {/* Sustainability Highlight KPI */}
        <div className="kpis-container" style={{ marginBottom: '1.5rem', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', padding: '1.5rem', borderRadius: '12px', border: '2px solid #a7f3d0', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
          <div className="kpi-item" style={{ flex: '1 1 100%' }}>
            <span className="kpi-label" style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Leaf size={24} color="#10b981" /> Emissão de CO₂ (Pegada de Carbono da Frota)
            </span>
            <div className="kpi-value" style={{ color: '#059669', fontSize: '2rem', justifyContent: 'flex-start', alignItems: 'baseline' }}>
              <span title="Emissão Efetiva Realizada">{stats ? (stats.emissaoCo2Efetiva || 0).toFixed(2) : '-'} Kg</span>
              <span style={{ fontSize: '1.2rem', color: '#10b981', marginLeft: '12px' }} title="Meta / Planejado">
                / {stats ? (stats.emissaoCo2Planejada || 0).toFixed(2) : '-'} Kg
              </span>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#065f46' }}>Nosso diferencial verde para uma logística sustentável.</p>
          </div>
        </div>

        {/* First Grid: Raw Counts */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-header">
              <Truck size={18} color="var(--primary-color)" />
              <span>Motoristas</span>
            </div>
            <div className="stat-value">{stats ? stats.quantidadeMotoristas : '-'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <MapPin size={18} color="var(--warning-color)" />
              <span>Rotas Ativas</span>
            </div>
            <div className="stat-value">{stats ? stats.rotasEmAndamento : '-'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Package size={18} color="var(--warning-color)" />
              <span>Entregas Ativas</span>
            </div>
            <div className="stat-value">{stats ? stats.quantidadeEntregasEmTransporte : '-'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Package size={18} color="var(--danger-color)" />
              <span>Backlog</span>
            </div>
            <div className="stat-value">{stats ? stats.backlogEntregasPendentes : '-'}</div>
          </div>
        </div>

        {/* Second Grid: KPIs */}
        <div className="kpi-card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div className="kpi-item">
              <span className="kpi-label">Alocação</span>
              <div className="kpi-value warning-color">
                {stats ? (stats.taxaAlocacao || 0).toFixed(1) : '-'}% <ArrowDownIcon size={20} />
              </div>
            </div>

            <div className="kpi-item">
              <span className="kpi-label">SLA do dia</span>
              <div className="kpi-value success-color">
                {stats ? (stats.slaDia || 0).toFixed(1) : '-'}% <ArrowUpIcon size={20} />
              </div>
            </div>

            <div className="kpi-item">
              <span className="kpi-label">Atrasos</span>
              <div className="kpi-value warning-color">
                {stats ? stats.atrasos : '-'} <AlertTriangle size={20} />
              </div>
            </div>
            
            <div className="kpi-item" style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span className="kpi-label">Custo Planejado (R$)</span>
                <div className="kpi-value primary-color" style={{ fontSize: '1.2rem' }}>
                  {stats ? (stats.custoTotalPlanejado || 0).toFixed(2) : '-'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="kpi-label">Custo Efetivo (R$)</span>
                <div className="kpi-value danger-color" style={{ fontSize: '1.2rem', justifyContent: 'flex-end' }}>
                  {stats ? (stats.custoTotalEfetivo || 0).toFixed(2) : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
