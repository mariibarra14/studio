
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Venue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Building, MapPin, Users } from "lucide-react";

type VenueCardProps = {
  venue: Venue;
  onVenueClick: (venue: Venue) => void;
};

export function VenueCard({ venue, onVenueClick }: VenueCardProps) {
  return (
    <Card
      className="flex flex-col h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      onClick={() => onVenueClick(venue)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
            <CardTitle className="line-clamp-2">{venue.nombre}</CardTitle>
            <Badge variant={venue.activo ? "default" : "destructive"} className="shrink-0">
                {venue.activo ? "Activo" : "Inactivo"}
            </Badge>
        </div>
        <CardDescription className="flex items-center pt-1">
            <MapPin className="mr-2 h-4 w-4" />
            <span className="truncate">{venue.ubicacion}, {venue.ciudad}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-4">
          {venue.descripcion}
        </p>
      </CardContent>
      <CardFooter>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          <span>
            Capacidad: {venue.capacidadTotal > 0 ? `${venue.capacidadTotal.toLocaleString()} personas` : 'No especificada'}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
