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
import { decodePolyline } from '../utils/polyline';

const DashboardPage = () => {
  const navigate = useNavigate();
  const primaryColor = "var(--primary-color)";
  const userRole = authService.getUserRole();

  const [stats, setStats] = useState(null);
  const [polylines, setPolylines] = useState([]);

  useEffect(() => {
    // TODO: Aguardando endpoint de estatísticas da API (ex: GET /dashboard/stats)
    // Definindo valores em branco/zero por enquanto para não quebrar a tela sem os mocks.
    setStats({
      motoristas: 0,
      rotas: 0,
      entregas: 0,
      backlogs: 0,
      kpis: {
        alocacao: { value: 0 },
        concluidas: { value: 0 },
        sla: { value: 0 },
        atrasos: { value: 0 }
      }
    });

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
    <div className="dashboard-page fade-in">
      {/* Left Column */}
      <div className="dashboard-left">

        {/* Main 4 Action Cards */}
        <div className="action-cards-grid">
          {/* Card 1: Usuários (Admin only) */}
          {userRole === 'ADMIN' && (
            <div className="action-card">
              <div className="action-card-icon">
                <User size={24} color={primaryColor} />
              </div>
              <div className="action-card-content">
                <h3>Usuários</h3>
                <p>Cadastre ou edite os usuários do sistema.</p>
              </div>
              <button className="verify-btn" onClick={() => navigate('/perfis')}>Verificar</button>
            </div>
          )}

          {/* Card 2 */}
          <div className="action-card">
            <div className="action-card-icon">
              <Truck size={24} color={primaryColor} />
            </div>
            <div className="action-card-content">
              <h3>Frota</h3>
              <p>Cadastre, edite e gerencie a sua frota.</p>
            </div>
            <button className="verify-btn" onClick={() => navigate('/frota')}>Verificar</button>
          </div>

          {/* Card 3 */}
          <div className="action-card">
            <div className="action-card-icon">
              <Package size={24} color={primaryColor} />
            </div>
            <div className="action-card-content">
              <h3>Transporte</h3>
              <p>Gerencie seus transportes.</p>
            </div>
            <button className="verify-btn" onClick={() => navigate('/transporte')}>Verificar</button>
          </div>

          {/* Card 4 */}
          <div className="action-card">
            <div className="action-card-icon">
              <TrendingUp size={24} color={primaryColor} />
            </div>
            <div className="action-card-content">
              <h3>Planejamento logístico</h3>
              <p>Consulte e acompanhe as entregas e coletas.</p>
            </div>
            <button className="verify-btn" onClick={() => navigate('/entregas')}>Verificar</button>
          </div>

          {/* Restricted Cards: ADMIN and OPERATOR */}
          {(userRole === 'ADMIN' || userRole === 'OPERATOR') && (
            <>
              {/* Empresas / Clientes */}
              <div className="action-card fade-in">
                <div className="action-card-icon">
                  <Building2 size={24} color={primaryColor} />
                </div>
                <div className="action-card-content">
                  <h3>{userRole === 'OPERATOR' ? 'Clientes' : 'Empresas'}</h3>
                  <p>
                    {userRole === 'OPERATOR'
                      ? 'Gerencie clientes logísticos.'
                      : 'Gerencie companhias e unidades logísticas.'}
                  </p>
                </div>
                <button className="verify-btn" onClick={() => navigate('/empresas')}>Verificar</button>
              </div>

              {/* Tipos de Transporte */}
              <div className="action-card fade-in">
                <div className="action-card-icon">
                  <Tags size={24} color={primaryColor} />
                </div>
                <div className="action-card-content">
                  <h3>Tipos de Transporte</h3>
                  <p>Configure as categorias e cuidados de carga.</p>
                </div>
                <button className="verify-btn" onClick={() => navigate('/tipos-transporte')}>Verificar</button>
              </div>

              {/* Conjuntos */}
              <div className="action-card fade-in">
                <div className="action-card-icon">
                  <Layers size={24} color={primaryColor} />
                </div>
                <div className="action-card-content">
                  <h3>Conjuntos</h3>
                  <p>Agrupe caminhões e carretas para viagens.</p>
                </div>
                <button className="verify-btn" onClick={() => navigate('/conjuntos')}>Verificar</button>
              </div>

              {/* Tipos de Carga */}
              <div className="action-card fade-in">
                <div className="action-card-icon">
                  <Package size={24} color={primaryColor} />
                </div>
                <div className="action-card-content">
                  <h3>Tipos de Carga</h3>
                  <p>Gerencie as regras de SLA e cuidados de cargas.</p>
                </div>
                <button className="verify-btn" onClick={() => navigate('/tipos-carga')}>Verificar</button>
              </div>

              {/* Ocorrências */}
              <div className="action-card fade-in">
                <div className="action-card-icon">
                  <AlertTriangle size={24} color={primaryColor} />
                </div>
                <div className="action-card-content">
                  <h3>Ocorrências</h3>
                  <p>Acompanhe e registre incidentes de viagens.</p>
                </div>
                <button className="verify-btn" onClick={() => navigate('/ocorrencias')}>Verificar</button>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Right Column - Monitoring & Stats */}
      <div className="dashboard-right">
        {/* Monitoring Card (Moved to Sidebar) */}
        <div className="monitoring-card" style={{ marginBottom: '1.5rem' }}>
          <div className="monitoring-header">
            <MapPin size={24} color={primaryColor} className="monitoring-icon" />
            <h3>Monitoramento</h3>
          </div>

          <div className="monitoring-content">
            <div className="monitoring-map-placeholder" style={{ position: 'relative', overflow: 'hidden' }}>
              <MapComponent 
                 interactive={false}
                 zoom={10}
                 polylines={polylines}
              />
            </div>

            <div className="monitoring-info">
              <p>Acompanhe suas entregas em tempo real</p>
              <button className="text-btn" onClick={() => navigate('/monitoramento')}>Ver mais</button>
            </div>
          </div>
        </div>
        <div className="stats-section">
          <h3 className="section-title">
            <BarChart3 size={20} color={primaryColor} /> Estatísticas
          </h3>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <Truck size={18} color="var(--primary-color)" />
                <span>Motoristas</span>
              </div>
              <div className="stat-value">{stats ? stats.motoristas : '-'}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <MapPin size={18} color="var(--warning-color)" />
                <span>Rotas</span>
              </div>
              <div className="stat-value">{stats ? stats.rotas : '-'}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Package size={18} color="var(--warning-color)" />
                <span>Entregas</span>
              </div>
              <div className="stat-value">{stats ? stats.entregas : '-'}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Package size={18} color="var(--danger-color)" />
                <span>Backlogs</span>
              </div>
              <div className="stat-value">{stats ? stats.backlogs : '-'}</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-grid">

              <div className="kpi-item">
                <span className="kpi-label">Taxa de alocação</span>
                <div className="kpi-value warning-color">
                  {stats ? stats.kpis.alocacao.value : '-'}% <ArrowDownIcon size={24} />
                </div>
              </div>

              <div className="kpi-item">
                <span className="kpi-label">Rotas concluídas</span>
                <div className="kpi-value neutral-color">
                  {stats ? stats.kpis.concluidas.value : '-'}% <ArrowRightIcon size={24} />
                </div>
              </div>

              <div className="kpi-item">
                <span className="kpi-label">SLA do dia</span>
                <div className="kpi-value success-color">
                  {stats ? stats.kpis.sla.value : '-'}% <ArrowUpIcon size={24} />
                </div>
              </div>

              <div className="kpi-item">
                <span className="kpi-label">Atrasos</span>
                <div className="kpi-value warning-color">
                  {stats ? stats.kpis.atrasos.value : '-'}% <ArrowDownIcon size={24} />
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
