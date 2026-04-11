import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TicketData } from './components/TicketImpresion';
import elovniLogo from '@/assets/elovni-logo.png';

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
};

export default function TicketPublicoPage() {
  const [params] = useSearchParams();
  const [data, setData] = useState<TicketData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const encoded = params.get('d');
      if (!encoded) { setError(true); return; }
      const json = decodeURIComponent(escape(atob(encoded)));
      const parsed = JSON.parse(json) as TicketData;
      parsed.fecha = new Date(parsed.fecha);
      setData(parsed);
    } catch {
      setError(true);
    }
  }, [params]);

  const handleSavePDF = () => window.print();

  if (error) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '60px 20px', color: '#555' }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ marginTop: 16, color: '#111' }}>Ticket no válido</h2>
        <p style={{ marginTop: 8 }}>El enlace ha expirado o es incorrecto.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '60px 20px', color: '#999' }}>
        Cargando ticket...
      </div>
    );
  }

  const fecha = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(data.fecha);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f0f0f0; min-height: 100vh; }
        .ticket-wrapper {
          max-width: 400px; margin: 0 auto; padding: 16px 0 40px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .ticket-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
          overflow: hidden;
        }
        .ticket-header {
          background: #101010;
          padding: 28px 24px 20px;
          text-align: center;
        }
        .ticket-logo {
          width: 70px; height: 70px; object-fit: contain; margin-bottom: 8px; margin: 0 auto;
        }
        .ticket-store {
          font-size: 22px; font-weight: 800; letter-spacing: 3px;
          color: #99ff3d;
        }
        .ticket-subtitle {
          font-size: 11px; color: #888; margin-top: 2px; letter-spacing: 1px;
        }
        .ticket-id-badge {
          display: inline-block;
          margin-top: 12px;
          background: #99ff3d;
          color: #000;
          font-size: 11px; font-weight: 700;
          padding: 4px 14px; border-radius: 20px;
          letter-spacing: 1px;
        }
        .ticket-body { padding: 20px 24px; }
        .info-row {
          display: flex; justify-content: space-between; align-items: baseline;
          padding: 6px 0;
          font-size: 13px; color: #444;
          border-bottom: 1px solid #f0f0f0;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #4a4a4a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-weight: 600; color: #111; text-align: right; max-width: 60%; }
        .section-title {
          font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
          color: #353535; margin: 16px 0 8px; font-weight: 700;
        }
        .divider { border: none; border-top: 1px dashed #e0e0e0; margin: 14px 0; }
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table th {
          font-size: 10px; text-transform: uppercase; color: #295e3c;
          padding: 4px 0; text-align: left; font-weight: 600;
        }
        .items-table th:not(:first-child) { text-align: right; }
        .items-table td {
          font-size: 12px; color: #333; padding: 7px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .items-table td:not(:first-child) { text-align: right; }
        .items-table tr:last-child td { border-bottom: none; }
        .producto-name { font-weight: 600; color: #111; }
        .totals-section { padding: 16px 24px; background: #fafafa; }
        .total-row {
          display: flex; justify-content: space-between;
          font-size: 13px; color: #555; padding: 4px 0;
        }
        .total-final {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 10px; padding-top: 10px;
          border-top: 2px solid #0a0a0a;
          font-size: 22px; font-weight: 800; color: #0a0a0a;
        }
        .total-final .amount { color: #0a9e00; }
        .ticket-footer {
          text-align: center; padding: 20px 24px;
          font-size: 12px; color: #999; background: #fff;
          border-top: 1px solid #f0f0f0;
        }
        .save-btn {
          display: block; width: calc(100% - 48px);
          margin: 20px 24px 0;
          padding: 14px;
          background: #0a0a0a; color: #99ff3d;
          border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700; letter-spacing: 0.5px;
          cursor: pointer; text-align: center;
        }
        .save-btn:active { opacity: 0.85; }
        @media print {
          html, body { background: #fff; }
          .ticket-wrapper { padding: 0; max-width: 100%; }
          .ticket-card { border-radius: 0; box-shadow: none; }
          .save-btn { display: none; }
        }
      `}</style>

      <div className="ticket-wrapper">
        <div className="ticket-card">
          {/* Header */}
          <div className="ticket-header">
            <img src={elovniLogo} alt="El Ovni" className="ticket-logo" />
            <div className="ticket-store">EL OVNI</div>
            <div className="ticket-subtitle">{data.sucursal}</div>
            <div className="ticket-id-badge">TICKET #{String(data.ventaId).padStart(6, '0')}</div>
          </div>

          {/* Info */}
          <div className="ticket-body">
            <div className="section-title">Información</div>
            <div className="info-row">
              <span className="info-label">Fecha</span>
              <span className="info-value">{fecha}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Cliente</span>
              <span className="info-value">{data.cliente}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Cajero</span>
              <span className="info-value">{data.cajero}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Método de pago</span>
              <span className="info-value">{METODO_LABEL[data.metodoPago] ?? data.metodoPago}</span>
            </div>

            <hr className="divider" />

            <div className="section-title">Productos</div>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, i) => {
                  const lineTotal = item.precioUnitario * item.cantidad - item.descuento;
                  return (
                    <tr key={i}>
                      <td>
                        <div className="producto-name">{item.nombre}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>${item.precioUnitario.toFixed(2)} c/u</div>
                      </td>
                      <td style={{ color: '#666' }}>{item.cantidad}</td>
                      <td style={{ fontWeight: 700 }}>${lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="totals-section">
            <div className="total-row">
              <span>Subtotal</span>
              <span>${data.subtotal.toFixed(2)}</span>
            </div>
            {data.descuentoGlobal > 0 && (
              <div className="total-row" style={{ color: '#e07b00' }}>
                <span>Descuento</span>
                <span>-${data.descuentoGlobal.toFixed(2)}</span>
              </div>
            )}
            <div className="total-final">
              <span>TOTAL</span>
              <span className="amount">${data.total.toFixed(2)}</span>
            </div>
          </div>

          {data.notas && (
            <div style={{ padding: '12px 24px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
              <div className="section-title">Notas</div>
              <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{data.notas}</p>
            </div>
          )}

          {/* Footer */}
          <div className="ticket-footer">
            <p style={{ fontWeight: 700, color: '#333', marginBottom: 4 }}>¡Gracias por su compra!</p>
            <p>El Ovni — {data.sucursal}</p>
          </div>

          <button className="save-btn" onClick={handleSavePDF}>
            Guardar como PDF
          </button>
          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  );
}
