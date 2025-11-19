
"use client";

import { MockBooking } from "@/lib/mock-data";
import { Ticket, Calendar, MapPin, QrCode } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

type TicketStubProps = {
  booking: MockBooking;
  onSelect: (booking: MockBooking) => void;
};

const statusColors = {
    'Confirmed': 'bg-green-500',
    'Pending Payment': 'bg-yellow-500',
    'Cancelled': 'bg-red-500'
};

const statusTextMap: { [key in MockBooking['status']]: string } = {
    'Confirmed': 'Confirmado',
    'Pending Payment': 'Pago Pendiente',
    'Cancelled': 'Cancelado'
};

export function TicketStub({ booking, onSelect }: TicketStubProps) {
  return (
    <div 
        className="bg-card shadow-lg rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-2"
        onClick={() => onSelect(booking)}
    >
      <div className="relative h-40 w-full">
        <Image
          src={booking.event.image.imageUrl}
          alt={booking.event.image.description}
          data-ai-hint={booking.event.image.imageHint}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold">{booking.event.name}</h3>
        </div>
      </div>

      <div className="flex-grow p-5">
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{booking.event.date}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4" />
          <span>{booking.event.location}</span>
        </div>
      </div>
      
      <div className="border-t-2 border-dashed border-background-muted/50 relative flex items-stretch bg-muted/40">
        <div className="absolute -top-4 left-0 h-8 w-8 rounded-full bg-background transform -translate-y-1/2"></div>
        <div className="absolute -bottom-4 left-0 h-8 w-8 rounded-full bg-background transform translate-y-1/2"></div>
        
        <div className="w-16 bg-secondary flex items-center justify-center">
            <Ticket className="h-8 w-8 text-secondary-foreground transform -rotate-45" />
        </div>
        
        <div className="flex-grow p-4 flex justify-between items-center">
            <div>
                <p className="text-xs text-muted-foreground">Categoría</p>
                <p className="font-bold text-sm">{booking.tier.name}</p>
            </div>
            
            <div className="text-right">
                <p className="text-xs text-muted-foreground">Asiento</p>
                <p className="font-bold text-sm">{booking.seat}</p>
            </div>
        </div>
      </div>

      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${statusColors[booking.status]}`}></div>
            <span className="text-sm font-medium">{statusTextMap[booking.status]}</span>
        </div>
        <QrCode className="h-8 w-8 text-foreground" />
      </div>
    </div>
  );
}
