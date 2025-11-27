
"use client";

import { useState } from "react";
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
import { Building, MapPin, Users, Globe, Edit, Trash2, Loader2 } from "lucide-react";
import { useApp } from "@/context/app-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


type VenueDetailsModalProps = {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDeleteSuccess: () => void;
};

export function VenueDetailsModal({ venue, isOpen, onClose, onEdit, onDeleteSuccess }: VenueDetailsModalProps) {
  const { userRole } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const token = localStorage.getItem('accessToken');
    if (!token) {
        toast({ variant: "destructive", title: "Error", description: "Tu sesión ha expirado." });
        setIsDeleting(false);
        return;
    }

    try {
        const response = await fetch(`http://localhost:44335/api/events/escenarios/${venue.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            toast({
                title: "Escenario Eliminado",
                description: `El escenario "${venue.nombre}" ha sido eliminado exitosamente.`
            });
            onDeleteSuccess();
        } else {
            let errorMessage = "No se pudo eliminar el escenario.";
            if (response.status === 401) errorMessage = "No tienes permiso para realizar esta acción.";
            if (response.status === 404) errorMessage = "El escenario no fue encontrado.";
            toast({ variant: "destructive", title: "Error al Eliminar", description: errorMessage });
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Error de Conexión", description: "No se pudo conectar al servidor." });
    } finally {
        setIsDeleting(false);
    }
  };

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
                <h4 className="font-semibold">Ubicación</h4>
                <p className="text-muted-foreground">{venue.ciudad}, {venue.estado}, {venue.pais}</p>
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

        <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full">
            <div>
              {userRole === 'administrador' && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                   <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" disabled={isDeleting}>
                              {isDeleting ? <Loader2 className="animate-spin mr-2"/> : <Trash2 className="mr-2 h-4 w-4" />}
                              Eliminar
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción eliminará el escenario "{venue.nombre}" permanentemente.
                                    Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              )}
            </div>
            <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
