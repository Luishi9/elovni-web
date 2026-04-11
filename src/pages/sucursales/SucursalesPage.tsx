import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Pencil, Trash2, Loader2,
  MapPin, Phone, CheckCircle2, XCircle,
} from 'lucide-react';

import { sucursalesApi, Sucursal } from '@/api/sucursales.api';
import { useSucursalStore } from '@/store/sucursalStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import SucursalFormModal from './components/SucursalFormModal';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Sucursal | null>(null);

  const [eliminarItem, setEliminarItem] = useState<Sucursal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { sucursalActiva, setSucursal } = useSucursalStore();

  const fetchSucursales = async () => {
    try {
      const res = await sucursalesApi.getAll();
      setSucursales(res.data?.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSucursales(); }, []);

  const handleSaved = () => {
    setModalOpen(false);
    setEditando(null);
    fetchSucursales();
  };

  const handleEliminar = async () => {
    if (!eliminarItem) return;
    setIsDeleting(true);
    try {
      await sucursalesApi.remove(eliminarItem.id);
      if (sucursalActiva?.id === eliminarItem.id) useSucursalStore.getState().clearSucursal();
      setEliminarItem(null);
      fetchSucursales();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const activas = sucursales.filter((s) => s.activa).length;

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
            <Building2 className="text-[#99ff3d]" size={24} />
            Sucursales
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestión de puntos de venta y selección de sucursal activa
          </p>
        </div>
        <Button
          onClick={() => { setEditando(null); setModalOpen(true); }}
          className="h-9 px-4 bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold shadow-[0_0_15px_rgba(153,255,61,0.2)] whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva sucursal
        </Button>
      </motion.div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total', value: sucursales.length, cls: 'text-white' },
          { label: 'Activas', value: activas, cls: 'text-[#99ff3d]' },
          { label: 'Inactivas', value: sucursales.length - activas, cls: 'text-red-400' },
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

      {/* SUCURSAL ACTIVA BANNER */}
      {sucursalActiva && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#99ff3d]/30 bg-[#99ff3d]/5"
        >
          <Building2 size={15} className="text-[#99ff3d] shrink-0" />
          <span className="text-sm text-muted-foreground">
            Sucursal activa: <strong className="text-[#99ff3d]">{sucursalActiva.nombre}</strong>
          </span>
        </motion.div>
      )}

      {/* CARDS GRID */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-[#99ff3d]" />
        </div>
      ) : sucursales.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
          <Building2 size={40} className="opacity-20" />
          <p>No hay sucursales registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sucursales.map((s, i) => {
              const isActiva = sucursalActiva?.id === s.id;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative rounded-2xl border bg-card/50 backdrop-blur-sm p-5 flex flex-col gap-3 transition-all duration-200 ${
                    isActiva
                      ? 'border-[#99ff3d]/50 shadow-[0_0_20px_rgba(153,255,61,0.10)]'
                      : 'border-border hover:border-border/60'
                  } ${!s.activa ? 'opacity-60' : ''}`}
                >
                  {/* Status badge */}
                  <div className="absolute top-4 right-4">
                    {s.activa ? (
                      <Badge className="bg-[#99ff3d]/10 text-[#99ff3d] border-[#99ff3d]/30 text-[10px] gap-1 border">
                        <CheckCircle2 size={9} /> Activa
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] gap-1 border">
                        <XCircle size={9} /> Inactiva
                      </Badge>
                    )}
                  </div>

                  {/* Icon + Nombre */}
                  <div className="flex items-center gap-3 pr-20">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActiva
                        ? 'bg-[#99ff3d]/15 border border-[#99ff3d]/30'
                        : 'bg-white/5 border border-border'
                    }`}>
                      <Building2 size={18} className={isActiva ? 'text-[#99ff3d]' : 'text-muted-foreground'} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm leading-tight">{s.nombre}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60">ID #{s.id}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1.5 min-h-[40px]">
                    {s.direccion && (
                      <span className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={11} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{s.direccion}</span>
                      </span>
                    )}
                    {s.telefono && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone size={11} className="shrink-0" />
                        {s.telefono}
                      </span>
                    )}
                    {!s.direccion && !s.telefono && (
                      <span className="text-xs text-muted-foreground/30 text-[#999]">Sin información de contacto</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border mt-auto">
                    <Button
                      size="sm"
                      variant={isActiva ? 'default' : 'outline'}
                      disabled={!s.activa}
                      onClick={() => setSucursal({ id: s.id, nombre: s.nombre })}
                      className={`flex-1 h-7 text-xs ${
                        isActiva
                          ? 'bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-bold'
                          : 'border-border text-muted-foreground hover:text-white'
                      }`}
                    >
                      {isActiva ? '✓ En uso' : 'Usar sucursal'}
                    </Button>
                    <button
                      onClick={() => { setEditando(s); setModalOpen(true); }}
                      className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-[#99ff3d] transition-colors"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setEliminarItem(s)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* FORM MODAL */}
      <SucursalFormModal
        open={modalOpen}
        sucursal={editando}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        onSaved={handleSaved}
      />

      {/* CONFIRM DELETE */}
      <Dialog open={!!eliminarItem} onOpenChange={() => setEliminarItem(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">¿Eliminar sucursal?</DialogTitle>
            <DialogDescription>
              La sucursal <strong>{eliminarItem?.nombre}</strong> se desactivará. Los datos históricos se conservarán.
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
