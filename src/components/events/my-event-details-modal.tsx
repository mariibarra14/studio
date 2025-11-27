
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Users, MapPin, Tag, FileText, Building, AlertCircle, Clock, Link as LinkIcon, Info, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ApiEvent, Venue } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  };
  
  const formatDate = (dateString: string | null) => {
      if (!dateString) return 'No especificado';
      return format(new Date(dateString), "EEEE, d 'de' LLLL 'de' yyyy, h:mm a", { locale: es });
  }
  
  const getDisplayStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Activo': 'Activo',
      'Draft': 'Privado',
    };
    return statusMap[status] || status;
  };

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
    
    const displayStatus = getDisplayStatus(details.estado);

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handleClose}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Volver</span>
                    </Button>
                    <CardTitle className="text-2xl">{details.nombre}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <section className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Descripción</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{details.descripcion || 'No hay descripción disponible.'}</p>
                        </section>

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
                    <div className="space-y-6">
                        <div className="p-4 border rounded-lg space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Detalles del Evento</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center"><span className="font-semibold text-muted-foreground">Estado</span><Badge variant={details.estado === 'Activo' ? 'default' : 'secondary'} className="capitalize">{displayStatus}</Badge></div>
                                <div className="flex flex-col"><span className="font-semibold text-muted-foreground">Inicio</span><span className="text-foreground text-right">{formatDate(details.inicio)}</span></div>
                                <div className="flex flex-col"><span className="font-semibold text-muted-foreground">Fin</span><span className="text-foreground text-right">{formatDate(details.fin)}</span></div>
                                <div className="flex justify-between"><span className="font-semibold text-muted-foreground">Aforo</span><span className="text-foreground">{details.aforoMaximo.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="font-semibold text-muted-foreground">Tipo</span><span className="text-foreground capitalize">{details.tipo}</span></div>
                            </div>
                        </div>
                         <Button className="w-full">Editar Evento</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
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

  return renderContent();
}
