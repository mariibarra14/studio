
"use client";

import type { ApiEvent } from "@/lib/types";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin, Tag } from "lucide-react";
import { getCategoryNameById } from "@/lib/categories";

type MyEventCardProps = {
  event: ApiEvent;
  onEventClick: (eventId: string) => void;
};

export function MyEventCard({ event, onEventClick }: MyEventCardProps) {
  const startDate = new Date(event.inicio);
  const createdDate = new Date(event.createdAt);
  
  const getDisplayStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Activo': 'Activo',
      'Draft': 'Activo',
    };
    return statusMap[status] || status;
  };

  const displayStatus = getDisplayStatus(event.estado);
  const categoryName = getCategoryNameById(event.categoriaId);

  return (
    <Card 
      className="flex flex-col h-full overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
      onClick={() => onEventClick(event.id)}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full">
            {event.imagenUrl ? (
                <Image
                    src={event.imagenUrl}
                    alt={event.nombre}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/20">
                    <p className="text-center font-bold text-primary p-4">{event.nombre}</p>
                </div>
            )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <Badge 
            variant={event.estado === 'Activo' || event.estado === 'Draft' ? 'default' : 'secondary'}
            className="absolute top-3 right-3 capitalize"
          >
            {displayStatus}
          </Badge>
          <div className="absolute bottom-4 left-4 text-white">
            <CardTitle className="text-xl font-bold leading-tight drop-shadow-md">{event.nombre}</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Calendar className="mr-2 h-4 w-4" />
            <span className="font-semibold">{format(startDate, "EEEE, d 'de' LLLL", { locale: es })}</span>
            <span className="mx-1.5">&bull;</span>
            <span>{format(startDate, "h:mm a", { locale: es })}</span>
          </div>
          <CardDescription className="flex items-start text-sm text-muted-foreground">
             <MapPin className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
             <span>{event.lugar}</span>
          </CardDescription>
        </div>
        
        <div className="border-t my-4" />

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-2 h-4 w-4 text-primary/70"/>
            <span className="font-semibold text-foreground/80 mr-1.5">Aforo:</span>
            <span>{(event.aforoMaximo || 0).toLocaleString()}</span>
          </div>
           <div className="flex items-center text-muted-foreground">
            <Tag className="mr-2 h-4 w-4 text-primary/70"/>
            <span className="font-semibold text-foreground/80 mr-1.5">Categoría:</span>
            <span>{categoryName}</span>
          </div>
          <div className="col-span-2 flex items-center text-muted-foreground text-xs pt-2">
            <span className="font-semibold text-foreground/70 mr-1">Creado:</span>
            <span>{format(createdDate, "dd/MM/yyyy")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
