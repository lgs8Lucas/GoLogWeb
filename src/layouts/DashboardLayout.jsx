import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';

const DashboardLayout = () => {
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
          <div className="dashboard-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

