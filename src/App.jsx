import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './components/Auth';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ProfilesPage from './pages/ProfilesPage';
import TransportPage from './pages/TransportPage';
import MonitoringPage from './pages/MonitoringPage';
import FleetPage from './pages/FleetPage';
import CompanyPage from './pages/CompanyPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="perfis" element={<ProfilesPage />} />
              <Route path="empresas" element={<CompanyPage />} />
            </Route>

            <Route path="frota" element={<FleetPage />} />
            <Route path="transporte" element={<TransportPage />} />
            <Route path="monitoramento" element={<MonitoringPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
