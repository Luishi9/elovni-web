import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Pencil, Trash2, Loader2, ShieldCheck,
  ShoppingBag, Settings2, Search,
} from 'lucide-react';

import { usuariosApi, Usuario } from '@/api/usuarios.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import UsuarioFormModal from './components/UsuarioFormModal';

const ROL_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  admin: {
    label: 'Admin',
    icon: <ShieldCheck size={11} />,
    cls: 'bg-[#99ff3d]/10 text-[#99ff3d] border-[#99ff3d]/30',
  },
  vendedor: {
    label: 'Vendedor',
    icon: <ShoppingBag size={11} />,
    cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  operador: {
    label: 'Operador',
    icon: <Settings2 size={11} />,
    cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);

  const [eliminarItem, setEliminarItem] = useState<Usuario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsuarios = async () => {
    try {
      const res = await usuariosApi.getAll();
      setUsuarios(res.data?.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleSaved = () => {
    setModalOpen(false);
    setEditando(null);
    fetchUsuarios();
  };

  const handleEliminar = async () => {
    if (!eliminarItem) return;
    setIsDeleting(true);
    try {
      await usuariosApi.remove(eliminarItem.id);
      setEliminarItem(null);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtrados = usuarios.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.roles?.nombre?.toLowerCase().includes(q)
    );
  });

  const porRol = (rol: string) => usuarios.filter((u) => u.roles?.nombre === rol).length;

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
            Usuarios
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestión de cuentas y permisos del sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-8 w-48 bg-background/50 border-border text-sm"
              placeholder="Buscar usuario…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => { setEditando(null); setModalOpen(true); }}
            className="h-9 px-4 bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold shadow-[0_0_15px_rgba(153,255,61,0.2)] whitespace-nowrap"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo usuario
          </Button>
        </div>
      </motion.div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: usuarios.length, cls: 'text-white' },
          { label: 'Admins', value: porRol('admin'), cls: 'text-[#99ff3d]' },
          { label: 'Vendedores', value: porRol('vendedor'), cls: 'text-blue-400' },
          { label: 'Operadores', value: porRol('operador'), cls: 'text-purple-400' },
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
        className="rounded-xl border border-border bg-card/50 backdrop-blur-md overflow-hidden flex-1 shadow-2xl"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              {['#', 'Nombre', 'Correo', 'Rol', 'Sucursales', 'Creado', ''].map((h) => (
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
                  <p className="mt-2 text-xs text-muted-foreground">Cargando usuarios…</p>
                </TableCell>
              </TableRow>
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  <Users size={36} className="mx-auto mb-3 opacity-20" />
                  <p>{search ? 'Sin resultados.' : 'Aún no hay usuarios registrados.'}</p>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filtrados.map((u, i) => {
                  const rol = ROL_CONFIG[u.roles?.nombre] ?? ROL_CONFIG.operador;
                  const sucursales = u.usuarios_sucursales?.map((us) => us.sucursales.nombre) ?? [];
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">#{u.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#99ff3d]/20 to-[#99ff3d]/5 border border-[#99ff3d]/20 flex items-center justify-center text-[#99ff3d] font-bold text-xs shrink-0">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm text-white">{u.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge className={`flex items-center gap-1 w-fit text-[11px] border ${rol.cls}`}>
                          {rol.icon}
                          {rol.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sucursales.length === 0 ? (
                          <span className="text-xs text-muted-foreground/50">Sin asignar</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {sucursales.map((s) => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-border text-muted-foreground">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditando(u); setModalOpen(true); }}
                            className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-[#99ff3d] transition-colors"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setEliminarItem(u)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
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

      {/* FORM MODAL */}
      <UsuarioFormModal
        open={modalOpen}
        usuario={editando}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        onSaved={handleSaved}
      />

      {/* CONFIRM DELETE */}
      <Dialog open={!!eliminarItem} onOpenChange={() => setEliminarItem(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">¿Eliminar usuario?</DialogTitle>
            <DialogDescription>
              El usuario <strong>{eliminarItem?.nombre}</strong> será desactivado y no podrá acceder al sistema.
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
