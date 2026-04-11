import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, SlidersHorizontal, Loader2, History } from 'lucide-react';
import { inventarioApi } from '@/api/inventario.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface KardexMovimiento {
  id: number;
  tipo: string;
  cantidad: number;
  notas: string | null;
  venta_id: number | null;
  created_at: string;
  usuarios: { nombre: string } | null;
}

interface KardexModalProps {
  productoId: number | null;
  sucursalId: number | null;
  nombreProducto: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_CONFIG: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  entrada: { icon: <TrendingUp size={12} />, cls: 'text-[#99ff3d] bg-[#99ff3d]/10', label: 'Entrada' },
  salida:  { icon: <TrendingDown size={12} />, cls: 'text-red-400 bg-red-400/10', label: 'Salida' },
  ajuste:  { icon: <SlidersHorizontal size={12} />, cls: 'text-yellow-400 bg-yellow-400/10', label: 'Ajuste' },
};

export function KardexModal({ productoId, sucursalId, nombreProducto, open, onOpenChange }: KardexModalProps) {
  const [movimientos, setMovimientos] = useState<KardexMovimiento[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !productoId || !sucursalId) return;
    setIsLoading(true);
    inventarioApi.getKardex(productoId, sucursalId)
      .then((res) => setMovimientos(res.data?.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [open, productoId, sucursalId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#99ff3d] flex items-center gap-2">
            <History size={18} />
            Kardex — {nombreProducto}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Historial completo de movimientos de inventario
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin text-[#99ff3d]" size={24} />
            </div>
          ) : movimientos.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Sin movimientos registrados.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              <AnimatePresence>
                {movimientos.map((m, i) => {
                  const conf = TIPO_CONFIG[m.tipo] ?? TIPO_CONFIG.ajuste;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 py-3 px-1"
                    >
                      {/* Tipo badge */}
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${conf.cls}`}>
                        {conf.icon}
                        {conf.label}
                      </span>

                      {/* Cantidad */}
                      <span className={`font-mono font-bold text-lg w-16 text-right ${
                        m.tipo === 'entrada' ? 'text-[#99ff3d]' : m.tipo === 'salida' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {m.tipo === 'salida' ? '-' : '+'}{m.cantidad}
                      </span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground truncate">
                          {m.notas ?? (m.venta_id ? `Venta #${m.venta_id}` : 'Sin notas')}
                        </p>
                        <p className="text-xs text-muted-foreground/50">
                          {m.usuarios?.nombre ?? '—'} ·{' '}
                          {new Date(m.created_at).toLocaleDateString('es-MX', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
