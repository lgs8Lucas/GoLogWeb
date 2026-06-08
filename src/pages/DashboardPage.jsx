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
  AlertTriangle
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
              routePlanned: s.transport.routePlanned
            };
          }
        });

        const decoded = Object.values(transportsMap).map(t => ({
          id: t.id,
          coords: decodePolyline(t.routePlanned)
        }));

        setPolylines(decoded);
      } catch (error) {
        console.error('Erro ao carregar rotas no dashboard:', error);
      }
    };
    fetchMapRoutes();
  }, []);

  return (
    <div className="dashboard-page fade-in" style={{ flexDirection: 'row', height: 'calc(100vh - 100px)' }}>
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
          <BarChart3 size={20} color={primaryColor} /> Indicadores Gerais
        </h3>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
              <span>Rotas</span>
            </div>
            <div className="stat-value">{stats ? stats.rotasEmAndamento : '-'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Package size={18} color="var(--warning-color)" />
              <span>Entregas</span>
            </div>
            <div className="stat-value">{stats ? stats.quantidadeEntregasEmTransporte : '-'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Package size={18} color="var(--danger-color)" />
              <span>Backlogs</span>
            </div>
            <div className="stat-value">{stats ? stats.backlogEntregasPendentes : '-'}</div>
          </div>
        </div>

        <div className="kpi-card" style={{ marginTop: '1rem' }}>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="kpi-item">
              <span className="kpi-label">Taxa de alocação</span>
              <div className="kpi-value warning-color">
                {stats ? stats.taxaAlocacao : '-'}% <ArrowDownIcon size={24} />
              </div>
            </div>

            <div className="kpi-item">
              <span className="kpi-label">Rotas concluídas</span>
              <div className="kpi-value neutral-color">
                {stats ? stats.rotasConcluidas : '-'}% <ArrowRightIcon size={24} />
              </div>
            </div>

            <div className="kpi-item">
              <span className="kpi-label">SLA do dia</span>
              <div className="kpi-value success-color">
                {stats ? stats.slaDia : '-'}% <ArrowUpIcon size={24} />
              </div>
            </div>

            <div className="kpi-item">
              <span className="kpi-label">Atrasos</span>
              <div className="kpi-value warning-color">
                {stats ? stats.atrasos : '-'} <ArrowDownIcon size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
