
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Venue } from "@/lib/types";
import { Button } from "../ui/button";
import { Building, MapPin, Users, Globe } from "lucide-react";

type VenueDetailsModalProps = {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
};

export function VenueDetailsModal({ venue, isOpen, onClose }: VenueDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
             <Building className="h-6 w-6 text-primary" />
             {venue.nombre}
          </DialogTitle>
          <DialogDescription>
            Información detallada del escenario.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Descripción</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {venue.descripcion || "No hay descripción disponible."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h4 className="font-semibold">Dirección</h4>
                <p className="text-muted-foreground">{venue.ubicacion}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h4 className="font-semibold">Ciudad/Estado</h4>
                <p className="text-muted-foreground">{venue.ciudad}, {venue.estado}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h4 className="font-semibold">Capacidad</h4>
                <p className="text-muted-foreground">
                  {venue.capacidadTotal > 0 ? `${venue.capacidadTotal.toLocaleString()} personas` : 'No especificada'}
                </p>
              </div>
            </div>
             <div className="flex items-center gap-3">
                <h4 className="font-semibold">Estado:</h4>
                <Badge variant={venue.activo ? "default" : "destructive"}>
                  {venue.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
