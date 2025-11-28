
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Users, MapPin, Tag, FileText, Building, AlertCircle, Clock, Link as LinkIcon, Info, ArrowLeft, Trash2, Loader2, Edit, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ApiEvent, Venue, Zone } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog"
import { getCategoryNameById } from "@/lib/categories";
import { EditEventModal } from "./edit-event-modal";
import { AddZoneModal } from "./add-zone-modal";
import { EditZoneModal } from "./edit-zone-modal";

type MyEventDetailsModalProps = {
  eventId: string;
  onClose: () => void;
  onDeleteSuccess: () => void;
  onEditSuccess: () => void;
};

type DetailedEvent = ApiEvent & {
  venue?: Venue;
  zonas?: Zone[];
};

export function MyEventDetailsModal({ eventId, onClose, onDeleteSuccess, onEditSuccess }: MyEventDetailsModalProps) {
  const [details, setDetails] = useState<DetailedEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  
  const [isEditZoneModalOpen, setIsEditZoneModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const [isDeletingZone, setIsDeletingZone] = useState<string | null>(null);
  const [showDeleteZoneDialog, setShowDeleteZoneDialog] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);


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
      const [eventRes, zonasRes] = await Promise.all([
        fetch(`http://localhost:44335/api/events/${eventId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`http://localhost:44335/api/events/${eventId}/zonas`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!eventRes.ok) throw new Error("No se pudo cargar el evento.");
      const eventData: ApiEvent = await eventRes.json();
      
      const zonasData = zonasRes.ok ? await zonasRes.json() : [];

      let venueData: Venue | undefined = undefined;
      if (eventData.escenarioId) {
        const venueRes = await fetch(`http://localhost:44335/api/events/escenarios/${eventData.escenarioId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (venueRes.ok) {
          venueData = await venueRes.json();
        }
      }

      setDetails({ ...eventData, venue: venueData, zonas: zonasData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      toast({
        variant: "destructive",
        title: "Error de Sesión",
        description: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo."
      });
      setIsDeleting(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 204 || response.ok) {
        onDeleteSuccess();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "No se pudo eliminar el evento.";
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al Eliminar",
        description: err.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDeleteZoneDialog = (zone: Zone) => {
    setZoneToDelete(zone);
    setShowDeleteZoneDialog(true);
  };
  
  const handleConfirmDeleteZone = async () => {
    if (!zoneToDelete) return;
    
    setIsDeletingZone(zoneToDelete.id);
    const token = localStorage.getItem('accessToken');
    
    try {
      // Step 1: Fetch seats for the zone
      const seatsResponse = await fetch(`http://localhost:44335/api/events/${eventId}/zonas/${zoneToDelete.id}/asientos`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!seatsResponse.ok) throw new Error('No se pudieron obtener los asientos de la zona.');
      const seats: any[] = await seatsResponse.json();

      // Step 2: Delete each seat
      for (const seat of seats) {
        const deleteSeatResponse = await fetch(`http://localhost:44335/api/events/${eventId}/zonas/${zoneToDelete.id}/asientos/${seat.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!deleteSeatResponse.ok && deleteSeatResponse.status !== 404) {
            throw new Error(`Error al eliminar el asiento ${seat.label}.`);
        }
      }

      // Step 3: Delete the zone itself
      const deleteZoneResponse = await fetch(`http://localhost:44335/api/events/${eventId}/zonas/${zoneToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!deleteZoneResponse.ok) {
        const errorData = await deleteZoneResponse.json().catch(() => null);
        throw new Error(errorData?.message || 'No se pudo eliminar la zona.');
      }
      
      toast({ title: '✅ Zona Eliminada', description: `La zona "${zoneToDelete.nombre}" y sus asientos han sido eliminados.` });
      setShowDeleteZoneDialog(false);
      fetchDetails();

    } catch (err: any) {
       toast({ variant: 'destructive', title: '❌ Error al eliminar zona', description: err.message });
    } finally {
       setIsDeletingZone(null);
       setZoneToDelete(null);
    }
  };

  
  const handleEditSuccessAndClose = () => {
    setIsEditModalOpen(false);
    fetchDetails();
    onEditSuccess();
  }

  const handleAddZoneSuccess = () => {
    setIsAddZoneModalOpen(false);
    fetchDetails(); // Refetch event details to show the new zone
  };

  const handleEditZoneSuccess = () => {
    setIsEditZoneModalOpen(false);
    setSelectedZone(null);
    fetchDetails();
  }

  const handleOpenEditZoneModal = (zone: Zone) => {
    setSelectedZone(zone);
    setIsEditZoneModalOpen(true);
  };


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
      'Draft': 'Activo',
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
    const categoryName = getCategoryNameById(details.categoriaId);

    return (
        <>
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                          <Button variant="outline" size="icon" onClick={handleClose}>
                              <ArrowLeft className="h-4 w-4" />
                              <span className="sr-only">Volver</span>
                          </Button>
                          <CardTitle className="text-2xl">{details.nombre}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                              <Edit className="mr-2 h-4 w-4"/>
                              Editar Evento
                          </Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" disabled={isDeleting}>
                                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                                      Eliminar
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>¿Estás seguro de que quieres eliminar este evento?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Esta acción es permanente y no se puede deshacer. Toda la información asociada al evento
                                          "{details.nombre}" será eliminada.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                          {isDeleting ? 'Eliminando...' : 'Sí, eliminar evento'}
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <section>
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-6">
                                    {details.imagenUrl ? (
                                        <Image
                                            src={details.imagenUrl}
                                            alt={details.nombre}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-primary">
                                            <p className="text-center font-bold text-primary-foreground text-2xl p-4">{details.nombre}</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                            <section className="space-y-3">
                                <h3 className="font-semibold text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Descripción</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{details.descripcion || 'No hay descripción disponible.'}</p>
                            </section>
                            
                            <section className="space-y-3 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg flex items-center"><Tag className="mr-2 h-5 w-5 text-primary" />Zonas del Evento</h3>
                                    <Button size="sm" variant="outline" onClick={() => setIsAddZoneModalOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Añadir Zona
                                    </Button>
                                </div>
                                {details.zonas && details.zonas.length > 0 ? (
                                    <div className="space-y-2">
                                        {details.zonas.map(zona => (
                                            <div key={zona.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold">{zona.nombre}</h4>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Capacidad: {zona.capacidad.toLocaleString()} • Precio: ${zona.precio.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenEditZoneModal(zona)}>
                                                        <Edit className="mr-1 h-3 w-3" />
                                                        Editar
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm" disabled={!!isDeletingZone}>
                                                                {isDeletingZone === zona.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="mr-1 h-3 w-3" />}
                                                                Eliminar
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>¿Eliminar zona "{zona.nombre}"?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                Esta acción es permanente. Se eliminarán la zona y todos sus asientos asociados.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleOpenDeleteZoneDialog(zona)}
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                >
                                                                    Sí, eliminar zona
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Este evento no tiene zonas definidas.</p>
                                )}
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
                                    <div className="flex justify-between items-center"><span className="font-semibold text-muted-foreground">Estado</span><Badge variant={details.estado === 'Activo' || details.estado === 'Draft' ? 'default' : 'secondary'} className="capitalize">{displayStatus}</Badge></div>
                                    <div className="flex flex-col"><span className="font-semibold text-muted-foreground">Inicio</span><span className="text-foreground text-right">{formatDate(details.inicio)}</span></div>
                                    <div className="flex flex-col"><span className="font-semibold text-muted-foreground">Fin</span><span className="text-foreground text-right">{formatDate(details.fin)}</span></div>
                                    <div className="flex justify-between"><span className="font-semibold text-muted-foreground">Aforo</span><span className="text-foreground">{details.aforoMaximo.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="font-semibold text-muted-foreground">Categoría</span><span className="text-foreground capitalize">{categoryName}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteZoneDialog} onOpenChange={setShowDeleteZoneDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Seguro que quieres eliminar la zona "{zoneToDelete?.nombre}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                        Esta acción es permanente. Se eliminarán la zona y todos sus asientos asociados. 
                        Este proceso no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteZone} className="bg-destructive hover:bg-destructive/90" disabled={!!isDeletingZone}>
                            {isDeletingZone ? <Loader2 className="animate-spin"/> : "Confirmar Eliminación"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {details && (
              <>
                <EditEventModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    event={details}
                    onUpdateSuccess={handleEditSuccessAndClose}
                />
                <AddZoneModal
                    isOpen={isAddZoneModalOpen}
                    onClose={() => setIsAddZoneModalOpen(false)}
                    onSuccess={handleAddZoneSuccess}
                    eventId={details.id}
                    escenarioId={details.escenarioId}
                    eventoAforoMaximo={details.aforoMaximo}
                    zonasExistentes={details.zonas || []}
                />
                {selectedZone && (
                  <EditZoneModal
                    isOpen={isEditZoneModalOpen}
                    onClose={() => setIsEditZoneModalOpen(false)}
                    onSuccess={handleEditZoneSuccess}
                    eventId={details.id}
                    zone={selectedZone}
                  />
                )}
              </>
            )}
        </>
    );
  };

  const DetailsViewSkeleton = () => (
    <div className="p-0">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-10 w-48" />
        </div>
      </div>
      <div className="p-6 space-y-6">
        <Skeleton className="h-80 w-full" />
        <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );

  return renderContent();
}

    