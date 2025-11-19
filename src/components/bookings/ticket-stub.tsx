
"use client";

import { MockBooking } from "@/lib/mock-data";
import { Ticket, Calendar, MapPin } from "lucide-react";
import Image from "next/image";

type TicketStubProps = {
  booking: MockBooking;
  onSelect: (booking: MockBooking) => void;
};

export function TicketStub({ booking, onSelect }: TicketStubProps) {
  return (
    <div 
        className="bg-card shadow-lg rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-2 group"
        onClick={() => onSelect(booking)}
    >
      <div className="relative h-40 w-full">
        <Image
          src={booking.event.image.imageUrl}
          alt={booking.event.image.description}
          data-ai-hint={booking.event.image.imageHint}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
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
      
      <div className="border-t-2 border-dashed border-muted relative flex items-center bg-muted/20">
         <div className="absolute -top-3.5 left-0 w-7 h-7 rounded-full bg-background"></div>
         <div className="absolute -top-3.5 right-0 w-7 h-7 rounded-full bg-background"></div>

        <div className="flex-grow p-4 flex justify-between items-center text-center">
            <div>
                <p className="text-xs text-muted-foreground">Categoría</p>
                <p className="font-bold text-lg">{booking.tier.name}</p>
            </div>
            <div className="h-10 border-l border-dashed border-muted-foreground/50"></div>
            <div>
                <p className="text-xs text-muted-foreground">Asiento</p>
                <p className="font-bold text-lg">{booking.seat.split(',')[1]?.trim() || booking.seat}</p>
            </div>
            <div className="h-10 border-l border-dashed border-muted-foreground/50"></div>
             <div>
                <p className="text-xs text-muted-foreground">Fila</p>
                <p className="font-bold text-lg">{booking.seat.split(',')[0]?.trim() || 'N/A'}</p>
            </div>
        </div>
      </div>
    </div>
  );
}
