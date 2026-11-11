import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import '../components/ui/ui.css';

const DashboardLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('golog_sidebar_collapsed') === 'true';
  });

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('golog_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="dashboard-layout fade-in">
      <Navbar 
        onToggleMobileMenu={toggleMobileMenu} 
        isMobileOpen={mobileMenuOpen}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="dashboard-body">
        <Sidebar 
          isOpen={mobileMenuOpen} 
          onClose={closeMobileMenu}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className={`dashboard-main ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
          {/* key por rota: reinicia a animação de entrada a cada navegação */}
          <div className="dashboard-content page-transition" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

