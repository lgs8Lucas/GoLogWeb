import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  Route,
  MapPin,
  Building2,
  Map,
  Layers,
  AlertTriangle,
  CalendarClock,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Network,
  X
} from 'lucide-react';
import { authService } from '../services/authService';
import '../styles/Sidebar.css';

/**
 * Menu organizado pelo fluxo de trabalho: planejar → executar → frota → cadastros → configuração.
 * `roles` restringe o item (sem `roles` = todos os perfis autenticados).
 */
const BACKOFFICE = ['ADMIN', 'OPERATOR'];
const MENU = [
  { title: 'Visão Geral', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }
  ] },
  { title: 'Planejamento', items: [
    { to: '/entregas', label: 'Remessas', icon: Package },
    { to: '/escalas', label: 'Escalas de Trabalho', icon: CalendarClock, roles: BACKOFFICE },
    { to: '/transporte', label: 'Roteirização & Viagens', icon: Route }
  ] },
  { title: 'Execução', items: [
    { to: '/monitoramento', label: 'Monitoramento', icon: MapPin },
    { to: '/ocorrencias', label: 'Ocorrências', icon: AlertTriangle, roles: BACKOFFICE }
  ] },
  { title: 'Frota', items: [
    { to: '/frota', label: 'Veículos', icon: Truck },
    { to: '/conjuntos', label: 'Conjuntos', icon: Layers, roles: BACKOFFICE }
  ] },
  { title: 'Cadastros', items: [
    { to: '/empresas', label: 'Clientes & Parceiros', icon: Building2, roles: BACKOFFICE },
    { to: '/enderecos', label: 'Endereços', icon: Map, roles: BACKOFFICE },
    { to: '/perfis', label: 'Usuários & Motoristas', icon: Users, roles: ['ADMIN'] }
  ] },
  { title: 'Configuração', items: [
    { to: '/regras-otimizacao', label: 'Regras & Custos', icon: Sliders, roles: BACKOFFICE }
  ] },
  { title: 'Administração Master', masterOnly: true, items: [
    { to: '/tenants', label: 'Tenants', icon: Network, roles: ['ADMIN'] }
  ] }
];

const canSee = (item, role) => !item.roles || item.roles.includes(role);

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

        <nav className="sidebar-menu" aria-label="Menu principal">
          {MENU.map((section) => {
            const items = section.items.filter((item) => canSee(item, userRole));
            if (items.length === 0 || (section.masterOnly && !authService.isMaster())) return null;
            return (
              <div className="sidebar-section" key={section.title}>
                <div className="sidebar-section-title">{section.title}</div>
                {items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
                    onClick={handleLinkClick}
                    title={label}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
