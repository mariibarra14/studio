
"use client";

import type { ApiEvent } from "@/lib/types";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, Users, Edit, Eye, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MyEventCardProps = {
  event: ApiEvent;
};

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Activo': 'default',
    'Borrador': 'secondary',
    'Cancelado': 'destructive',
    'Pospuesto': 'outline',
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('es', { month: 'short' }),
    };
};

export function MyEventCard({ event }: MyEventCardProps) {
  const dateInfo = formatDate(event.inicio);

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
            <Image
                src={event.imagenUrl || "https://picsum.photos/seed/default-event/600/400"}
                alt={event.nombre}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
            <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm rounded-md px-3 py-2 text-center leading-tight shadow">
                <span className="block font-bold text-xl">{dateInfo.day}</span>
                <span className="block text-xs uppercase font-semibold text-primary">{dateInfo.month}</span>
            </div>
            <Badge 
                variant={statusVariantMap[event.estado] || 'outline'} 
                className="absolute top-3 right-3 capitalize"
            >
                {event.estado}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-bold mb-2 line-clamp-2">{event.nombre}</CardTitle>
        <CardDescription className="flex items-start text-sm text-muted-foreground">
             <MapPin className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
             <span>{event.lugar}</span>
        </CardDescription>
        
        <div className="border-t my-4" />

        <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Localidades:</span>
                <span className="font-mono text-foreground">{event.localidades.length}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Aforo Máximo:</span>
                 <span className="font-mono text-foreground">{event.aforoMaximo.toLocaleString()}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Creado:</span>
                <span className="font-mono text-foreground">{format(new Date(event.createdAt), 'dd/MM/yy')}</span>
            </div>
        </div>

      </CardContent>
      <CardFooter className="p-4 bg-muted/50 flex justify-end gap-2">
         <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver Detalles</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Ver Detalles</TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar Evento</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Editar Evento</TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar Evento</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar Evento</TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}

