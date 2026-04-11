import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/auth.api';
import { useSucursalStore } from './sucursalStore';

interface Sucursal {
  id: number;
  nombre: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol?: string;
  sucursales: number[];
  sucursalesDetalle: Sucursal[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await authApi.login(email, password);
        const usuario = data.data.usuario;
        set({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          usuario,
          isAuthenticated: true,
        });
        // Auto-seleccionar la primera sucursal del usuario al iniciar sesión
        if (usuario.sucursalesDetalle?.length > 0) {
          useSucursalStore.getState().setSucursal(usuario.sucursalesDetalle[0]);
        }
      },

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('Sin refresh token');
        const { data } = await authApi.refresh(refreshToken);
        set({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        });
      },

      logout: async () => {
        // Llamar al backend para invalidar el token (incrementa token_version)
        try {
          await authApi.logout();
        } catch {
          // Si falla la petición, igual limpiamos el estado local
        }
        useSucursalStore.getState().clearSucursal();
        set({ accessToken: null, refreshToken: null, usuario: null, isAuthenticated: false });
      },
    }),
    {
      name: 'elovni-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
