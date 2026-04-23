import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Loader2, Package, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';

import { productosApi } from '@/api/productos.api';
import { Producto } from '@/types/producto.types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { ProductoFormModal } from './components/ProductoFormModal';
import { getImageUrl } from '@/utils/format';

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);   // solo carga inicial
  const [isSearching, setIsSearching] = useState(false); // búsqueda sin borrar tabla
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProductos = async (query: string, isInitial = false) => {
    // Cancelar request anterior si sigue en vuelo
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    if (isInitial) setIsLoading(true);
    else setIsSearching(true);

    try {
      const res = await productosApi.getAll({ search: query || undefined });
      setProductos(res.data?.data || []);
    } catch (error: any) {
      if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
        console.error('Error al cargar productos:', error);
      }
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchProductos('', true);
  }, []);

  // Búsqueda con debounce — mantiene la tabla visible mientras busca
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductos(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleEditar = (producto: Producto) => {
    setProductoAEditar(producto);
    setIsModalOpen(true);
  };

  const handleEliminar = async () => {
    if (!productoAEliminar) return;
    try {
      setIsDeleting(true);
      await productosApi.remove(productoAEliminar.id);
      setProductoAEliminar(null);
      fetchProductos(searchQuery);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('No se pudo eliminar el producto.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Package className="text-[#99ff3d]" size={32} />
            Catálogo Estelar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión global de productos e inventario.
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
              : <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            }
            <Input
              type="text"
              placeholder="Buscar producto..."
              className="pl-9 bg-card border-border h-10 w-full focus-visible:ring-[#99ff3d]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold shadow-[0_0_15px_rgba(153,255,61,0.2)] whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </motion.div>
      </div>

      <ProductoFormModal 
        open={isModalOpen} 
        onOpenChange={(v) => { setIsModalOpen(v); if (!v) setProductoAEditar(null); }}
        onSuccess={() => fetchProductos(searchQuery)}
        producto={productoAEditar}
      />

      {/* DATA TABLE SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl border border-border bg-card/50 backdrop-blur-md overflow-hidden flex-1 min-h-0 shadow-2xl transition-opacity duration-200 ${isSearching ? 'opacity-60' : 'opacity-100'}`}
      >
        <div className="h-full overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-[80px] sticky top-0 z-10 bg-card/90 backdrop-blur-md">Imagen</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card/90 backdrop-blur-md">Nombre</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card/90 backdrop-blur-md">Código</TableHead>
              <TableHead className="text-right sticky top-0 z-10 bg-card/90 backdrop-blur-md">Precio Venta</TableHead>
              <TableHead className="text-right sticky top-0 z-10 bg-card/90 backdrop-blur-md">Precio Compra</TableHead>
              <TableHead className="text-center sticky top-0 z-10 bg-card/90 backdrop-blur-md">Estado</TableHead>
              <TableHead className="text-center sticky top-0 z-10 bg-card/90 backdrop-blur-md">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#99ff3d]" />
                  <p className="mt-2 text-xs text-muted-foreground">Cargando catálogo...</p>
                </TableCell>
              </TableRow>
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {productos.map((producto, i) => (
                  <motion.tr
                    key={producto.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: i * 0.05 }}
                    className="group border-b border-border hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell>
                      {producto.imagen_url ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-background/50 border border-border shadow-inner">
                          <img 
                            src={getImageUrl(producto.imagen_url)} 
                            alt={producto.nombre} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-background/80 border border-border flex items-center justify-center text-muted-foreground/30 shadow-inner">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground tracking-wide">{producto.nombre}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{producto.codigo || '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-[#99ff3d] tracking-wide">
                      ${Number(producto.precio_venta).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono text-sm">
                      {producto.precio_compra ? `$${Number(producto.precio_compra).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={producto.activo ? 'default' : 'secondary'} className={producto.activo ? 'bg-[#99ff3d]/10 text-[#99ff3d] border-[#99ff3d]/20 shadow-[0_0_10px_rgba(153,255,61,0.1)]' : ''}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditar(producto)}
                          title="Editar"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-[#99ff3d] hover:bg-[#99ff3d]/10 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setProductoAEliminar(producto)}
                          title="Eliminar"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
        </div>
      </motion.div>

      {/* DIÁLOGO CONFIRMAR ELIMINACIÓN */}
      <Dialog open={!!productoAEliminar} onOpenChange={(v) => { if (!v) setProductoAEliminar(null); }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">¿Eliminar producto?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Se eliminará <span className="text-white font-semibold">{productoAEliminar?.nombre}</span> de forma permanente. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setProductoAEliminar(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              onClick={handleEliminar}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
