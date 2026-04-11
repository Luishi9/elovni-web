import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Boxes, UserCog, Building2, LogOut, PanelLeftClose, Tag,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/authStore';
import logoImage from '@/assets/logo.png';

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/productos',  label: 'Productos',   icon: Package },
  { to: '/inventario', label: 'Inventario',  icon: Boxes },
  { to: '/ventas',     label: 'Ventas',      icon: ShoppingCart },
  { to: '/clientes',   label: 'Clientes',    icon: Users },
];

const adminItems = [
  { to: '/usuarios',   label: 'Usuarios',    icon: UserCog },
  { to: '/categorias', label: 'Categorías',  icon: Tag },
  { to: '/sucursales', label: 'Sucursales',  icon: Building2 },
];

export function AppSidebar() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const { setOpenMobile, setOpen, isMobile } = useSidebar();
  const isAdmin = usuario?.rol === 'admin';

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
    else setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="offcanvas">
      {/* ─── Header: Logo ─── */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="ElOvni" className="w-8 h-8 object-contain shrink-0" />
          <span
            className="font-bold text-[#99ff3d] tracking-wide text-sm"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            El Ovni
          </span>
        </div>
        <button
          onClick={() => isMobile ? setOpenMobile(false) : setOpen(false)}
          className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors p-1"
          title="Ocultar menú"
        >
          <PanelLeftClose size={20} />
        </button>
      </SidebarHeader>

      {/* ─── Nav principal ─── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-sidebar-foreground/40 uppercase tracking-widest">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={to}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 w-full no-underline transition-colors duration-150 ${
                          isActive
                            ? 'text-[#99ff3d] font-semibold'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                        }`
                      }
                    >
                      <Icon size={17} />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-sidebar-foreground/40 uppercase tracking-widest">
              Administración
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map(({ to, label, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={to}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `flex items-center gap-3 w-full no-underline transition-colors duration-150 ${
                            isActive
                              ? 'text-[#99ff3d] font-semibold'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                          }`
                        }
                      >
                        <Icon size={17} />
                        <span>{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ─── Footer: Usuario + Logout ─── */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1.5 gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">{usuario?.nombre}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{usuario?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sidebar-foreground/50 hover:text-red-400 transition-colors p-1 rounded cursor-pointer border-0 bg-transparent shrink-0"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
