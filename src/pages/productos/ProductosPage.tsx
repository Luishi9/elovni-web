import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Loader2, Package, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';

import { productosApi } from '@/api/productos.api';
import { Producto } from '@/types/producto.types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="flex flex-col gap-6 h-full min-h-0">
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl border border-border bg-card/50 backdrop-blur-md flex-1 min-h-0 shadow-2xl transition-opacity duration-200 ${isSearching ? 'opacity-60' : 'opacity-100'}`}
      >
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-foreground">
            <thead className="text-xs font-medium text-muted-foreground bg-background/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-4">
                  <span className="sr-only">Imagen</span>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Código
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">
                  Precio Venta
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">
                  Precio Compra
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-center">
                  Estado
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#99ff3d]" />
                    <p className="mt-2 text-xs text-muted-foreground">Cargando catálogo...</p>
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {productos.map((producto, i) => (
                    <motion.tr
                      key={producto.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-background/30 border-b border-border hover:bg-background/50 transition-colors"
                    >
                      <td className="p-4">
                        {producto.imagen_url ? (
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-background/50 border border-border shadow-inner">
                            <img
                              src={getImageUrl(producto.imagen_url)}
                              alt={producto.nombre}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-background/80 border border-border flex items-center justify-center text-muted-foreground/30 shadow-inner">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground tracking-wide">
                        {producto.nombre}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-mono">
                        {producto.codigo || '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-right text-[#99ff3d] tracking-wide">
                        ${Number(producto.precio_venta).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground font-mono text-sm">
                        {producto.precio_compra ? `$${Number(producto.precio_compra).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${producto.activo ? 'bg-[#99ff3d]/10 text-[#99ff3d] border border-[#99ff3d]/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditar(producto)}
                            title="Editar"
                            className="p-2 rounded-md text-muted-foreground hover:text-[#99ff3d] hover:bg-[#99ff3d]/10 transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setProductoAEliminar(producto)}
                            title="Eliminar"
                            className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
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
