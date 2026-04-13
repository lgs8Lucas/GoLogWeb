import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';

const ProtectedRoute = ({ allowedRoles }) => {
  // Verifica se o usuário tem um token válido no localStorage
  if (!authService.isAuthenticated()) {
    // Se não estiver logado, redireciona para a página de Login
    return <Navigate to="/login" replace />;
  }

  // Verifica se há regra de cargo e se o usuário atende à exigência
  if (allowedRoles) {
    const userRole = authService.getUserRole();
    if (!allowedRoles.includes(userRole)) {
      // Caso não tenha permissão, redireciona ao início do sistema
      return <Navigate to="/" replace />;
    }
  }

  // Se estiver logado e autorizado, permite renderizar as rotas filhas
  return <Outlet />;
};

export default ProtectedRoute;
