import { useEffect, useState } from 'react';
import { Loader2, User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { usuariosApi, sucursalesApi, Usuario } from '@/api/usuarios.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Props {
  open: boolean;
  usuario: Usuario | null;
  onClose: () => void;
  onSaved: () => void;
}

const ROLES = [
  { id: 1, nombre: 'admin', label: 'Admin' },
  { id: 2, nombre: 'vendedor', label: 'Vendedor' },
  { id: 3, nombre: 'operador', label: 'Operador' },
];

export default function UsuarioFormModal({ open, usuario, onClose, onSaved }: Props) {
  const isEdit = !!usuario;

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState<string>('2');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [sucursales, setSucursales] = useState<{ id: number; nombre: string }[]>([]);
  const [sucursalesAsignadas, setSucursalesAsignadas] = useState<number[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  // Cargar sucursales disponibles
  useEffect(() => {
    if (!open) return;
    setLoadingSucursales(true);
    sucursalesApi.getAll()
      .then((res) => setSucursales(res.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoadingSucursales(false));
  }, [open]);

  // Inicializar form
  useEffect(() => {
    if (open) {
      setNombre(usuario?.nombre ?? '');
      setEmail(usuario?.email ?? '');
      setPassword('');
      setErrors({});
      const rolActual = ROLES.find((r) => r.nombre === usuario?.roles?.nombre);
      setRolId(String(rolActual?.id ?? 2));
      setSucursalesAsignadas(
        usuario?.usuarios_sucursales?.map((us) => us.sucursales.id) ?? [],
      );
    }
  }, [open, usuario]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!email.trim()) e.email = 'El correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Correo inválido';
    if (!isEdit && !password) e.password = 'La contraseña es requerida';
    if (!isEdit && password && password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (isEdit && password && password.length < 8) e.password = 'Mínimo 8 caracteres';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: nombre.trim(),
        email: email.trim(),
        rolId: Number(rolId),
      };
      if (password) payload.password = password;

      if (isEdit) {
        await usuariosApi.update(usuario!.id, payload);
        // Sincronizar sucursales
        const actuales = usuario!.usuarios_sucursales?.map((us) => us.sucursales.id) ?? [];
        for (const sid of sucursalesAsignadas) {
          if (!actuales.includes(sid)) {
            await usuariosApi.asignarSucursal(usuario!.id, sid);
          }
        }
        for (const sid of actuales) {
          if (!sucursalesAsignadas.includes(sid)) {
            await usuariosApi.removerSucursal(usuario!.id, sid);
          }
        }
      } else {
        const res = await usuariosApi.create(payload as any);
        const nuevoId = res.data?.data?.id ?? res.data?.id;
        if (nuevoId) {
          for (const sid of sucursalesAsignadas) {
            await usuariosApi.asignarSucursal(nuevoId, sid);
          }
        }
      }
      onSaved();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar';
      setErrors({ general: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSucursal = (id: number) => {
    setSucursalesAsignadas((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <ShieldCheck size={18} className="text-[#99ff3d]" />
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
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
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nombre</Label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
                className="pl-8 bg-background/50 border-border"
              />
            </div>
            {errors.nombre && <p className="text-xs text-red-400">{errors.nombre}</p>}
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

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">
              {isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            </Label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
                className="pl-8 bg-background/50 border-border"
              />
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Rol */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Rol</Label>
            <Select value={rolId} onValueChange={setRolId}>
              <SelectTrigger className="bg-background/50 border-border">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground z-[200]">
                {ROLES.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sucursales */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Sucursales asignadas</Label>
            {loadingSucursales ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" /> Cargando…
              </div>
            ) : sucursales.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay sucursales disponibles</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sucursales.map((s) => {
                  const activa = sucursalesAsignadas.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSucursal(s.id)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        activa
                          ? 'bg-[#99ff3d]/15 border-[#99ff3d]/40 text-[#99ff3d]'
                          : 'bg-white/5 border-border text-muted-foreground hover:border-[#99ff3d]/30'
                      }`}
                    >
                      {s.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
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
              {isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
