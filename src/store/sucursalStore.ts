import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Sucursal {
  id: number;
  nombre: string;
}

interface SucursalState {
  sucursalActiva: Sucursal | null;
  setSucursal: (sucursal: Sucursal) => void;
  clearSucursal: () => void;
}

export const useSucursalStore = create<SucursalState>()(
  persist(
    (set) => ({
      sucursalActiva: null,
      setSucursal: (sucursal) => set({ sucursalActiva: sucursal }),
      clearSucursal: () => set({ sucursalActiva: null }),
    }),
    { name: 'elovni-sucursal' },
  ),
);
