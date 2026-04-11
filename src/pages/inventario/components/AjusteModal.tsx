import { useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, SlidersHorizontal } from 'lucide-react';
import { inventarioApi } from '@/api/inventario.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InventarioItem {
  id: number;
  cantidad: number;
  producto_id: number;
  sucursal_id: number;
  productos: { nombre: string; codigo: string | null };
}

interface AjusteModalProps {
  item: InventarioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TIPOS = [
  { value: 'entrada', label: 'Entrada', icon: TrendingUp, cls: 'border-[#99ff3d] bg-[#99ff3d]/10 text-[#99ff3d]' },
  { value: 'salida', label: 'Salida', icon: TrendingDown, cls: 'border-red-500 bg-red-500/10 text-red-400' },
  { value: 'ajuste', label: 'Ajuste directo', icon: SlidersHorizontal, cls: 'border-yellow-400 bg-yellow-400/10 text-yellow-400' },
] as const;

type TipoAjuste = 'entrada' | 'salida' | 'ajuste';

export function AjusteModal({ item, open, onOpenChange, onSuccess }: AjusteModalProps) {
  const [tipo, setTipo] = useState<TipoAjuste>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!item || !cantidad || Number(cantidad) <= 0) return;
    setIsSubmitting(true);
    setError('');
    try {
      await inventarioApi.ajustar({
        productoId: item.producto_id,
        sucursalId: item.sucursal_id,
        tipo,
        cantidad: Number(cantidad),
        notas: notas || undefined,
      });
      setCantidad('');
      setNotas('');
      setTipo('entrada');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al ajustar inventario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stockResultado = () => {
    const actual = item?.cantidad ?? 0;
    const cant = Number(cantidad) || 0;
    if (tipo === 'entrada') return actual + cant;
    if (tipo === 'salida') return Math.max(0, actual - cant);
    return cant;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#99ff3d]">Ajuste de Inventario</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {item?.productos.nombre}
            {item?.productos.codigo && <span className="ml-2 font-mono text-xs">({item.productos.codigo})</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Stock actual */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Stock actual</span>
            <span className="text-2xl font-bold text-white">{item?.cantidad ?? 0}</span>
          </div>

          {/* Tipo */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Tipo de movimiento</p>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(({ value, label, icon: Icon, cls }) => (
                <button
                  key={value}
                  onClick={() => setTipo(value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                    tipo === value ? cls : 'border-border text-muted-foreground hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              {tipo === 'ajuste' ? 'Nueva cantidad total' : 'Cantidad a mover'}
            </p>
            <Input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
              className="bg-background border-border font-mono text-lg focus-visible:ring-[#99ff3d]"
            />
          </div>

          {/* Preview resultado */}
          {cantidad && Number(cantidad) > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Stock resultante</span>
              <span className="text-2xl font-bold text-[#99ff3d]">{stockResultado()}</span>
            </div>
          )}

          {/* Notas */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Notas (opcional)</p>
            <Input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Razón del ajuste..."
              className="bg-background border-border focus-visible:ring-[#99ff3d]"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            disabled={!cantidad || Number(cantidad) <= 0 || isSubmitting}
            onClick={handleSubmit}
            className="w-full bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-bold disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar ajuste'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
