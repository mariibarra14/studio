
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Users, MapPin, Tag, FileText, Building, AlertCircle, Clock, Link as LinkIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ApiEvent, Venue } from "@/lib/types";

type MyEventDetailsModalProps = {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
};

type DetailedEvent = ApiEvent & {
  venue?: Venue;
};

export function MyEventDetailsModal({ eventId, isOpen, onClose }: MyEventDetailsModalProps) {
  const [details, setDetails] = useState<DetailedEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Tu sesión ha expirado.");
      setIsLoading(false);
      return;
    }

    try {
      const eventRes = await fetch(`http://localhost:44335/api/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!eventRes.ok) throw new Error("No se pudo cargar el evento.");
      const eventData: ApiEvent = await eventRes.json();

      let venueData: Venue | undefined = undefined;
      if (eventData.escenarioId) {
        const venueRes = await fetch(`http://localhost:44335/api/events/escenarios/${eventData.escenarioId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (venueRes.ok) {
          venueData = await venueRes.json();
        }
      }

      setDetails({ ...eventData, venue: venueData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, fetchDetails]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setDetails(null);
      setIsLoading(true);
      setError(null);
    }, 300);
  };
  
  const formatDate = (dateString: string) => format(new Date(dateString), "EEEE, d 'de' LLLL 'de' yyyy, h:mm a", { locale: es });

  const renderContent = () => {
    if (isLoading) {
      return <DetailsViewSkeleton />;
    }

    if (error || !details) {
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al Cargar Detalles</AlertTitle>
            <AlertDescription>{error || "No se encontró el evento."}</AlertDescription>
          </Alert>
          <Button onClick={fetchDetails} className="mt-6">Reintentar</Button>
        </div>
      );
    }

    return (
      <>
        <div className="relative h-64 w-full">
            <Image
                src={details.imagenUrl || "https://picsum.photos/seed/event-detail/800/400"}
                alt={details.nombre}
                fill
                className="object-cover rounded-t-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <DialogTitle className="text-3xl font-bold text-white leading-tight drop-shadow-lg">{details.nombre}</DialogTitle>
                <DialogDescription className="text-white/80 text-lg mt-1">{details.tipo}</DialogDescription>
            </div>
        </div>

        <div className="p-6 grid gap-6">
            <section className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Descripción</h3>
                <p className="text-muted-foreground text-sm">{details.descripcion || 'No hay descripción disponible.'}</p>
            </section>
            
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div className="flex items-start gap-3"><Calendar className="h-4 w-4 mt-0.5 text-primary" /><div><h4 className="font-semibold">Inicio</h4><p className="text-muted-foreground">{formatDate(details.inicio)}</p></div></div>
                <div className="flex items-start gap-3"><Clock className="h-4 w-4 mt-0.5 text-primary" /><div><h4 className="font-semibold">Fin</h4><p className="text-muted-foreground">{details.fin ? formatDate(details.fin) : 'No especificado'}</p></div></div>
                <div className="flex items-start gap-3"><Users className="h-4 w-4 mt-0.5 text-primary" /><div><h4 className="font-semibold">Aforo Máximo</h4><p className="text-muted-foreground">{details.aforoMaximo.toLocaleString()} personas</p></div></div>
                <div className="flex items-center gap-3"><Tag className="h-4 w-4 text-primary" /><div><h4 className="font-semibold">Estado</h4><p className="text-muted-foreground capitalize">{details.estado}</p></div></div>
            </div>

            {details.venue && (
                <section className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-lg flex items-center"><Building className="mr-2 h-5 w-5 text-primary" />Escenario</h3>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-bold">{details.venue.nombre}</h4>
                        <p className="text-sm text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1.5"/>{details.venue.ubicacion}, {details.venue.ciudad}</p>
                        <p className="text-xs text-muted-foreground mt-2">{details.venue.descripcion}</p>
                    </div>
                </section>
            )}

            {details.folletoUrl && (
                 <section className="space-y-3 pt-4 border-t">
                     <h3 className="font-semibold text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" />Folleto</h3>
                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                         <p className="text-sm text-muted-foreground">Documento informativo adjunto.</p>
                         <Button asChild size="sm" variant="outline">
                            <a href={details.folletoUrl} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2 h-4 w-4"/>Ver PDF
                            </a>
                        </Button>
                     </div>
                 </section>
            )}
        </div>

        <DialogFooter className="px-6 pb-4 bg-background border-t pt-4">
          <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
          <Button>Editar Evento</Button>
        </DialogFooter>
      </>
    );
  };

  const DetailsViewSkeleton = () => (
    <div className="p-0">
      <Skeleton className="h-64 w-full rounded-t-lg" />
      <div className="p-6 space-y-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="grid md:grid-cols-2 gap-4 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

