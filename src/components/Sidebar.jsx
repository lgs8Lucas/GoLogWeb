import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  User,
  Truck,
  Package,
  MapPin,
  Building2,
  Tags,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { authService } from '../services/authService';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const userRole = authService.getUserRole();

  return (
    <aside className="sidebar-container">
      <div className="sidebar-menu">
        <NavLink to="/" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} end>
          <BarChart3 size={20} color="var(--primary-color)" />
          <span>Dashboard</span>
        </NavLink>

        <h3 className="sidebar-title">Operacional</h3>

        <NavLink to="/frota" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <Truck size={20} color="var(--primary-color)" />
          <span>Frota</span>
        </NavLink>

        <NavLink to="/transporte" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <Package size={20} color="var(--primary-color)" />
          <span>Transportes</span>
        </NavLink>

        <NavLink to="/monitoramento" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MapPin size={20} color="var(--primary-color)" />
          <span>Monitoramento</span>
        </NavLink>

        {(userRole === 'ADMIN' || userRole === 'OPERATOR') && (
          <>
            <h3 className="sidebar-title">Administração</h3>

            {userRole === 'ADMIN' && (
              <NavLink to="/perfis" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <User size={20} color="var(--primary-color)" />
                <span>Usuários</span>
              </NavLink>
            )}

            <NavLink to="/empresas" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <Building2 size={20} color="var(--primary-color)" />
              <span>{userRole === 'OPERATOR' ? 'Clientes' : 'Empresas'}</span>
            </NavLink>

            <NavLink to="/tipos-transporte" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <Tags size={20} color="var(--primary-color)" />
              <span>Tipos Transporte</span>
            </NavLink>

            <NavLink to="/conjuntos" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <Layers size={20} color="var(--primary-color)" />
              <span>Conjuntos</span>
            </NavLink>

            <NavLink to="/tipos-carga" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <Package size={20} color="var(--primary-color)" />
              <span>Tipos Carga</span>
            </NavLink>

            <NavLink to="/ocorrencias" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <AlertTriangle size={20} color="var(--primary-color)" />
              <span>Ocorrências</span>
            </NavLink>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
