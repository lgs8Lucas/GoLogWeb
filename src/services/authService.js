import { apiClient } from './apiClient';
import { jwtDecode } from 'jwt-decode';

export const authService = {
  login: async (email, password) => {
    const requestBody = { email, password };
    const response = await apiClient.post('/login', requestBody);

    if (response.data && typeof response.data === 'object') {
      if (response.data.message || response.data.error) {
        throw new Error(response.data.message || response.data.error || "Credenciais Inválidas");
      }
      
      const token = response.data.token || response.data.accessToken || Object.values(response.data)[0];
      if (token) {
        localStorage.setItem('golog_token', token);
      }
      localStorage.setItem('golog_user_data', JSON.stringify(response.data));
      return token;
    }

    const token = typeof response.data === 'string' ? response.data.replace(/"/g, '') : response.data;
    if (token) {
      localStorage.setItem('golog_token', token);
    }
    return token;
  },

  logout: () => {
    localStorage.removeItem('golog_token');
    localStorage.removeItem('golog_user_data');
    localStorage.removeItem('golog_selected_tenant');
  },

  getUserRole: () => {
    let token = localStorage.getItem('golog_token');
    if (!token) return null;

    token = token.replace(/"/g, '').replace(/^Bearer\s+/i, '').trim();

    try {
      const payload = jwtDecode(token);
      const userLevel = payload.role || payload.userProfile;

      if (!userLevel) {
        console.error("Token válido, mas sem o perfil do usuário (role). Expulsando.");
        authService.logout();
        return null;
      }

      return userLevel;
    } catch (e) {
      console.error("Token corrompido ou mal formatado. Limpando sessão.", e);
      authService.logout();
      return null;
    }
  },

  isAuthenticated: () => {
    let token = localStorage.getItem('golog_token');
    if (!token) return false;

    token = token.replace(/"/g, '').replace(/^Bearer\s+/i, '').trim();

    try {
      const payload = jwtDecode(token);
      if (!payload.exp || Date.now() >= payload.exp * 1000) {
        authService.logout();
        return false;
      }
      return true;
    } catch {
      authService.logout();
      return false;
    }
  },

  getDecodedToken: () => {
    let token = localStorage.getItem('golog_token');
    if (!token) return null;
    token = token.replace(/"/g, '').replace(/^Bearer\s+/i, '').trim();
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  },

  getCurrentUserEmail: () => {
    const payload = authService.getDecodedToken();
    return payload ? (payload.sub || payload.email || null) : null;
  },

  isMaster: () => {
    try {
      const dataStr = localStorage.getItem('golog_user_data');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (typeof data.isMaster === 'boolean') return data.isMaster;
      }
    } catch {}

    const payload = authService.getDecodedToken();
    return Boolean(payload?.isMaster);
  },

  getTenantInfo: () => {
    try {
      const dataStr = localStorage.getItem('golog_user_data');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        return {
          companyId: data.companyId,
          companyName: data.companyName,
          companyType: data.companyType,
          isMaster: Boolean(data.isMaster),
          userName: data.userName,
          userRole: data.userRole
        };
      }
    } catch {}

    const payload = authService.getDecodedToken();
    if (payload) {
      return {
        companyId: payload.companyId,
        companyName: payload.companyName,
        companyType: payload.companyType,
        isMaster: Boolean(payload.isMaster),
        userName: payload.user,
        userRole: payload.role
      };
    }
    return {};
  },

  getSelectedTenant: () => {
    return localStorage.getItem('golog_selected_tenant') || 'all';
  },

  setSelectedTenant: (tenantId) => {
    if (!tenantId || tenantId === 'all') {
      localStorage.removeItem('golog_selected_tenant');
    } else {
      localStorage.setItem('golog_selected_tenant', tenantId);
    }
    window.dispatchEvent(new CustomEvent('tenantChanged', { detail: tenantId || 'all' }));
  }
};
