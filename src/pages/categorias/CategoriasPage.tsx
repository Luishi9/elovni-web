import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';

import { categoriasApi, Categoria } from '@/api/categorias.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nombreError, setNombreError] = useState('');

  // Confirmar eliminar
  const [eliminarItem, setEliminarItem] = useState<Categoria | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategorias = async () => {
    try {
      setIsLoading(true);
      const res = await categoriasApi.getAll();
      setCategorias(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategorias(); }, []);

  const abrirCrear = () => {
    setEditando(null);
    setNombre('');
    setNombreError('');
    setModalOpen(true);
  };

  const abrirEditar = (cat: Categoria) => {
    setEditando(cat);
    setNombre(cat.nombre);
    setNombreError('');
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) { setNombreError('El nombre es requerido.'); return; }
    try {
      setIsSaving(true);
      if (editando) {
        await categoriasApi.update(editando.id, { nombre: nombre.trim() });
      } else {
        await categoriasApi.create({ nombre: nombre.trim() });
      }
      setModalOpen(false);
      fetchCategorias();
    } catch (e) {
      console.error(e);
      alert('Error al guardar la categoría.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!eliminarItem) return;
    try {
      setIsDeleting(true);
      await categoriasApi.remove(eliminarItem.id);
      setEliminarItem(null);
      fetchCategorias();
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar la categoría.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Tag className="text-[#99ff3d]" size={32} />
            Categorías
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organiza tus productos por categoría.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button
            onClick={abrirCrear}
            className="h-10 px-4 bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold shadow-[0_0_15px_rgba(153,255,61,0.2)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </motion.div>
      </div>

      {/* TABLA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="bg-background/50">#</TableHead>
              <TableHead className="bg-background/50">Nombre</TableHead>
              <TableHead className="text-center bg-background/50">Productos</TableHead>
              <TableHead className="text-center bg-background/50">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#99ff3d]" />
                  <p className="mt-2 text-xs text-muted-foreground">Cargando categorías...</p>
                </TableCell>
              </TableRow>
            ) : categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                  <Tag size={32} className="mx-auto mb-2 opacity-20" />
                  <p>No hay categorías aún. ¡Crea la primera!</p>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {categorias.map((cat, i) => (
                  <motion.tr
                    key={cat.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="text-muted-foreground text-xs font-mono">{cat.id}</TableCell>
                    <TableCell className="font-medium text-foreground">{cat.nombre}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-mono text-[#99ff3d]">
                        {cat._count?.productos ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => abrirEditar(cat)}
                          title="Editar"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-[#99ff3d] hover:bg-[#99ff3d]/10 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setEliminarItem(cat)}
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
      </motion.div>

      {/* MODAL CREAR / EDITAR */}
      <Dialog open={modalOpen} onOpenChange={(v) => { if (!v) setModalOpen(false); }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-[#99ff3d] text-xl font-bold">
              {editando ? 'Editar categoría' : 'Nueva categoría'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editando ? 'Modifica el nombre de la categoría.' : 'Ingresa el nombre de la nueva categoría.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre *</label>
            <Input
              autoFocus
              placeholder="Ej. Electrónica, Ropa, Alimentos..."
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setNombreError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGuardar(); }}
              className="bg-background"
            />
            {nombreError && <p className="text-red-400 text-xs mt-1">{nombreError}</p>}
          </div>

          <DialogFooter className="gap-2 flex justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>
              <X size={14} className="mr-1" /> Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={isSaving}
              className="bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold"
            >
              {isSaving
                ? <Loader2 size={14} className="mr-1 animate-spin" />
                : <Check size={14} className="mr-1" />}
              {editando ? 'Guardar cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAR ELIMINAR */}
      <Dialog open={!!eliminarItem} onOpenChange={(v) => { if (!v) setEliminarItem(null); }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">¿Eliminar categoría?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Se eliminará <span className="text-white font-semibold">{eliminarItem?.nombre}</span>.
              Los productos asignados quedarán sin categoría.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex justify-end pt-2">
            <Button variant="outline" onClick={() => setEliminarItem(null)} disabled={isDeleting}>
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
