import { apiClient } from './client';

export const clientesApi = {
  getAll: (params?: object) => apiClient.get('/clientes', { params }),
  getById: (id: number) => apiClient.get(`/clientes/${id}`),
  getHistorial: (id: number) => apiClient.get(`/clientes/${id}/historial`),
  create: (data: object) => apiClient.post('/clientes', data),
  update: (id: number, data: object) => apiClient.put(`/clientes/${id}`, data),
  remove: (id: number) => apiClient.delete(`/clientes/${id}`),
};
