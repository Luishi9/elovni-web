import { apiClient } from './client';

export const inventarioApi = {
  getBySucursal: (sucursalId: number, params?: object) =>
    apiClient.get(`/inventario/sucursal/${sucursalId}`, { params }),
  ajustar: (data: object) => apiClient.post('/inventario/ajuste', data),
  getKardex: (productoId: number, sucursalId: number) =>
    apiClient.get(`/inventario/kardex/${productoId}/${sucursalId}`),
};
