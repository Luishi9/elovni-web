import { useEffect, useState } from 'react';
import { Loader2, History, Receipt, ChevronDown, ChevronUp, BadgeCheck, XCircle, Clock } from 'lucide-react';
import { clientesApi } from '@/api/clientes.api';
import { Cliente } from '../ClientesPage';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Fragment } from 'react';

const METODO_LABEL: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    otro: 'Otro',
};

const ESTADO_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    completada: {
        label: 'Completada',
        icon: <BadgeCheck size={11} />,
        cls: 'bg-[#99ff3d]/10 text-[#99ff3d] border-[#99ff3d]/30',
    },
    cancelada: {
        label: 'Cancelada',
        icon: <XCircle size={11} />,
        cls: 'bg-red-500/10 text-red-400 border-red-500/30',
    },
    pendiente: {
        label: 'Pendiente',
        icon: <Clock size={11} />,
        cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
    },
};

interface VentaHistorial {
    id: number;
    total: number;
    descuento: number;
    metodo_pago: string;
    estado: string;
    created_at: string;
    sucursales?: { nombre: string };
    venta_detalle: {
        id: number;
        cantidad: number;
        precio_unitario: number;
        subtotal: number;
        productos?: { nombre: string };
    }[];
}

interface Props {
    cliente: Cliente | null;
    onClose: () => void;
}

export default function ClienteHistorialModal({ cliente, onClose }: Props) {
    const [ventas, setVentas] = useState<VentaHistorial[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        if (!cliente) return;
        setVentas([]);
        setExpandedId(null);
        setIsLoading(true);
        clientesApi.getHistorial(cliente.id)
            .then((res) => setVentas(res.data?.data ?? res.data ?? []))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [cliente]);

    const totalGastado = ventas
        .filter((v) => v.estado === 'completada')
        .reduce((acc, v) => acc + Number(v.total), 0);

    return (
        <Dialog open={!!cliente} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <History size={18} className="text-blue-400" />
                        Historial de compras — {cliente?.nombre}
                    </DialogTitle>
                </DialogHeader>

                {/* Summary */}
                {!isLoading && ventas.length > 0 && (
                    <div className="flex gap-4 text-xs">
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-border text-muted-foreground">
                            <span className="text-white font-bold">{ventas.length}</span> compras
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-[#99ff3d]/5 border border-[#99ff3d]/20 text-muted-foreground">
                            Total gastado: <span className="text-[#99ff3d] font-bold">${totalGastado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-6 w-6 animate-spin text-[#99ff3d]" />
                        </div>
                    ) : ventas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                            <Receipt size={32} className="opacity-20" />
                            <p className="text-sm">Este cliente no tiene compras registradas.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 py-1">
                            {ventas.map((v) => {
                                const estado = ESTADO_CONFIG[v.estado] ?? ESTADO_CONFIG.pendiente;
                                const isExpanded = expandedId === v.id;
                                return (
                                    <Fragment key={v.id}>
                                        <div
                                            className="rounded-xl border border-border bg-background/50 cursor-pointer hover:border-border/80 transition-colors"
                                            onClick={() => setExpandedId(isExpanded ? null : v.id)}
                                        >
                                            <div className="flex items-center justify-between px-4 py-3 gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="font-mono text-xs text-muted-foreground shrink-0">
                                                        #{String(v.id).padStart(5, '0')}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(v.created_at).toLocaleDateString('es-MX', {
                                                            day: '2-digit', month: 'short', year: 'numeric',
                                                        })}
                                                    </span>
                                                    {v.sucursales?.nombre && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-border text-muted-foreground hidden sm:inline">
                                                            {v.sucursales.nombre}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-xs text-muted-foreground">{METODO_LABEL[v.metodo_pago] ?? v.metodo_pago}</span>
                                                    <Badge className={`flex items-center gap-1 text-[10px] border ${estado.cls}`}>
                                                        {estado.icon} {estado.label}
                                                    </Badge>
                                                    <span className="font-bold text-[#99ff3d] font-mono text-sm">
                                                        ${Number(v.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    {isExpanded
                                                        ? <ChevronUp size={13} className="text-muted-foreground" />
                                                        : <ChevronDown size={13} className="text-muted-foreground" />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-border px-4 py-3">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="text-muted-foreground border-b border-border">
                                                                <th className="text-left pb-1.5 font-normal">Producto</th>
                                                                <th className="text-right pb-1.5 font-normal">Cant.</th>
                                                                <th className="text-right pb-1.5 font-normal">Precio</th>
                                                                <th className="text-right pb-1.5 font-normal">Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {v.venta_detalle.map((d) => (
                                                                <tr key={d.id} className="border-b border-border/40 last:border-0">
                                                                    <td className="py-1.5 text-foreground/80">{d.productos?.nombre ?? `#${d.id}`}</td>
                                                                    <td className="py-1.5 text-right text-muted-foreground">{d.cantidad}</td>
                                                                    <td className="py-1.5 text-right font-mono text-muted-foreground">
                                                                        ${Number(d.precio_unitario).toFixed(2)}
                                                                    </td>
                                                                    <td className="py-1.5 text-right font-mono text-[#99ff3d]">
                                                                        ${Number(d.subtotal).toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
