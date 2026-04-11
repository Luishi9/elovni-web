export interface VentaItem {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  total: number;
  descuento: number;
  metodo_pago: string;
  estado: string;
  created_at: string;
  clientes?: { nombre: string };
  usuarios?: { nombre: string };
  sucursales?: { nombre: string };
  venta_detalle: {
    id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    productos?: { nombre: string };
  }[];
}
