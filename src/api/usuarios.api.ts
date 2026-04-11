import { apiClient } from './client';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  created_at: string;
  roles: { nombre: string };
  usuarios_sucursales: { sucursales: { id: number; nombre: string } }[];
}

export interface CreateUsuarioDTO {
  nombre: string;
  email: string;
  password: string;
  rolId: number;
}

export interface UpdateUsuarioDTO {
  nombre?: string;
  email?: string;
  password?: string;
  rolId?: number;
}

export const usuariosApi = {
  getAll: () => apiClient.get<{ data: Usuario[] }>('/usuarios'),
  getById: (id: number) => apiClient.get<{ data: Usuario }>(`/usuarios/${id}`),
  create: (data: CreateUsuarioDTO) => apiClient.post('/usuarios', data),
  update: (id: number, data: UpdateUsuarioDTO) => apiClient.put(`/usuarios/${id}`, data),
  remove: (id: number) => apiClient.delete(`/usuarios/${id}`),
  asignarSucursal: (id: number, sucursalId: number) =>
    apiClient.post(`/usuarios/${id}/sucursales`, { sucursalId }),
  removerSucursal: (id: number, sucursalId: number) =>
    apiClient.delete(`/usuarios/${id}/sucursales/${sucursalId}`),
};

export const sucursalesApi = {
  getAll: () => apiClient.get<{ data: { id: number; nombre: string }[] }>('/sucursales'),
};
