import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Adjuntar token en cada peticion
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor responde 401, limpiar sesión local y redirigir
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Limpiar estado local sin llamar al backend (el token ya es inválido)
      const store = useAuthStore.getState();
      store.accessToken !== null &&
        useAuthStore.setState({ accessToken: null, refreshToken: null, usuario: null, isAuthenticated: false });
    }
    return Promise.reject(error);
  },
);
