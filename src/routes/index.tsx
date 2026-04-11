import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import Layout from '@/components/layout/Layout';

const LoginPage      = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage  = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ProductosPage  = lazy(() => import('@/pages/productos/ProductosPage'));
const VentasPage     = lazy(() => import('@/pages/ventas/VentasPage'));
const NuevaVentaPage = lazy(() => import('@/pages/ventas/NuevaVentaPage'));
const ClientesPage   = lazy(() => import('@/pages/clientes/ClientesPage'));
const InventarioPage = lazy(() => import('@/pages/inventario/InventarioPage'));
const UsuariosPage   = lazy(() => import('@/pages/usuarios/UsuariosPage'));
const CategoriasPage   = lazy(() => import('@/pages/categorias/CategoriasPage'));
const SucursalesPage   = lazy(() => import('@/pages/sucursales/SucursalesPage'));
const TicketPublicoPage = lazy(() => import('@/pages/ventas/TicketPublicoPage'));

const Loader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
  </div>
);

export const AppRoutes = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ticket" element={<TicketPublicoPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/productos"  element={<ProductosPage />} />
          <Route path="/ventas"     element={<VentasPage />} />
          <Route path="/ventas/nueva" element={<NuevaVentaPage />} />
          <Route path="/clientes"   element={<ClientesPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categorias"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CategoriasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sucursales"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SucursalesPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);
