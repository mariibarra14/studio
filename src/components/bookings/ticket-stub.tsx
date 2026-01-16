
"use client";

import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { Calendar, Clock, Ticket, Hash, MapPin, Tag, Armchair } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ApiBooking } from "@/lib/types";
import Image from "next/image";
import { useApp } from "@/context/app-context";
import { useTranslation } from "react-i18next";

type TicketStubProps = {
  booking: ApiBooking;
  onSelect: (booking: ApiBooking) => void;
};

const getEstadoReal = (estado: string, expiraEn: string): string => {
  if (estado === 'Hold' && new Date(expiraEn) < new Date()) {
    return 'Expired';
  }
  return estado;
};

const getEstadoColor = (estado: string, expiraEn?: string) => {
  const estadoReal = expiraEn ? getEstadoReal(estado, expiraEn) : estado;
  const colores: { [key: string]: string } = {
    'Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Confirmada': 'bg-green-100 text-green-800 border-green-200',
    'Expired': 'bg-red-100 text-red-800 border-red-200'
  };
  return colores[estadoReal] || 'bg-gray-100 text-gray-800';
};

export function TicketStub({ booking, onSelect }: TicketStubProps) {
  const { currency, language } = useApp();
  const { t } = useTranslation();

  const getEstadoDisplay = (estado: string, expiraEn?: string) => {
      const estadoReal = expiraEn ? getEstadoReal(estado, expiraEn) : estado;
      const key = `bookings.status_${estadoReal.toLowerCase()}`;
      return t(key, { defaultValue: estadoReal });
  };
  
  const estadoDisplay = getEstadoDisplay(booking.estado, booking.expiraEn);
  const estadoColor = getEstadoColor(booking.estado, booking.expiraEn);
  const seatLabels = booking.asientos.map(a => a.label).join(', ');

  const productsTotal = booking.complementaryProducts?.reduce((sum, p) => sum + p.precio, 0) || 0;
  const grandTotal = booking.precioTotal + productsTotal;
  
  const locale = language === 'es' ? es : enUS;

  return (
    <div
      className="bg-card shadow-lg rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-2 group border"
      onClick={() => onSelect(booking)}
    >
      <div className="relative aspect-video w-full">
        {booking.eventoImagen ? (
          <Image 
            src={booking.eventoImagen} 
            alt={booking.eventoNombre || 'Imagen del evento'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary">
            <p className="text-center font-bold text-white p-4">{booking.eventoNombre}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <Badge variant="outline" className={cn("absolute top-3 right-3 text-xs capitalize", estadoColor)}>
            {estadoDisplay}
        </Badge>
        <div className="absolute bottom-3 left-3 text-white">
          <h3 className="text-lg font-bold leading-tight drop-shadow-md">{booking.eventoNombre}</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Tag className="h-4 w-4 mr-2" />
          <span>{t(`categories.${booking.eventoCategoriaNombre}`, { defaultValue: booking.eventoCategoriaNombre })}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{booking.escenarioNombre || t('bookings.ticket_stub.loading')}</span>
        </div>
         <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{t('bookings.ticket_stub.starts')}: {booking.eventoInicio ? format(new Date(booking.eventoInicio), "dd/MM/yyyy", { locale }) : 'N/A'}</span>
        </div>
         <div className="flex items-center text-sm text-muted-foreground">
          <Armchair className="h-4 w-4 mr-2" />
          <span className="truncate" title={seatLabels}>
            {booking.asientos.length} {t('bookings.ticket_stub.seats')}: {seatLabels || 'N/A'}
          </span>
        </div>
      </div>


      <div className="border-t-2 border-dashed border-muted relative flex items-center bg-muted/20 mt-auto">
        <div className="absolute -top-3.5 left-0 w-7 h-7 rounded-full bg-background" />
        <div className="absolute -top-3.5 right-0 w-7 h-7 rounded-full bg-background" />

        <div className="flex-grow p-4 flex justify-between items-center text-center">
          <div>
            <p className="text-xs text-muted-foreground">{t('bookings.ticket_stub.seats')}</p>
            <p className="font-bold text-lg">{booking.asientos.length}</p>
          </div>
          <div className="h-10 border-l border-dashed border-muted-foreground/50" />
          <div>
            <p className="text-xs text-muted-foreground">{t('bookings.ticket_stub.total')}</p>
            <p className="font-bold text-lg">{formatCurrency(grandTotal, currency, language)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
