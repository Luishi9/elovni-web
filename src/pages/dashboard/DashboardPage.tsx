import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, ShoppingCart, DollarSign, AlertTriangle,
  Package, Users, ArrowUpRight, Zap, BarChart3,
  RefreshCw, Building2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { useSucursalStore } from '@/store/sucursalStore';
import { ventasApi } from '@/api/ventas.api';
import { inventarioApi } from '@/api/inventario.api';
import { productosApi } from '@/api/productos.api';
import { useNavigate } from 'react-router-dom';

interface KPI {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

interface VentaReciente {
  id: number;
  total: number;
  items: number;
  estado: string;
  fecha: string;
}

interface StockAlerta {
  id: number;
  nombre: string;
  stock: number;
  stock_minimo: number;
}

interface DashboardData {
  ventasHoy: number;
  totalHoy: number;
  ticketPromedio: number;
  productosCount: number;
  ventasRecientes: VentaReciente[];
  stockAlertas: StockAlerta[];
  grafica: { hora: string; ventas: number; monto: number }[];
}

function useDashboard() {
  const { sucursalActiva } = useSucursalStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

      const [ventasRes, productosRes] = await Promise.allSettled([
        ventasApi.getAll({ fecha_inicio: inicio, fecha_fin: fin, limit: 20 }),
        productosApi.getAll({ limit: 1 }),
      ]);

      let ventasList: VentaReciente[] = [];
      let totalHoy = 0;
      if (ventasRes.status === 'fulfilled') {
        const vd = ventasRes.value.data?.data;
        const items = Array.isArray(vd) ? vd : (vd?.ventas ?? []);
        ventasList = items.map((v: any) => ({
          id: v.id,
          total: parseFloat(v.total ?? v.monto_total ?? 0),
          items: v.items_count ?? v.venta_detalle?.length ?? 1,
          estado: v.estado ?? 'completada',
          fecha: v.fecha_venta ?? v.createdAt ?? new Date().toISOString(),
        }));
        totalHoy = ventasList
          .filter((v) => v.estado !== 'cancelada')
          .reduce((s, v) => s + v.total, 0);
      }

      const completadas = ventasList.filter((v) => v.estado !== 'cancelada');
      const ticketPromedio = completadas.length > 0 ? totalHoy / completadas.length : 0;

      let productosCount = 0;
      if (productosRes.status === 'fulfilled') {
        const pd = productosRes.value.data?.data;
        productosCount = pd?.total ?? pd?.length ?? 0;
      }

      let stockAlertas: StockAlerta[] = [];
      if (sucursalActiva) {
        try {
          const invRes = await inventarioApi.getBySucursal(sucursalActiva.id, { stock_critico: true });
          const inv = invRes.data?.data;
          const invList = Array.isArray(inv) ? inv : [];
          stockAlertas = invList.slice(0, 6).map((i: any) => ({
            id: i.id ?? i.producto_id,
            nombre: i.producto?.nombre ?? i.nombre ?? 'Producto',
            stock: i.stock,
            stock_minimo: i.stock_minimo ?? 5,
          }));
        } catch { /* sin stock crítico */ }
      }

      const conteo: Record<string, { ventas: number; monto: number }> = {};
      for (let h = 8; h <= 20; h++) conteo[`${h}:00`] = { ventas: 0, monto: 0 };
      ventasList.forEach((v) => {
        const h = new Date(v.fecha).getHours();
        const key = `${h}:00`;
        if (conteo[key]) { conteo[key].ventas += 1; conteo[key].monto += v.total; }
      });

      setData({
        ventasHoy: completadas.length,
        totalHoy,
        ticketPromedio,
        productosCount,
        ventasRecientes: ventasList.slice(0, 8),
        stockAlertas,
        grafica: Object.entries(conteo).map(([hora, d]) => ({ hora, ...d })),
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, [sucursalActiva]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refresh: fetchData };
}

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const fmtTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '--:--'; }
};

function KpiCard({ kpi }: { kpi: KPI }) {
  return (
    <Card className="relative overflow-hidden group hover:border-[#99ff3d]/30 transition-colors duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-[#99ff3d]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{kpi.label}</span>
          <div className="p-2 rounded-lg bg-[#99ff3d]/10 text-[#99ff3d]">{kpi.icon}</div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Orbitron, sans-serif' }}>{kpi.value}</span>
          {kpi.trend === 'up' && (
            <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold mb-1">
              <ArrowUpRight size={13} /> Live
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, 'success' | 'danger' | 'warning'> = {
    completada: 'success', cancelada: 'danger', pendiente: 'warning',
  };
  return <Badge variant={map[estado] ?? 'outline'}>{estado}</Badge>;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs space-y-1 shadow-xl">
      <p className="text-[#99ff3d] font-semibold">{label}</p>
      <p className="text-foreground">Ventas: <span className="font-bold">{payload[0]?.value ?? 0}</span></p>
      <p className="text-muted-foreground">Monto: <span className="font-bold text-foreground">{fmt(payload[1]?.value ?? 0)}</span></p>
    </div>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuthStore();
  const { sucursalActiva } = useSucursalStore();
  const { data, loading, error, refresh } = useDashboard();
  const navigate = useNavigate();
  const [chartTab, setChartTab] = useState('area');

  const kpis: KPI[] = data ? [
    { label: 'Ventas Hoy', value: String(data.ventasHoy), sub: 'Transacciones completadas', icon: <ShoppingCart size={16} />, trend: 'up' },
    { label: 'Ingresos Hoy', value: fmt(data.totalHoy), sub: 'Total facturado', icon: <DollarSign size={16} />, trend: data.totalHoy > 0 ? 'up' : 'neutral' },
    { label: 'Ticket Promedio', value: fmt(data.ticketPromedio), sub: 'Promedio por venta', icon: <TrendingUp size={16} /> },
    { label: 'Productos', value: String(data.productosCount), sub: 'En catálogo', icon: <Package size={16} /> },
  ] : [];

  return (
    <div className="min-h-full space-y-6" style={{ fontFamily: 'Rajdhani, system-ui, sans-serif' }}>

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Control Central
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {sucursalActiva && (
            <Badge variant="lime" className="gap-1.5">
              <Building2 size={12} /> {sucursalActiva.nombre}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <Users size={12} /> {usuario?.nombre}
          </Badge>
          <Button size="icon" variant="ghost" onClick={refresh} disabled={loading}
            className="text-muted-foreground hover:text-[#99ff3d]" title="Actualizar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />) : kpis.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}
      </div>

      {/* ─── Gráfica + Stock crítico ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#99ff3d]" /> Actividad de Hoy
                </CardTitle>
                <CardDescription>Ventas por hora</CardDescription>
              </div>
              <Tabs value={chartTab} onValueChange={setChartTab}>
                <TabsList className="h-7">
                  <TabsTrigger value="area" className="text-xs px-2 h-6">Área</TabsTrigger>
                  <TabsTrigger value="bar" className="text-xs px-2 h-6">Barras</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? <Skeleton className="h-44 w-full" /> : (
              <ResponsiveContainer width="100%" height={180}>
                {chartTab === 'area' ? (
                  <AreaChart data={data?.grafica ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#99ff3d" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#99ff3d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                    <XAxis dataKey="hora" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(215 16% 55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="ventas" stroke="#99ff3d" strokeWidth={2} fill="url(#gradVentas)" />
                    <Area type="monotone" dataKey="monto" stroke="#818cf8" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                  </AreaChart>
                ) : (
                  <BarChart data={data?.grafica ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                    <XAxis dataKey="hora" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(215 16% 55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="ventas" fill="#99ff3d" opacity={0.85} radius={[3, 3, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" /> Stock Crítico
            </CardTitle>
            <CardDescription>
              {sucursalActiva ? `Sucursal: ${sucursalActiva.nombre}` : 'Selecciona una sucursal'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !sucursalActiva ? (
              <div className="text-center py-6">
                <Building2 size={28} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sin sucursal activa</p>
              </div>
            ) : data?.stockAlertas?.length === 0 ? (
              <div className="text-center py-6">
                <Package size={28} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-sm text-muted-foreground">Sin alertas de stock</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data?.stockAlertas.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">Mín: {item.stock_minimo}</p>
                    </div>
                    <Badge variant={item.stock === 0 ? 'danger' : 'warning'} className="ml-2 shrink-0">
                      {item.stock === 0 ? 'Agotado' : `${item.stock} uds`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Ventas recientes + Acciones ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart size={16} className="text-[#99ff3d]" /> Ventas Recientes
              </CardTitle>
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground h-7 px-2" onClick={() => navigate('/ventas')}>
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
            ) : data?.ventasRecientes?.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sin ventas registradas hoy</p>
                <Button size="sm" variant="lime" className="mt-3 gap-1.5" onClick={() => navigate('/ventas')}>
                  <Zap size={13} /> Nueva Venta
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2 text-xs text-muted-foreground uppercase tracking-wide pb-1 border-b border-border">
                  <span>Venta #</span>
                  <span className="text-right">Items</span>
                  <span className="text-right">Total</span>
                  <span className="text-right">Estado</span>
                </div>
                {data?.ventasRecientes.map((v) => (
                  <div key={v.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div>
                      <span className="text-sm font-semibold text-[#99ff3d]">#{v.id}</span>
                      <span className="text-xs text-muted-foreground ml-2">{fmtTime(v.fecha)}</span>
                    </div>
                    <span className="text-sm text-right text-muted-foreground">{v.items}</span>
                    <span className="text-sm font-semibold text-right">{fmt(v.total)}</span>
                    <div className="flex justify-end"><EstadoBadge estado={v.estado} /></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap size={16} className="text-[#99ff3d]" /> Acciones Rápidas
            </CardTitle>
            <CardDescription>Acceso directo a funciones clave</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            <Button variant="lime" className="w-full justify-start gap-3 font-semibold" onClick={() => navigate('/ventas')}>
              <ShoppingCart size={16} /> Nueva Venta
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/productos')}>
              <Package size={16} /> Gestionar Productos
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/inventario')}>
              <BarChart3 size={16} /> Ver Inventario
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/clientes')}>
              <Users size={16} /> Clientes
            </Button>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Sistema</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Versión</span>
                  <span className="text-foreground font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Rol</span>
                  <Badge variant="lime" className="text-xs py-0">{usuario?.rol ?? 'N/A'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Estado</span>
                  <Badge variant="success" className="text-xs py-0">Online</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
