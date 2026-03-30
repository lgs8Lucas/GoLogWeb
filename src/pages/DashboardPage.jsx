import React from 'react';
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

const DashboardPage = () => {
  const primaryColor = "var(--primary-color)";
  
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
            <button className="verify-btn">Verificar</button>
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
            <button className="verify-btn">Verificar</button>
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
            <button className="verify-btn">Verificar</button>
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
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
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
              <button className="text-btn">Ver mais</button>
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
              <div className="stat-value">10</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <MapPin size={18} color="#d4a82c" />
                <span>Rotas</span>
              </div>
              <div className="stat-value">47</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Package size={18} color="#d4a82c" />
                <span>Entregas</span>
              </div>
              <div className="stat-value">68</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Package size={18} color="#9e2025" />
                <span>Backlogs</span>
              </div>
              <div className="stat-value">3</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-grid">
              
              <div className="kpi-item">
                <span className="kpi-label">Taxa de alocação</span>
                <div className="kpi-value warning-color">
                  59% <ArrowDownIcon size={24} />
                </div>
              </div>

              <div className="kpi-item">
                <span className="kpi-label">Rotas concluídas</span>
                <div className="kpi-value neutral-color">
                  74% <ArrowRightIcon size={24} />
                </div>
              </div>

              <div className="kpi-item">
                <span className="kpi-label">SLA do dia</span>
                <div className="kpi-value success-color">
                  96% <ArrowUpIcon size={24} />
                </div>
              </div>

              <div className="kpi-item">
                <span className="kpi-label">Atrasos</span>
                <div className="kpi-value warning-color">
                  4% <ArrowDownIcon size={24} />
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
