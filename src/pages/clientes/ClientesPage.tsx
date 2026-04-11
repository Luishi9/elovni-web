import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Pencil, Trash2, Loader2, Search,
  Phone, Mail, MapPin, History,
} from 'lucide-react';

import { clientesApi } from '@/api/clientes.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import ClienteFormModal from './components/ClienteFormModal';
import ClienteHistorialModal from './components/ClienteHistorialModal';

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  created_at: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);

  const [historialCliente, setHistorialCliente] = useState<Cliente | null>(null);

  const [eliminarItem, setEliminarItem] = useState<Cliente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const fetchClientes = async (isInitial = false) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    if (isInitial) setIsLoading(true);
    else setIsSearching(true);
    try {
      const res = await clientesApi.getAll({ search: search.trim() || undefined, page, limit: LIMIT });
      const body = res.data?.data ?? res.data;
      setClientes(Array.isArray(body) ? body : body.data ?? []);
      setTotal(body.total ?? (Array.isArray(body) ? body.length : 0));
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') console.error(err);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => { fetchClientes(true); }, []);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchClientes(); }, 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { fetchClientes(); }, [page]);

  const handleSaved = () => {
    setModalOpen(false);
    setEditando(null);
    fetchClientes(true);
  };

  const handleEliminar = async () => {
    if (!eliminarItem) return;
    setIsDeleting(true);
    try {
      await clientesApi.remove(eliminarItem.id);
      setEliminarItem(null);
      fetchClientes(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Users className="text-[#99ff3d]" size={24} />
            Clientes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Directorio de clientes e historial de compras
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-8 w-52 bg-background/50 border-border text-sm"
              placeholder="Buscar cliente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => { setEditando(null); setModalOpen(true); }}
            className="h-9 px-4 bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold shadow-[0_0_15px_rgba(153,255,61,0.2)] whitespace-nowrap"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>
      </motion.div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total clientes', value: total, cls: 'text-[#99ff3d]' },
          { label: 'Con teléfono', value: clientes.filter((c) => c.telefono).length, cls: 'text-blue-400' },
          { label: 'Con correo', value: clientes.filter((c) => c.email).length, cls: 'text-purple-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-border bg-card/50 p-4 flex flex-col gap-1"
          >
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{stat.label}</span>
            <span className={`text-2xl font-bold ${stat.cls}`}>{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`rounded-xl border border-border bg-card/50 backdrop-blur-md overflow-hidden flex-1 shadow-2xl transition-opacity duration-200 ${isSearching ? 'opacity-60' : 'opacity-100'}`}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              {['#', 'Nombre', 'Teléfono', 'Correo', 'Dirección', 'Registrado', ''].map((h) => (
                <TableHead key={h} className="bg-background/50 text-xs uppercase tracking-wider">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#99ff3d]" />
                  <p className="mt-2 text-xs text-muted-foreground">Cargando clientes…</p>
                </TableCell>
              </TableRow>
            ) : clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  <Users size={36} className="mx-auto mb-3 opacity-20" />
                  <p>{search ? 'Sin resultados.' : 'Aún no hay clientes registrados.'}</p>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {clientes.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="border-b border-border hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">#{c.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                          {c.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm text-white">{c.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.telefono ? (
                        <span className="flex items-center gap-1.5">
                          <Phone size={11} className="text-muted-foreground/50" />
                          {c.telefono}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail size={11} className="text-muted-foreground/50" />
                          {c.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                      {c.direccion ? (
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin size={11} className="text-muted-foreground/50 shrink-0" />
                          <span className="truncate">{c.direccion}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setHistorialCliente(c)}
                          className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-blue-400 transition-colors"
                          title="Ver historial de compras"
                        >
                          <History size={13} />
                        </button>
                        <button
                          onClick={() => { setEditando(c); setModalOpen(true); }}
                          className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-[#99ff3d] transition-colors"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setEliminarItem(c)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{total} clientes en total</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              className="h-7 border-border"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span>Pág. {page} / {totalPages}</span>
            <Button
              variant="outline" size="sm"
              className="h-7 border-border"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      <ClienteFormModal
        open={modalOpen}
        cliente={editando}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        onSaved={handleSaved}
      />

      {/* HISTORIAL MODAL */}
      <ClienteHistorialModal
        cliente={historialCliente}
        onClose={() => setHistorialCliente(null)}
      />

      {/* CONFIRM DELETE */}
      <Dialog open={!!eliminarItem} onOpenChange={() => setEliminarItem(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Se eliminará a <strong>{eliminarItem?.nombre}</strong> del sistema. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" className="border-border" onClick={() => setEliminarItem(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEliminar}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isDeleting && <Loader2 size={14} className="animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
