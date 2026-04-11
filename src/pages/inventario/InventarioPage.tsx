import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes, Search, Loader2, Image as ImageIcon,
  SlidersHorizontal, History, AlertTriangle, Package,
} from 'lucide-react';

import { inventarioApi } from '@/api/inventario.api';
import { useSucursalStore } from '@/store/sucursalStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { AjusteModal } from './components/AjusteModal';
import { KardexModal } from './components/KardexModal';

interface InventarioItem {
  id: number;
  cantidad: number;
  stock_minimo: number;
  stock_maximo: number | null;
  producto_id: number;
  sucursal_id: number;
  productos: {
    id: number;
    codigo: string | null;
    nombre: string;
    imagen_url: string | null;
    precio_venta: string;
    unidad_medida: string | null;
  };
}

const getStockBadge = (cantidad: number, minimo: number) => {
  if (cantidad === 0) return { label: 'Sin stock', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
  if (cantidad <= minimo) return { label: 'Stock bajo', cls: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30' };
  return { label: 'En stock', cls: 'bg-[#99ff3d]/10 text-[#99ff3d] border-[#99ff3d]/30' };
};

export default function InventarioPage() {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { sucursalActiva } = useSucursalStore();
  const { usuario } = useAuthStore();
  const sucursalEfectiva = sucursalActiva ?? usuario?.sucursalesDetalle?.[0] ?? null;

  // Ajuste modal
  const [ajusteItem, setAjusteItem] = useState<InventarioItem | null>(null);
  const [ajusteOpen, setAjusteOpen] = useState(false);

  // Kardex modal
  const [kardexItem, setKardexItem] = useState<InventarioItem | null>(null);
  const [kardexOpen, setKardexOpen] = useState(false);

  const fetchInventario = async (isInitial = false) => {
    if (!sucursalEfectiva) { setIsLoading(false); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    if (isInitial) setIsLoading(true); else setIsSearching(true);
    try {
      const res = await inventarioApi.getBySucursal(sucursalEfectiva.id, {
        search: searchQuery || undefined,
        soloStockBajo: soloStockBajo || undefined,
      });
      setItems(res.data?.data || []);
    } catch (e: any) {
      if (e?.code !== 'ERR_CANCELED') console.error(e);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => { fetchInventario(true); }, [sucursalEfectiva, soloStockBajo]);

  useEffect(() => {
    const t = setTimeout(() => fetchInventario(), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const stats = {
    total: items.length,
    sinStock: items.filter((i) => i.cantidad === 0).length,
    stockBajo: items.filter((i) => i.cantidad > 0 && i.cantidad <= i.stock_minimo).length,
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Boxes className="text-[#99ff3d]" size={32} />
            Inventario
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {sucursalEfectiva ? `Sucursal: ${sucursalEfectiva.nombre}` : 'Sin sucursal activa'}
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
              placeholder="Buscar producto..."
              className="pl-9 bg-card border-border h-10 w-full focus-visible:ring-[#99ff3d]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={soloStockBajo ? 'default' : 'outline'}
            onClick={() => setSoloStockBajo((p) => !p)}
            className={`h-10 whitespace-nowrap border-border ${soloStockBajo ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/40 hover:bg-yellow-400/30' : 'text-muted-foreground hover:text-white'}`}
          >
            <AlertTriangle size={14} className="mr-2" />
            Stock bajo
          </Button>
        </motion.div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total productos', value: stats.total, color: 'text-white' },
          { label: 'Stock bajo', value: stats.stockBajo, color: 'text-yellow-400' },
          { label: 'Sin stock', value: stats.sinStock, color: 'text-red-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-border bg-card/50 p-4 flex flex-col gap-1"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</span>
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl border border-border bg-card/50 backdrop-blur-md overflow-hidden flex-1 shadow-2xl transition-opacity duration-200 ${isSearching ? 'opacity-60' : 'opacity-100'}`}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-[60px] bg-background/50">Img</TableHead>
              <TableHead className="bg-background/50">Producto</TableHead>
              <TableHead className="bg-background/50">Código</TableHead>
              <TableHead className="text-right bg-background/50">Cantidad</TableHead>
              <TableHead className="bg-background/50">Unidad</TableHead>
              <TableHead className="text-right bg-background/50">Precio Venta</TableHead>
              <TableHead className="text-center bg-background/50">Estado</TableHead>
              <TableHead className="text-center bg-background/50">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#99ff3d]" />
                  <p className="mt-2 text-xs text-muted-foreground">Cargando inventario...</p>
                </TableCell>
              </TableRow>
            ) : !sucursalEfectiva ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                  <Package size={36} className="mx-auto mb-3 opacity-20" />
                  <p>No hay sucursal activa. Inicia sesión nuevamente.</p>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                  <Boxes size={36} className="mx-auto mb-3 opacity-20" />
                  <p>No se encontraron productos en el inventario.</p>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {items.map((item, i) => {
                  const badge = getStockBadge(item.cantidad, item.stock_minimo ?? 0);
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group border-b border-border hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Imagen */}
                      <TableCell>
                        {item.productos.imagen_url ? (
                          <div className="w-9 h-9 rounded-md overflow-hidden bg-background/50 border border-border">
                            <img
                              src={item.productos.imagen_url}
                              alt={item.productos.nombre}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-background/80 border border-border flex items-center justify-center text-muted-foreground/30">
                            <ImageIcon size={14} />
                          </div>
                        )}
                      </TableCell>

                      {/* Nombre */}
                      <TableCell className="font-medium text-foreground">{item.productos.nombre}</TableCell>

                      {/* Código */}
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.productos.codigo || '—'}
                      </TableCell>

                      {/* Cantidad */}
                      <TableCell className="text-right">
                        <span className={`text-xl font-bold font-mono ${
                          item.cantidad === 0 ? 'text-red-400' :
                          item.cantidad <= (item.stock_minimo ?? 0) ? 'text-yellow-400' :
                          'text-white'
                        }`}>
                          {item.cantidad}
                        </span>
                      </TableCell>

                      {/* Unidad */}
                      <TableCell className="text-sm text-muted-foreground">
                        {item.productos.unidad_medida ?? '—'}
                      </TableCell>

                      {/* Precio */}
                      <TableCell className="text-right font-mono text-sm text-[#99ff3d]">
                        ${Number(item.productos.precio_venta).toFixed(2)}
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="text-center">
                        <Badge className={`text-xs border ${badge.cls}`}>{badge.label}</Badge>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setAjusteItem(item); setAjusteOpen(true); }}
                            title="Ajustar stock"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-[#99ff3d] hover:bg-[#99ff3d]/10 transition-colors"
                          >
                            <SlidersHorizontal size={15} />
                          </button>
                          <button
                            onClick={() => { setKardexItem(item); setKardexOpen(true); }}
                            title="Ver kardex"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <History size={15} />
                          </button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* MODALS */}
      <AjusteModal
        item={ajusteItem}
        open={ajusteOpen}
        onOpenChange={setAjusteOpen}
        onSuccess={() => fetchInventario()}
      />
      <KardexModal
        productoId={kardexItem?.producto_id ?? null}
        sucursalId={kardexItem?.sucursal_id ?? null}
        nombreProducto={kardexItem?.productos.nombre ?? ''}
        open={kardexOpen}
        onOpenChange={setKardexOpen}
      />
    </div>
  );
}

