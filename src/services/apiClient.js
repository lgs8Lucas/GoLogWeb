import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_ADDRESS_IP) {
    return import.meta.env.VITE_ADDRESS_IP;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Se estiver rodando localmente (localhost, 127.0.0.1 ou rede privada)
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.')
    ) {
      return `http://${host}:8081`;
    }
  }
  return 'http://147.15.18.21:8081';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('golog_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
