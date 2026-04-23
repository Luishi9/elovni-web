import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X, Package } from 'lucide-react';

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { productosApi } from '@/api/productos.api';
import { inventarioApi } from '@/api/inventario.api';
import { useSucursalStore } from '@/store/sucursalStore';
import { useAuthStore } from '@/store/authStore';
import { Producto } from '@/types/producto.types';
import { categoriasApi, Categoria } from '@/api/categorias.api';
import { getImageUrl } from '@/utils/format';

const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  codigo: z.string().optional(),
  categoriaId: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().positive().optional()),
  precioVenta: z.preprocess((val) => Number(val), z.number().positive('Debe ser mayor a 0')),
  precioCompra: z.preprocess((val) => val ? Number(val) : undefined, z.number().positive().optional()),
  unidadMedida: z.string().default('unidad'),
  descripcion: z.string().optional(),
  cantidadInicial: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(0).optional()),
  stockMinimo: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(0).optional()),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  producto?: Producto | null;
}

export function ProductoFormModal({ open, onOpenChange, onSuccess, producto }: ProductoFormModalProps) {
  const { sucursalActiva } = useSucursalStore();
  const { usuario } = useAuthStore();
  const isEditing = !!producto;
  // Fallback: si no hay sucursal activa en el store, usar la primera del usuario
  const sucursalEfectiva = sucursalActiva ?? usuario?.sucursalesDetalle?.[0] ?? null;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tieneExistencias, setTieneExistencias] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar categorías al montar
  useEffect(() => {
    categoriasApi.getAll().then((res) => setCategorias(res.data?.data || [])).catch(() => {});
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      categoriaId: undefined,
      precioVenta: 0,
      precioCompra: undefined,
      unidadMedida: 'unidad',
      descripcion: '',
      cantidadInicial: undefined,
      stockMinimo: undefined,
    },
  });

  // Cargar categorías al montar
  useEffect(() => {
    categoriasApi.getAll().then((res) => setCategorias(res.data?.data || [])).catch(() => {});
  }, []);

  // Rellenar formulario cuando se edita
  useEffect(() => {
    if (open && producto) {
      form.reset({
        nombre: producto.nombre,
        codigo: producto.codigo ?? '',
        categoriaId: producto.categoria_id ?? undefined,
        precioVenta: Number(producto.precio_venta),
        precioCompra: producto.precio_compra ? Number(producto.precio_compra) : undefined,
        unidadMedida: producto.unidad_medida ?? 'unidad',
        descripcion: producto.descripcion ?? '',
        cantidadInicial: undefined,
        stockMinimo: undefined,
      });
      setTieneExistencias(false);
      setImagePreview(getImageUrl(producto.imagen_url) ?? null);
      setSelectedFile(null);
    } else if (open && !producto) {
      form.reset({ nombre: '', codigo: '', categoriaId: undefined, precioVenta: 0, precioCompra: undefined, unidadMedida: 'unidad', descripcion: '', cantidadInicial: undefined, stockMinimo: undefined });
      setTieneExistencias(false);
      setImagePreview(null);
      setSelectedFile(null);
    }
  }, [open, producto]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      
      formData.append('nombre', values.nombre);
      formData.append('precioVenta', values.precioVenta.toString());
      if (values.codigo) formData.append('codigo', values.codigo);
      if (values.categoriaId) formData.append('categoriaId', values.categoriaId.toString());
      if (values.precioCompra !== undefined && values.precioCompra !== null) {
        formData.append('precioCompra', values.precioCompra.toString());
      }
      if (values.unidadMedida) formData.append('unidadMedida', values.unidadMedida);
      if (values.descripcion) formData.append('descripcion', values.descripcion);
      
      if (!isEditing && tieneExistencias && values.cantidadInicial && values.cantidadInicial > 0 && sucursalEfectiva) {
        formData.append('cantidadInicial', values.cantidadInicial.toString());
        formData.append('sucursalId', sucursalEfectiva.id.toString());
        if (values.stockMinimo !== undefined && values.stockMinimo >= 0) {
          formData.append('stockMinimo', values.stockMinimo.toString());
        }
      }

      if (isEditing && tieneExistencias && values.cantidadInicial && values.cantidadInicial > 0 && sucursalEfectiva && producto) {
        await inventarioApi.ajustar({
          productoId: producto.id,
          sucursalId: sucursalEfectiva.id,
          tipo: 'entrada',
          cantidad: values.cantidadInicial,
          notas: 'Entrada manual desde edición de producto',
        });
      }

      if (selectedFile) {
        formData.append('imagen', selectedFile);
      }

      if (isEditing && producto) {
        await productosApi.update(producto.id, formData as any);
      } else {
        await productosApi.create(formData as any);
      }
      
      // Cleanup & Close
      form.reset();
      removeImage();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar el producto', error);
      alert('Hubo un error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-[#99ff3d]">
            {isEditing ? 'Editar Producto' : 'Registrar Producto'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? 'Modifica la información del producto.' : 'Añade un nuevo ítem a tu catálogo global.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Col 1 - Datos principales */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del producto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Zapatillas Galácticas" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código / SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. ZAP-001" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoriaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === 'none' ? undefined : Number(val))}
                        value={field.value ? String(field.value) : 'none'}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Sin categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border border-border text-foreground z-[200]">
                          <SelectItem value="none">Sin categoría</SelectItem>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="precioVenta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Venta *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className="bg-background font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="precioCompra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Compra</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ''} className="bg-background font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="unidadMedida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad de medida</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecciona una unidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border border-border text-foreground z-[200]">
                          <SelectItem value="unidad">Unidad</SelectItem>
                          <SelectItem value="pieza">Pieza</SelectItem>
                          <SelectItem value="par">Par</SelectItem>
                          <SelectItem value="docena">Docena</SelectItem>
                          <SelectItem value="caja">Caja</SelectItem>
                          <SelectItem value="paquete">Paquete</SelectItem>
                          <SelectItem value="rollo">Rollo</SelectItem>
                          <SelectItem value="bolsa">Bolsa</SelectItem>
                          <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                          <SelectItem value="g">Gramo (g)</SelectItem>
                          <SelectItem value="ton">Tonelada (ton)</SelectItem>
                          <SelectItem value="litro">Litro</SelectItem>
                          <SelectItem value="ml">Mililitro (ml)</SelectItem>
                          <SelectItem value="metro">Metro</SelectItem>
                          <SelectItem value="cm">Centímetro (cm)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ── Existencias ── */}
                <div className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={tieneExistencias}
                      onChange={(e) => {
                        setTieneExistencias(e.target.checked);
                        if (!e.target.checked) {
                          form.setValue('cantidadInicial', undefined);
                          form.setValue('stockMinimo', undefined);
                        }
                      }}
                      className="w-4 h-4 accent-[#99ff3d] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Package size={14} className="text-[#99ff3d]" />
                      {isEditing ? 'Registrar movimiento de stock' : 'Este producto tiene existencias (inventario)'}
                    </span>
                  </label>

                  {tieneExistencias && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <FormField
                        control={form.control}
                        name="cantidadInicial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isEditing ? 'Cantidad a añadir *' : 'Cantidad inicial *'}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                className="bg-background font-mono border-[#99ff3d]/50 focus-visible:ring-[#99ff3d]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stockMinimo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Ej. 5"
                                {...field}
                                value={field.value ?? ''}
                                className="bg-background font-mono"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Col 2 - Imagen y Extras */}
              <div className="space-y-4 flex flex-col">
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detalles sobre el producto..." 
                          className="resize-none bg-background h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex-1 flex flex-col">
                  <FormLabel className="mb-2">Fotografía (Opcional)</FormLabel>
                  <div className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-background/50 hover:bg-background transition-colors min-h-[160px]">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-white transition-colors">
                        <Upload size={28} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">Subir imagen</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Mensaje de Info Stock */}
            {tieneExistencias && form.watch('cantidadInicial') ? (
              <div className="bg-[#99ff3d]/10 border border-[#99ff3d]/20 rounded-lg p-3 text-sm text-[#99ff3d]">
                <p>
                  {isEditing
                    ? <>Se registrará una <strong>Entrada de {form.watch('cantidadInicial')}</strong> unidades en la sucursal <strong>{sucursalEfectiva?.nombre || 'actual'}</strong>.</>
                    : <>Se registrará una <strong>Entrada Inicial de {form.watch('cantidadInicial')}</strong> unidades en la sucursal <strong>{sucursalEfectiva?.nombre || 'actual'}</strong>.</>}
                  {form.watch('stockMinimo') ? ` Stock mínimo: ${form.watch('stockMinimo')} uds.` : ''}
                </p>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#99ff3d] hover:bg-[#7fe62e] text-black font-semibold shadow-[0_0_15px_rgba(153,255,61,0.2)]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  isEditing ? 'Guardar Cambios' : 'Guardar Producto'
                )}
              </Button>
            </div>
          </form>
        </Form>

      </DialogContent>
    </Dialog>
  );
}