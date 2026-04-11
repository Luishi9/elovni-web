import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, Plus, Minus, Trash2, ShoppingCart,
  ArrowLeft, CreditCard, Banknote, Landmark, Check, Package, Printer, QrCode,
} from 'lucide-react';

import { productosApi } from '@/api/productos.api';
import { clientesApi } from '@/api/clientes.api';
import { ventasApi } from '@/api/ventas.api';
import { useSucursalStore } from '@/store/sucursalStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TicketImpresion, TicketData, buildTicketHtml } from './components/TicketImpresion';
import QRTicketModal from './components/QRTicketModal';

interface ProductoCatalogo {
  id: number;
  nombre: string;
  precio_venta: string;
  imagen_url: string | null;
  codigo: string | null;
}

interface CartItem {
  productoId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  descuento: number;
}

interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
}

const METODOS = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { value: 'transferencia', label: 'Transferencia', icon: Landmark },
];

export default function NuevaVentaPage() {
  const navigate = useNavigate();
  const { sucursalActiva } = useSucursalStore() as any;
  const { usuario } = useAuthStore();
  const sucursalEfectiva = sucursalActiva ?? usuario?.sucursalesDetalle?.[0] ?? null;

  // Catálogo
  const [productSearch, setProductSearch] = useState('');
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);

  // Cliente
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [showClientes, setShowClientes] = useState(false);

  // Pago
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Buscar productos con debounce
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await productosApi.getAll({ search: productSearch || undefined, limit: 20 });
        setProductos(res.data?.data || []);
      } catch (e: any) {
        if (e?.code !== 'ERR_CANCELED') console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Buscar clientes con debounce
  useEffect(() => {
    if (!clienteSearch.trim()) { setClientes([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await clientesApi.getAll({ search: clienteSearch, limit: 5 });
        setClientes(res.data?.data || []);
      } catch (_) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [clienteSearch]);

  const addToCart = (p: ProductoCatalogo) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productoId === p.id);
      if (existing) {
        return prev.map((i) =>
          i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      return [...prev, {
        productoId: p.id,
        nombre: p.nombre,
        precioUnitario: Number(p.precio_venta),
        cantidad: 1,
        descuento: 0,
      }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.productoId === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i)
        .filter((i) => i.cantidad > 0),
    );
  };

  const removeItem = (id: number) => setCart((prev) => prev.filter((i) => i.productoId !== id));

  const subtotal = cart.reduce((acc, i) => acc + i.precioUnitario * i.cantidad - i.descuento, 0);
  const total = Math.max(0, subtotal - descuentoGlobal);

  const handleSubmit = async () => {
    if (!cart.length) return;
    if (!sucursalEfectiva) { alert('No hay sucursal activa.'); return; }
    setIsSubmitting(true);
    try {
      const res = await ventasApi.create({
        sucursalId: sucursalEfectiva.id,
        clienteId: clienteSeleccionado?.id,
        metodoPago,
        descuento: descuentoGlobal,
        notas: notas || undefined,
        items: cart.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          descuento: i.descuento,
        })),
      });
      const ventaId = res.data?.data?.id ?? res.data?.id ?? 1;
      setSuccessId(ventaId);
      // Guardar datos del ticket para impresión
      setTicketData({
        ventaId,
        fecha: new Date(),
        sucursal: sucursalEfectiva?.nombre ?? 'Sucursal',
        cajero: usuario?.nombre ?? 'Cajero',
        cliente: clienteSeleccionado?.nombre ?? 'Público General',
        metodoPago,
        items: cart.map((i) => ({
          nombre: i.nombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          descuento: i.descuento,
        })),
        subtotal,
        descuentoGlobal,
        total,
        notas: notas || undefined,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al registrar la venta';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successId) {
    const handlePrint = () => {
      if (!ticketData) return;
      const html = buildTicketHtml(ticketData);
      const printWin = window.open('', '_blank', 'width=420,height=700,scrollbars=yes');
      if (!printWin) { alert('Permite las ventanas emergentes para imprimir.'); return; }
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      // Esperar a que carguen las imágenes antes de imprimir
      printWin.onload = () => { printWin.focus(); printWin.print(); };
    };

    return (
      <>
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <TicketImpresion ref={ticketRef} data={ticketData} />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#99ff3d]/10 border border-[#99ff3d]/30 flex items-center justify-center">
            <Check size={40} className="text-[#99ff3d]" />
          </div>
          <h2 className="text-2xl font-bold text-white">¡Venta registrada!</h2>
          <p className="text-muted-foreground">Venta #{successId} completada correctamente.</p>
          <p className="text-3xl font-bold text-[#99ff3d]">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex gap-3 mt-2 flex-wrap justify-center">
            <Button
              variant="outline"
              onClick={() => { setCart([]); setSuccessId(null); setClienteSeleccionado(null); setDescuentoGlobal(0); setNotas(''); setTicketData(null); }}
              className="border-border"
            >
              Nueva venta
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-border gap-2"
            >
              <Printer size={16} />
              Imprimir ticket
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQR(true)}
              className="border-border gap-2"
            >
              <QrCode size={16} />
              QR para cliente
            </Button>
            <Button
              onClick={() => navigate('/ventas')}
              className="bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold"
            >
              Ver historial
            </Button>
          </div>
        </motion.div>
        </div>

        <QRTicketModal data={ticketData} open={showQR} onClose={() => setShowQR(false)} />
      </>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ventas')} className="text-muted-foreground hover:text-white">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <ShoppingCart className="text-[#99ff3d]" size={24} />
            Nueva Venta
          </h2>
          <p className="text-xs text-muted-foreground">{sucursalEfectiva?.nombre ?? 'Sin sucursal'}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

        {/* LEFT — Catálogo */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="relative">
            {isSearching
              ? <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-[#99ff3d] animate-spin" />
              : <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />}
            <Input
              placeholder="Buscar producto por nombre o código..."
              className="pl-9 bg-card border-border focus-visible:ring-[#99ff3d]"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1">
            <AnimatePresence>
              {productos.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => addToCart(p)}
                  className="group relative flex flex-col rounded-xl border border-border bg-card/60 hover:border-[#99ff3d]/50 hover:bg-card transition-all text-left overflow-hidden"
                >
                  <div className="aspect-square bg-background/50 overflow-hidden">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                        <Package size={32} />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{p.nombre}</p>
                    <p className="text-sm font-bold text-[#99ff3d] mt-0.5">
                      ${Number(p.precio_venta).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 bg-[#99ff3d] text-black rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(153,255,61,0.5)]">
                    <Plus size={14} />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
            {!isSearching && productos.length === 0 && (
              <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground text-sm">
                No se encontraron productos.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Carrito + Pago */}
        <div className="flex flex-col gap-3 w-full lg:w-[380px] shrink-0">

          {/* Carrito */}
          <div className="rounded-xl border border-border bg-card/50 flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <ShoppingCart size={14} className="text-[#99ff3d]" />
                Carrito
              </span>
              <span className="text-xs text-muted-foreground">{cart.length} ítem(s)</span>
            </div>
            <div className="flex flex-col divide-y divide-border overflow-y-auto max-h-[280px]">
              <AnimatePresence>
                {cart.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 text-center text-sm text-muted-foreground">
                    Agrega productos del catálogo
                  </motion.div>
                )}
                {cart.map((item) => (
                  <motion.div
                    key={item.productoId}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-foreground">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ${item.precioUnitario.toFixed(2)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.productoId, -1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-white/5 text-muted-foreground">
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center text-sm font-mono">{item.cantidad}</span>
                      <button onClick={() => updateQty(item.productoId, 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-white/5 text-muted-foreground">
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#99ff3d] w-16 text-right font-mono">
                      ${(item.precioUnitario * item.cantidad).toFixed(2)}
                    </span>
                    <button onClick={() => removeItem(item.productoId)} className="text-muted-foreground/50 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Cliente */}
          <div className="rounded-xl border border-border bg-card/50 p-4 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Cliente</p>
            {clienteSeleccionado ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{clienteSeleccionado.nombre}</p>
                  {clienteSeleccionado.telefono && <p className="text-xs text-muted-foreground">{clienteSeleccionado.telefono}</p>}
                </div>
                <button onClick={() => setClienteSeleccionado(null)} className="text-xs text-muted-foreground hover:text-white underline">
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Público General (buscar cliente...)"
                  className="bg-background border-border text-sm focus-visible:ring-[#99ff3d]"
                  value={clienteSearch}
                  onChange={(e) => { setClienteSearch(e.target.value); setShowClientes(true); }}
                  onFocus={() => setShowClientes(true)}
                />
                {showClientes && clientes.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                    {clientes.map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={() => { setClienteSeleccionado(c); setClienteSearch(''); setShowClientes(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-border/50 last:border-0"
                      >
                        <p className="font-medium">{c.nombre}</p>
                        {c.telefono && <p className="text-xs text-muted-foreground">{c.telefono}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div className="rounded-xl border border-border bg-card/50 p-4 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {METODOS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setMetodoPago(value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                    metodoPago === value
                      ? 'border-[#99ff3d] bg-[#99ff3d]/10 text-[#99ff3d]'
                      : 'border-border text-muted-foreground hover:border-border/80 hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Descuento + Notas + Total */}
          <div className="rounded-xl border border-border bg-card/50 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Descuento ($)</p>
                <Input
                  type="number"
                  min={0}
                  value={descuentoGlobal || ''}
                  onChange={(e) => setDescuentoGlobal(Number(e.target.value))}
                  placeholder="0.00"
                  className="bg-background border-border text-sm font-mono focus-visible:ring-[#99ff3d]"
                />
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-xs text-muted-foreground">Subtotal</span>
                <span className="text-sm font-mono text-muted-foreground">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Input
              placeholder="Notas (opcional)"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="bg-background border-border text-sm focus-visible:ring-[#99ff3d]"
            />

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-3xl font-bold text-[#99ff3d]">
                ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <Button
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleSubmit}
              className="w-full h-12 text-base bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-bold shadow-[0_0_20px_rgba(153,255,61,0.25)] disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <Check size={18} className="mr-2" />
                  Confirmar venta
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

