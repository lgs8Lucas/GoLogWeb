import React from 'react';
import { Outlet } from 'react-router-dom';
import '../styles/Dashboard.css';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout fade-in">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
