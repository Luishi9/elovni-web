import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ExternalLink } from 'lucide-react';
import { TicketData } from './TicketImpresion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface QRTicketModalProps {
  data: TicketData | null;
  open: boolean;
  onClose: () => void;
}

function encodeTicketData(data: TicketData): string {
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
}

export default function QRTicketModal({ data, open, onClose }: QRTicketModalProps) {
  if (!data) return null;

  const encoded = encodeTicketData(data);
  const url = `${window.location.origin}/ticket?d=${encoded}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <QrCode size={18} className="text-[#99ff3d]" />
            Compartir ticket
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            El cliente puede escanear este código QR con su teléfono para ver y guardar el ticket.
          </p>

          {/* QR */}
          <div className="bg-white p-4 rounded-2xl shadow-inner">
            <QRCodeSVG
              value={url}
              size={200}
              bgColor="#ffffff"
              fgColor="#0a0a0a"
              level="M"
              includeMargin={false}
            />
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Ticket #{String(data.ventaId).padStart(6, '0')}</p>
            <p className="text-[11px] text-muted-foreground/60 break-all px-4">{url.slice(0, 60)}…</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border text-muted-foreground hover:text-white"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink size={13} />
            Abrir en nueva pestaña
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
