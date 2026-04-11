import { apiClient } from './client';

export const ventasApi = {
  getAll: (params?: object) => apiClient.get('/ventas', { params }),
  getById: (id: number) => apiClient.get(`/ventas/${id}`),
  create: (data: object) => apiClient.post('/ventas', data),
  cancel: (id: number) => apiClient.patch(`/ventas/${id}/cancelar`),
};
