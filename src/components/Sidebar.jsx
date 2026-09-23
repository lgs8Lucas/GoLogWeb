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
  X
} from 'lucide-react';
import { authService } from '../services/authService';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
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

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-mobile-header">
          <span className="sidebar-mobile-title">Menu GoLog</span>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-menu">
          <div className="sidebar-section-title">Navegação Principal</div>
          
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} 
            end
            onClick={handleLinkClick}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <div className="sidebar-section-title">Operação Logística</div>

          <NavLink 
            to="/frota" 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            onClick={handleLinkClick}
          >
            <Truck size={18} />
            <span>Frota de Veículos</span>
          </NavLink>

          <NavLink 
            to="/transporte" 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            onClick={handleLinkClick}
          >
            <Package size={18} />
            <span>Transportes & Cargas</span>
          </NavLink>

          <NavLink 
            to="/monitoramento" 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            onClick={handleLinkClick}
          >
            <MapPin size={18} />
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
                >
                  <Users size={18} />
                  <span>Usuários & Perfis</span>
                </NavLink>
              )}

              <NavLink 
                to="/empresas" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
              >
                <Building2 size={18} />
                <span>{userRole === 'OPERATOR' ? 'Clientes' : 'Empresas & Parceiros'}</span>
              </NavLink>

              <NavLink 
                to="/enderecos" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
              >
                <Map size={18} />
                <span>Endereços</span>
              </NavLink>

              <NavLink 
                to="/tipos-transporte" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
              >
                <Tags size={18} />
                <span>Tipos de Transporte</span>
              </NavLink>

              <NavLink 
                to="/conjuntos" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
              >
                <Layers size={18} />
                <span>Conjuntos de Equipamentos</span>
              </NavLink>

              <NavLink 
                to="/tipos-carga" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
              >
                <Package size={18} />
                <span>Tipos de Carga</span>
              </NavLink>

              <NavLink 
                to="/escalas" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
              >
                <CalendarClock size={18} />
                <span>Escala de Trabalho</span>
              </NavLink>

              <NavLink 
                to="/ocorrencias" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={handleLinkClick}
              >
                <AlertTriangle size={18} />
                <span>Tipos de Ocorrência</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
