import { useEffect, useRef, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Plus, Search, Loader2, Receipt,
  ChevronDown, ChevronUp, BadgeCheck, XCircle, Clock, Printer, QrCode,
} from 'lucide-react';
import { buildTicketHtml, TicketData } from './components/TicketImpresion';
import QRTicketModal from './components/QRTicketModal';

import { ventasApi } from '@/api/ventas.api';
import { Venta } from '@/types/venta.types';
import { useSucursalStore } from '@/store/sucursalStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
};

const ESTADO_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  completada: {
    label: 'Completada',
    icon: <BadgeCheck size={12} />,
    cls: 'bg-[#99ff3d]/10 text-[#99ff3d] border-[#99ff3d]/30',
  },
  cancelada: {
    label: 'Cancelada',
    icon: <XCircle size={12} />,
    cls: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
  pendiente: {
    label: 'Pendiente',
    icon: <Clock size={12} />,
    cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  },
};

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [qrData, setQrData] = useState<TicketData | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { sucursalActiva } = useSucursalStore();
  const navigate = useNavigate();

  function handleReprintTicket(venta: Venta, e: React.MouseEvent) {
    e.stopPropagation();
    const subtotal = venta.venta_detalle.reduce(
      (acc, d) => acc + Number(d.precio_unitario) * d.cantidad,
      0,
    );
    const data = buildTicketData(venta, subtotal);
    const html = buildTicketHtml(data);
    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  }

  function handleShowQR(venta: Venta, e: React.MouseEvent) {
    e.stopPropagation();
    const subtotal = venta.venta_detalle.reduce(
      (acc, d) => acc + Number(d.precio_unitario) * d.cantidad,
      0,
    );
    setQrData(buildTicketData(venta, subtotal));
  }

  function buildTicketData(venta: Venta, subtotal: number): TicketData {
    return {
      ventaId: venta.id,
      fecha: new Date(venta.created_at),
      sucursal: venta.sucursales?.nombre ?? sucursalActiva?.nombre ?? 'El Ovni',
      cajero: venta.usuarios?.nombre ?? 'Cajero',
      cliente: venta.clientes?.nombre ?? 'P\u00fablico General',
      metodoPago: venta.metodo_pago,
      items: venta.venta_detalle.map((d) => ({
        nombre: d.productos?.nombre ?? `Producto #${d.id}`,
        cantidad: d.cantidad,
        precioUnitario: Number(d.precio_unitario),
        descuento: 0,
      })),
      subtotal,
      descuentoGlobal: Number(venta.descuento ?? 0),
      total: Number(venta.total),
    };
  }

  const fetchVentas = async (isInitial = false) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    if (isInitial) setIsLoading(true);
    else setIsSearching(true);
    try {
      const params: Record<string, unknown> = {};
      if (sucursalActiva) params.sucursalId = sucursalActiva.id;
      const res = await ventasApi.getAll(params);
      let data: Venta[] = res.data?.data || [];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        data = data.filter(
          (v) =>
            String(v.id).includes(q) ||
            v.clientes?.nombre?.toLowerCase().includes(q) ||
            v.usuarios?.nombre?.toLowerCase().includes(q),
        );
      }
      setVentas(data);
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') console.error(err);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => { fetchVentas(true); }, [sucursalActiva]);

  useEffect(() => {
    const t = setTimeout(() => fetchVentas(), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const totales = ventas.reduce(
    (acc, v) => ({
      monto: acc.monto + Number(v.total),
      count: acc.count + 1,
    }),
    { monto: 0, count: 0 },
  );

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShoppingCart className="text-[#99ff3d]" size={32} />
            Historial de Ventas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {sucursalActiva ? `Sucursal: ${sucursalActiva.nombre}` : 'Todas las sucursales'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 w-full sm:w-auto"
        >
          <div className="relative w-full sm:w-64">
            {isSearching
              ? <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-[#99ff3d] animate-spin" />
              : <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />}
            <Input
              placeholder="Buscar por # o cliente..."
              className="pl-9 bg-card border-border h-10 w-full focus-visible:ring-[#99ff3d]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => navigate('/ventas/nueva')}
            className="h-10 px-4 bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold shadow-[0_0_15px_rgba(153,255,61,0.2)] whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Button>
        </motion.div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total ventas', value: totales.count, prefix: '' },
          { label: 'Ingresos', value: totales.monto.toFixed(2), prefix: '$' },
          {
            label: 'Completadas',
            value: ventas.filter((v) => v.estado === 'completada').length,
            prefix: '',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card/50 p-4 flex flex-col gap-1"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</span>
            <span className="text-2xl font-bold text-[#99ff3d]">{stat.prefix}{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl border border-border bg-card/50 backdrop-blur-md flex-1 min-h-0 overflow-y-auto overflow-x-auto shadow-2xl transition-opacity duration-200 ${isSearching ? 'opacity-60' : 'opacity-100'}`}
      >
        <div className="relative">
          <table className="w-full text-sm text-left rtl:text-right text-foreground">
            <thead className="text-xs font-medium text-muted-foreground bg-background/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">#</th>
                <th scope="col" className="px-6 py-4 font-semibold">Fecha</th>
                <th scope="col" className="px-6 py-4 font-semibold">Cliente</th>
                <th scope="col" className="px-6 py-4 font-semibold">Vendedor</th>
                <th scope="col" className="px-6 py-4 font-semibold">Método</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Total</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center">Estado</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#99ff3d]" />
                    <p className="mt-2 text-xs text-muted-foreground">Cargando ventas...</p>
                  </td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    <Receipt size={36} className="mx-auto mb-3 opacity-20" />
                    <p>No se encontraron ventas.</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {ventas.map((venta, i) => {
                    const estado = ESTADO_CONFIG[venta.estado] ?? ESTADO_CONFIG.pendiente;
                    const isExpanded = expandedId === venta.id;
                    return (
                      <Fragment key={venta.id}>
                        <motion.tr
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="bg-background/30 border-b border-border hover:bg-background/50 transition-colors cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : venta.id)}
                        >
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">#{venta.id}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(venta.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm">{venta.clientes?.nombre ?? 'Público General'}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{venta.usuarios?.nombre ?? '—'}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {METODO_LABEL[venta.metodo_pago] ?? venta.metodo_pago}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#99ff3d] font-mono text-right">
                            ${Number(venta.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${estado.cls}`}>
                              {estado.icon}
                              {estado.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => handleReprintTicket(venta, e)}
                                className="p-2 rounded hover:bg-white/10 text-muted-foreground hover:text-[#99ff3d] transition-colors"
                                title="Reimprimir ticket"
                              >
                                <Printer size={16} />
                              </button>
                              <button
                                onClick={(e) => handleShowQR(venta, e)}
                                className="p-2 rounded hover:bg-white/10 text-muted-foreground hover:text-[#99ff3d] transition-colors"
                                title="QR para cliente"
                              >
                                <QrCode size={16} />
                              </button>
                              {isExpanded
                                ? <ChevronUp size={16} className="text-muted-foreground" />
                                : <ChevronDown size={16} className="text-muted-foreground" />}
                            </div>
                          </td>
                        </motion.tr>

                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <td colSpan={8} className="bg-background/40 p-0 border-b border-border">
                              <div className="px-6 py-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Detalle de productos</p>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-border text-muted-foreground text-xs">
                                      <th className="text-left py-1 font-normal">Producto</th>
                                      <th className="text-right py-1 font-normal">Cant.</th>
                                      <th className="text-right py-1 font-normal">Precio</th>
                                      <th className="text-right py-1 font-normal">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {venta.venta_detalle.map((d) => (
                                      <tr key={d.id} className="border-b border-border/50 last:border-0">
                                        <td className="py-2">{d.productos?.nombre ?? `Producto #${d.id}`}</td>
                                        <td className="text-right text-muted-foreground">{d.cantidad}</td>
                                        <td className="text-right text-muted-foreground font-mono">
                                          ${Number(d.precio_unitario).toFixed(2)}
                                        </td>
                                        <td className="text-right font-mono text-[#99ff3d]">
                                          ${Number(d.subtotal).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </Fragment>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <QRTicketModal data={qrData} open={!!qrData} onClose={() => setQrData(null)} />
    </div>
  );
}

