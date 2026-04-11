export interface Producto {
  id: number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  precio_venta: number;
  precio_compra?: number;
  unidad_medida: string;
  imagen_url?: string;
  activo: boolean;
  categoria_id?: number;
  proveedor_id?: number;
  categorias?: { nombre: string };
}

export interface CreateProductoPayload {
  nombre: string;
  precioVenta: number;
  precioCompra?: number;
  categoriaId?: number;
  descripcion?: string;
  codigo?: string;
  unidadMedida?: string;
  imagen?: File;
  cantidadInicial?: number;
  sucursalId?: number;
}

export interface ItemInventario {
  id: number;
  cantidad: number;
  stock_minimo: number;
  stock_maximo?: number;
  productos: Pick<Producto, 'id' | 'codigo' | 'nombre' | 'imagen_url' | 'precio_venta' | 'unidad_medida'>;
}
