import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  MapPin,
  Building2,
  Map,
  Tags,
  Layers,
  AlertTriangle,
  CalendarClock,
  Sliders,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { authService } from '../services/authService';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const userRole = authService.getUserRole();

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile drawer */}
      <div 
        className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} 
        onClick={onClose}
      />

      <aside className={`sidebar-container ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-mobile-header">
          <span className="sidebar-mobile-title">Menu GoLog</span>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-collapse-bar">
          <button 
            className="sidebar-collapse-btn" 
            onClick={onToggleCollapse} 
            title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-menu">
          <div className="sidebar-section-title">Navegação Principal</div>
          
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} 
            end
            onClick={handleLinkClick}
            title="Dashboard"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <div className="sidebar-section-title">Operação Logística</div>

          <NavLink 
            to="/frota" 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            onClick={handleLinkClick}
            title="Frota de Veículos"
          >
            <Truck size={20} />
            <span>Frota de Veículos</span>
          </NavLink>

          <NavLink 
            to="/transporte" 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            onClick={handleLinkClick}
            title="Transportes & Cargas"
          >
            <Package size={20} />
            <span>Transportes & Cargas</span>
          </NavLink>

          <NavLink 
            to="/monitoramento" 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            onClick={handleLinkClick}
            title="Telemetria & Mapa"
          >
            <MapPin size={20} />
            <span>Telemetria & Mapa</span>
          </NavLink>

          {(userRole === 'ADMIN' || userRole === 'OPERATOR') && (
            <>
              <div className="sidebar-section-title">Cadastros & Regras</div>

              {userRole === 'ADMIN' && (
                <NavLink 
                  to="/perfis" 
                  className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                  onClick={handleLinkClick}
                  title="Usuários & Perfis"
                >
                  <Users size={20} />
                  <span>Usuários & Perfis</span>
                </NavLink>
              )}

              <NavLink 
                to="/empresas" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
                title={userRole === 'OPERATOR' ? 'Clientes' : 'Empresas & Parceiros'}
              >
                <Building2 size={20} />
                <span>{userRole === 'OPERATOR' ? 'Clientes' : 'Empresas & Parceiros'}</span>
              </NavLink>

              <NavLink 
                to="/enderecos" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
                title="Endereços"
              >
                <Map size={20} />
                <span>Endereços</span>
              </NavLink>

              <NavLink 
                to="/tipos-transporte" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
                title="Tipos de Transporte"
              >
                <Tags size={20} />
                <span>Tipos de Transporte</span>
              </NavLink>

              <NavLink 
                to="/conjuntos" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
                title="Conjuntos de Equipamentos"
              >
                <Layers size={20} />
                <span>Conjuntos de Equipamentos</span>
              </NavLink>

              <NavLink 
                to="/tipos-carga" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
                title="Tipos de Carga"
              >
                <Package size={20} />
                <span>Tipos de Carga</span>
              </NavLink>

              <NavLink 
                to="/escalas" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
                title="Escala de Trabalho"
              >
                <CalendarClock size={20} />
                <span>Escala de Trabalho</span>
              </NavLink>

              <NavLink 
                to="/ocorrencias" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
                title="Ocorrências"
              >
                <AlertTriangle size={20} />
                <span>Ocorrências</span>
              </NavLink>

              <NavLink 
                to="/regras-otimizacao" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
                title="Regras & Custos de Rota"
              >
                <Sliders size={20} />
                <span>Regras & Custos de Rota</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
