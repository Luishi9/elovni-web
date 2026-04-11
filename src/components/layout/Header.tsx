import { useAuthStore } from '@/store/authStore';
import { useSucursalStore } from '@/store/sucursalStore';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


export const Header = () => {
  const { usuario } = useAuthStore();
  const { sucursalActiva } = useSucursalStore();

  return (
    <div className="flex-1 flex justify-between items-center bg-transparent">
      <div className="flex items-center gap-3">
        {/* Toggle sidebar — hamburguesa en móvil, panel-left en desktop */}
        {/* <SidebarTrigger className="text-muted-foreground hover:text-foreground" /> */}

        {sucursalActiva ? (
          <Badge variant="lime" className="gap-1.5">
            <Building2 size={11} />
            {sucursalActiva.nombre}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Sin sucursal activa</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground hidden sm:inline"> Usuario: {usuario?.nombre}</span> {/* Oculta el nombre en desktop, solo muestra el nombre en móvil */}
        <span className="text-xs text-muted-foreground sm:hidden"> Usuario: {usuario?.nombre}</span> {/* Solo muestra el nombre en móvil */}
      </div>
    </div>
  );
};
