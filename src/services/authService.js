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
      return response.data.token || response.data.accessToken || Object.values(response.data)[0];
    }

    return typeof response.data === 'string' ? response.data.replace(/"/g, '') : response.data;
  },

  logout: () => {
    localStorage.removeItem('golog_token');
  },

  getUserRole: () => {
    let token = localStorage.getItem('golog_token');
    if (!token) return null;

    token = token.replace(/"/g, '').replace(/^Bearer\s+/i, '').trim();

    try {
      const payload = jwtDecode(token);
      const userLevel = payload.userProfile;

      if (!userLevel) {
        console.error("Token válido, mas sem o perfil do usuário. Expulsando.");
        localStorage.removeItem('golog_token');
        return null;
      }

      return userLevel;
    } catch (e) {
      console.error("Token corrompido ou mal formatado. Limpando sessão.", e);
      localStorage.removeItem('golog_token');
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('golog_token');
  }
};
