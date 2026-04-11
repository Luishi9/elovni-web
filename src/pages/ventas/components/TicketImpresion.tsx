import { forwardRef } from 'react';
import logoImage from '@/assets/elovni-logo.png';

export interface TicketData {
  ventaId: number;
  fecha: Date;
  sucursal: string;
  cajero: string;
  cliente: string;
  metodoPago: string;
  items: {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
  }[];
  subtotal: number;
  descuentoGlobal: number;
  total: number;
  notas?: string;
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
};

export function buildTicketHtml(data: TicketData): string {
  const fecha = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(data.fecha);

  const logoUrl = `${window.location.origin}${logoImage}`;

  const rows = data.items.map((item) => {
    const lineTotal = item.precioUnitario * item.cantidad - item.descuento;
    return `
      <tr>
        <td style="padding:3px 2px;font-weight:600;">${item.nombre}</td>
        <td style="padding:3px 2px;text-align:center;">${item.cantidad}</td>
        <td style="padding:3px 2px;text-align:right;">$${item.precioUnitario.toFixed(2)}</td>
        <td style="padding:3px 2px;text-align:right;">$${lineTotal.toFixed(2)}</td>
      </tr>
      ${item.descuento > 0 ? `<tr><td colspan="4" style="text-align:right;font-size:9px;color:#666;">Desc: -$${item.descuento.toFixed(2)}</td></tr>` : ''}
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket #${data.ventaId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Courier New", Courier, monospace;
      font-size: 11px;
      color: #000;
      background: #fff;
      width: 80mm;
      padding: 4mm 6mm 8mm;
    }
    @page { margin: 0; size: 80mm auto; }
    @media print { body { width: 80mm; } }
    .center { text-align: center; }
    .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
    .divider-solid { border: none; border-top: 1px solid #000; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 10px; text-align: left; padding: 2px; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:8px;">
    <img src="${logoUrl}" width="48" height="48" style="object-fit:contain;" />
    <div style="font-size:16px;font-weight:bold;letter-spacing:2px;margin-top:4px;">EL OVNI</div>
    <div style="font-size:10px;color:#555;">Punto de Venta</div>
    <div style="font-size:10px;color:#555;">${data.sucursal}</div>
  </div>

  <hr class="divider" />

  <div class="row"><strong>TICKET #${String(data.ventaId).padStart(6, '0')}</strong></div>
  <div style="color:#333;">${fecha}</div>
  <div class="row" style="margin-top:2px;"><span>Cajero:</span><span>${data.cajero}</span></div>
  <div class="row"><span>Cliente:</span><span>${data.cliente}</span></div>
  <div class="row"><span>Pago:</span><span>${METODO_LABEL[data.metodoPago] ?? data.metodoPago}</span></div>

  <hr class="divider" />

  <table>
    <thead>
      <tr>
        <th>PRODUCTO</th>
        <th style="text-align:center;">CANT</th>
        <th style="text-align:right;">PRECIO</th>
        <th style="text-align:right;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      <tr><td colspan="4"><hr class="divider-solid" /></td></tr>
      ${rows}
    </tbody>
  </table>

  <hr class="divider" />

  <div class="row"><span>Subtotal:</span><span>$${data.subtotal.toFixed(2)}</span></div>
  ${data.descuentoGlobal > 0 ? `<div class="row" style="color:#555;"><span>Descuento:</span><span>-$${data.descuentoGlobal.toFixed(2)}</span></div>` : ''}
  <hr class="divider-solid" />
  <div class="row" style="font-size:15px;font-weight:bold;">
    <span>TOTAL:</span><span>$${data.total.toFixed(2)}</span>
  </div>

  ${data.notas ? `<hr class="divider" /><div style="font-weight:bold;">Notas:</div><div style="color:#444;">${data.notas}</div>` : ''}

  <hr class="divider" />
  <div class="center" style="color:#555;">
    <div>¡Gracias por su compra!</div>
    <div style="margin-top:2px;">El Ovni — ${data.sucursal}</div>
  </div>
</body>
</html>`;
}

export const TicketImpresion = forwardRef<HTMLDivElement, { data: TicketData | null }>(
  (_props, ref) => <div ref={ref} />,
);
TicketImpresion.displayName = 'TicketImpresion';
