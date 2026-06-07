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
import TypeTransportPage from './pages/TypeTransportPage';
import EquipamentGroupPage from './pages/EquipamentGroupPage';
import ShipmentPage from './pages/ShipmentPage';
import ShipmentTypePage from './pages/ShipmentTypePage';
import OccurrencePage from './pages/OccurrencePage';
import { ToastProvider } from './components/ToastContext';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="perfis" element={<ProfilesPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']} />}>
              <Route path="empresas" element={<CompanyPage />} />
              <Route path="tipos-transporte" element={<TypeTransportPage />} />
              <Route path="conjuntos" element={<EquipamentGroupPage />} />
              <Route path="tipos-carga" element={<ShipmentTypePage />} />
              <Route path="ocorrencias" element={<OccurrencePage />} />
            </Route>

            <Route path="frota" element={<FleetPage />} />
            <Route path="transporte" element={<TransportPage />} />
            <Route path="monitoramento" element={<MonitoringPage />} />
            <Route path="entregas" element={<ShipmentPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
