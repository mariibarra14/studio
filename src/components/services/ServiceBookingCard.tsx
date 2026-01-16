
"use client";

import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MyServiceBooking } from "@/lib/types";

type ServiceBookingCardProps = {
  booking: MyServiceBooking;
  onSelect: (booking: MyServiceBooking) => void;
};

export function ServiceBookingCard({ booking, onSelect }: ServiceBookingCardProps) {
  const now = new Date();
  const endDate = new Date(booking.fechaFin);
  const isActive = endDate >= now;

  return (
    <Card 
      className="flex flex-col h-full overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
      onClick={() => onSelect(booking)}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full">
          {booking.servicePhoto && booking.servicePhoto !== 'string' ? (
            <Image
              src={booking.servicePhoto}
              alt={booking.serviceName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <p className="text-muted-foreground">Sin Imagen</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className="absolute top-3 right-3 capitalize"
          >
            {isActive ? "Activo" : "Finalizado"}
          </Badge>
          <div className="absolute bottom-4 left-4 text-white">
            <CardTitle className="text-xl font-bold leading-tight drop-shadow-md">{booking.serviceName}</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start text-sm text-muted-foreground mb-3">
          <Building className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
          <span className="font-semibold text-foreground/80 mr-1.5">Evento:</span>
          <span className="truncate">{booking.eventName}</span>
        </div>
        <div className="flex items-start text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
          <span className="font-semibold text-foreground/80 mr-1.5">Inicia:</span>
          <span>{format(new Date(booking.fechaInicio), "dd MMM, yyyy 'a las' h:mm a", { locale: es })}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex items-center">
         <Clock className="mr-1.5 h-3 w-3" />
         <span>Finaliza el {format(endDate, "dd/MM/yyyy", { locale: es })}</span>
      </CardFooter>
    </Card>
  );
}
