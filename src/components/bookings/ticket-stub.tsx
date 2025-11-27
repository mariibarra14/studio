
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Ticket, Hash } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ApiBooking } from "@/lib/types";

type TicketStubProps = {
  booking: ApiBooking;
  onSelect: (booking: ApiBooking) => void;
};

const getEstadoDisplay = (estado: string) => {
  const estados: { [key: string]: string } = {
    'Hold': 'Por Pagar',
    'Confirmed': 'Confirmada',
    'Cancelled': 'Cancelada',
    'Expired': 'Expirada'
  };
  return estados[estado] || estado;
};

const getEstadoColor = (estado: string) => {
  const colores: { [key: string]: string } = {
    'Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Confirmed': 'bg-green-100 text-green-800 border-green-200',
    'Cancelled': 'bg-red-100 text-red-800 border-red-200',
    'Expired': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colores[estado] || 'bg-gray-100 text-gray-800';
};

export function TicketStub({ booking, onSelect }: TicketStubProps) {
  const estadoDisplay = getEstadoDisplay(booking.estado);
  const estadoColor = getEstadoColor(booking.estado);

  return (
    <div
      className="bg-card shadow-lg rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-2 group border"
      onClick={() => onSelect(booking)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              Reserva #{booking.reservaId.substring(0, 8)}
            </h3>
          </div>
          <Badge variant="outline" className={cn("text-xs capitalize", estadoColor)}>
            {estadoDisplay}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span>Evento ID: {booking.eventId.substring(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Creada: {format(new Date(booking.creadaEn), "dd/MM/yyyy", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Expira: {format(new Date(booking.expiraEn), "dd/MM/yyyy", { locale: es })}</span>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-muted relative flex items-center bg-muted/20">
        <div className="absolute -top-3.5 left-0 w-7 h-7 rounded-full bg-background" />
        <div className="absolute -top-3.5 right-0 w-7 h-7 rounded-full bg-background" />

        <div className="flex-grow p-4 flex justify-between items-center text-center">
          <div>
            <p className="text-xs text-muted-foreground">Asientos</p>
            <p className="font-bold text-lg">{booking.asientos.length}</p>
          </div>
          <div className="h-10 border-l border-dashed border-muted-foreground/50" />
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold text-lg">${booking.precioTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
