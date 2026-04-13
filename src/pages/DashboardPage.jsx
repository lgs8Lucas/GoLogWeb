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
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../services/api';
import { authService } from '../services/authService';
import { Building2 } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const primaryColor = "var(--primary-color)";
  const userRole = authService.getUserRole();
  
  const [stats, setStats] = useState(null);

  useEffect(() => {
    mockApi.getDashboardStats().then(data => {
      setStats(data);
    });
  }, []);
  
  return (
    <div className="dashboard-page fade-in">
      {/* Left Column */}
      <div className="dashboard-left">
        
        {/* Main 4 Action Cards */}
        <div className="action-cards-grid">
          {/* Card 1 */}
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
              <p>Crie a melhor rota para as suas entregas.</p>
            </div>
            <button className="verify-btn">Verificar</button>
          </div>

          {/* Admin Restricted Card: Empresas */}
          {userRole === 'ADMIN' && (
            <div className="action-card fade-in">
              <div className="action-card-icon">
                <Building2 size={24} color={primaryColor} />
              </div>
              <div className="action-card-content">
                <h3>Empresas</h3>
                <p>Gerencie companhias e unidades logísticas.</p>
              </div>
              <button className="verify-btn" onClick={() => navigate('/empresas')}>Verificar</button>
            </div>
          )}
        </div>

        {/* Monitoring Card */}
        <div className="monitoring-card">
          <div className="monitoring-header">
            <MapPin size={24} color={primaryColor} className="monitoring-icon" />
            <h3>Monitoramento</h3>
          </div>
          
          <div className="monitoring-content">
            <div className="monitoring-map-placeholder">
              {/* This is a visual map placeholder from external unsplash for prototype */}
              <img 
                src="/@fs/home/fgsl/.gemini/antigravity/brain/d408a495-8f95-45cf-a16d-c77606a503b7/media__1774837734012.png" 
                alt="Map Background" 
                className="map-image-bg"
              />
              {/* Fake pins simulating active trucks */}
              <div className="map-pin" style={{ top: '30%', left: '40%' }}>
                <Truck size={14} color="white" />
              </div>
              <div className="map-pin" style={{ top: '60%', left: '20%' }}>
                 <Truck size={14} color="white" />
              </div>
              <div className="map-pin active-pin" style={{ top: '50%', left: '70%' }}>
                 <Truck size={14} color="white" />
              </div>
            </div>
            
            <div className="monitoring-info">
              <p>Acompanhe suas entregas em tempo real</p>
              <button className="text-btn" onClick={() => navigate('/monitoramento')}>Ver mais</button>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column - Stats */}
      <div className="dashboard-right">
        <div className="stats-section">
          <h3 className="section-title">
            <BarChart3 size={20} color={primaryColor} /> Estatísticas
          </h3>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <Truck size={18} color="#1f304c" />
                <span>Motoristas</span>
              </div>
              <div className="stat-value">{stats ? stats.motoristas : '-'}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <MapPin size={18} color="#d4a82c" />
                <span>Rotas</span>
              </div>
              <div className="stat-value">{stats ? stats.rotas : '-'}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Package size={18} color="#d4a82c" />
                <span>Entregas</span>
              </div>
              <div className="stat-value">{stats ? stats.entregas : '-'}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Package size={18} color="#9e2025" />
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
