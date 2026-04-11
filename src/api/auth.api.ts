import { apiClient } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  me: () => apiClient.get('/auth/me'),

  logout: () => apiClient.post('/auth/logout'),
};
