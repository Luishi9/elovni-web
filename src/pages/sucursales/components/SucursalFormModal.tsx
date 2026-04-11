import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { sucursalesApi, Sucursal, SucursalDTO } from '@/api/sucursales.api';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Props {
  open: boolean;
  sucursal: Sucursal | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SucursalFormModal({ open, sucursal, onClose, onSaved }: Props) {
  const isEdit = !!sucursal;

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [activa, setActiva] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNombre(sucursal?.nombre ?? '');
      setDireccion(sucursal?.direccion ?? '');
      setTelefono(sucursal?.telefono ?? '');
      setActiva(sucursal?.activa ?? true);
      setError('');
    }
  }, [open, sucursal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es requerido.'); return; }
    setIsSaving(true);
    setError('');
    try {
      const dto: SucursalDTO = {
        nombre: nombre.trim(),
        direccion: direccion.trim() || undefined,
        telefono: telefono.trim() || undefined,
        activa,
      };
      if (isEdit) {
        await sucursalesApi.update(sucursal!.id, dto);
      } else {
        await sucursalesApi.create(dto);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Ocurrió un error al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEdit ? 'Editar sucursal' : 'Nueva sucursal'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Actualiza los datos de la sucursal.' : 'Completa la información para registrar la sucursal.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sucursal-nombre" className="text-sm text-white/80">
              Nombre <span className="text-red-400">*</span>
            </Label>
            <Input
              id="sucursal-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Sucursal Centro"
              className="bg-white/5 border-border text-white placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Dirección */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sucursal-direccion" className="text-sm text-white/80">
              Dirección
            </Label>
            <Textarea
              id="sucursal-direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle, número, colonia..."
              rows={2}
              className="bg-white/5 border-border text-white placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sucursal-telefono" className="text-sm text-white/80">
              Teléfono
            </Label>
            <Input
              id="sucursal-telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="000 000 0000"
              className="bg-white/5 border-border text-white placeholder:text-muted-foreground"
            />
          </div>

          {/* Activa (solo en edición) */}
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm text-white/80 font-medium">Sucursal activa</p>
                <p className="text-xs text-muted-foreground">Las sucursales inactivas no pueden usarse en ventas</p>
              </div>
              <Switch checked={activa} onCheckedChange={setActiva} />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 mt-1">
            <Button type="button" variant="outline" className="border-border" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold gap-2"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear sucursal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
