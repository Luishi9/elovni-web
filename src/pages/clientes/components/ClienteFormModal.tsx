import { useEffect, useState } from 'react';
import { Loader2, User, Phone, Mail, MapPin } from 'lucide-react';
import { clientesApi } from '@/api/clientes.api';
import { Cliente } from '../ClientesPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClienteFormModal({ open, cliente, onClose, onSaved }: Props) {
  const isEdit = !!cliente;
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setNombre(cliente?.nombre ?? '');
      setTelefono(cliente?.telefono ?? '');
      setEmail(cliente?.email ?? '');
      setDireccion(cliente?.direccion ?? '');
      setErrors({});
    }
  }, [open, cliente]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Correo inválido';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
      };
      if (isEdit) {
        await clientesApi.update(cliente!.id, payload);
      } else {
        await clientesApi.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message ?? 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <User size={18} className="text-[#99ff3d]" />
            {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
          {errors.general && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {errors.general}
            </p>
          )}

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">
              Nombre <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo del cliente"
                className="pl-8 bg-background/50 border-border"
              />
            </div>
            {errors.nombre && <p className="text-xs text-red-400">{errors.nombre}</p>}
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Teléfono</Label>
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 555-123-4567"
                className="pl-8 bg-background/50 border-border"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Correo electrónico</Label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="pl-8 bg-background/50 border-border"
              />
            </div>
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Dirección */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Dirección</Label>
            <div className="relative">
              <MapPin size={13} className="absolute left-3 top-3 text-muted-foreground" />
              <textarea
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, colonia, ciudad…"
                rows={2}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#99ff3d]/30 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" className="border-border" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold gap-2"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
