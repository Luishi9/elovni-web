import { apiClient } from './client';

export interface Categoria {
  id: number;
  nombre: string;
  activo: boolean;
  created_at: string;
  _count?: { productos: number };
}

export const categoriasApi = {
  getAll: () => apiClient.get<{ success: boolean; data: Categoria[] }>('/categorias'),
  create: (data: { nombre: string }) => apiClient.post('/categorias', data),
  update: (id: number, data: { nombre: string }) => apiClient.put(`/categorias/${id}`, data),
  remove: (id: number) => apiClient.delete(`/categorias/${id}`),
};
