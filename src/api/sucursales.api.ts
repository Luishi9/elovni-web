import { apiClient } from './client';

export interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa: boolean;
  created_at?: string;
}

export interface SucursalDTO {
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa?: boolean;
  copiarProductos?: boolean;
}

export const sucursalesApi = {
  getAll: () => apiClient.get<{ data: Sucursal[] }>('/sucursales'),
  getById: (id: number) => apiClient.get<{ data: Sucursal }>(`/sucursales/${id}`),
  create: (data: SucursalDTO) => apiClient.post('/sucursales', data),
  update: (id: number, data: Partial<SucursalDTO>) => apiClient.put(`/sucursales/${id}`, data),
  remove: (id: number) => apiClient.delete(`/sucursales/${id}`),
};
