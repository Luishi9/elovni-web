import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

interface Props {
  allowedRoles?: string[];
  children?: ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: Props) => {
  const { isAuthenticated, usuario } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && usuario?.rol && !allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
