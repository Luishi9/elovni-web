import { apiClient } from './client';

export interface ProductoParams {
  page?: number;
  limit?: number;
  search?: string;
  categoriaId?: number;
}

export const productosApi = {
  getAll: (params: ProductoParams) => apiClient.get('/productos', { params }),
  getById: (id: number) => apiClient.get(`/productos/${id}`),
  create: (data: FormData) =>
    apiClient.post('/productos', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) =>
    apiClient.put(`/productos/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id: number) => apiClient.delete(`/productos/${id}`),
};
