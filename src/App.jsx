import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ProfilesPage from './pages/ProfilesPage';
import TransportPage from './pages/TransportPage';
import MonitoringPage from './pages/MonitoringPage';
import FleetPage from './pages/FleetPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="perfis" element={<ProfilesPage />} />
          <Route path="frota" element={<FleetPage />} />
          <Route path="transporte" element={<TransportPage />} />
          <Route path="monitoramento" element={<MonitoringPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
