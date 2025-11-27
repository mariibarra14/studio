
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Ticket, Tag, Package, Plus, Minus, Loader2, AlertCircle, Building, User, FileText, Link as LinkIcon } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiEvent, TicketTier, Venue, Organizer } from "@/lib/types";

type EventReservationModalProps = {
  event: ApiEvent;
  isOpen: boolean;
  onClose: () => void;
};

type DetailedEvent = ApiEvent & {
  venue?: Venue | null;
  organizer?: Organizer | null;
};

export function EventReservationModal({
  event,
  isOpen,
  onClose,
}: EventReservationModalProps) {
  const [stage, setStage] = useState<"details" | "reservation">("details");
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [eventDetails, setEventDetails] = useState<DetailedEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventDetails = useCallback(async (eventId: string) => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');

    if (!token) {
        setError("No estás autenticado. Por favor, inicia sesión de nuevo.");
        setIsLoading(false);
        return;
    }

    try {
        const eventResponse = await fetch(`http://localhost:44335/api/events/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!eventResponse.ok) {
            throw new Error(`Error ${eventResponse.status}: No se pudieron cargar los detalles del evento.`);
        }
        const eventData: ApiEvent = await eventResponse.json();

        // Fetch organizer and venue in parallel
        const [organizerResponse, venueResponse] = await Promise.all([
          fetch(`http://localhost:44335/api/Usuarios/getUsuarioById?id=${eventData.organizadorId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`http://localhost:44335/api/events/escenarios/${eventData.escenarioId}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const organizerData = organizerResponse.ok ? await organizerResponse.json() : null;
        const venueData = venueResponse.ok ? await venueResponse.json() : null;
        
        setEventDetails({
          ...eventData,
          organizer: organizerData,
          venue: venueData,
        });

        if (eventData.localidades && eventData.localidades.length > 0) {
          setSelectedTier(eventData.localidades[0]);
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("Ocurrió un error inesperado.");
        }
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && event?.id) {
        fetchEventDetails(event.id);
    }
  }, [isOpen, event, fetchEventDetails]);


  const handleTierChange = (tierId: string) => {
    const tier = eventDetails?.localidades?.find(t => t.id === tierId) || null;
    setSelectedTier(tier);
    setQuantity(1);
  };

  const incrementQuantity = () => {
    // Note: 'available' is not in ApiEvent's TicketTier, this is a placeholder
    // if (selectedTier && quantity < selectedTier.available) {
    //   setQuantity(q => q + 1);
    // }
    setQuantity(q => q + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const totalPrice = selectedTier ? selectedTier.precio * quantity : 0;

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setStage("details");
        setEventDetails(null);
        setSelectedTier(null);
        setQuantity(1);
        setIsLoading(true);
        setError(null);
    }, 300);
  };
  
  const DetailsViewSkeleton = () => (
    <div className="p-8">
      <DialogHeader className="sr-only">
        <DialogTitle>Cargando evento...</DialogTitle>
      </DialogHeader>
      <div className="text-left mb-4">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
      </div>
      <DialogFooter className="mt-8">
        <Skeleton className="h-12 w-full" />
      </DialogFooter>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return <DetailsViewSkeleton />;
    }

    if (error || !eventDetails) {
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
            <DialogHeader className="sr-only">
              <DialogTitle>Error al cargar evento</DialogTitle>
            </DialogHeader>
            <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al Cargar Detalles</AlertTitle>
                <AlertDescription>{error || "No se pudo encontrar la información del evento."}</AlertDescription>
            </Alert>
            <Button onClick={() => fetchEventDetails(event.id)} className="mt-6">
                Reintentar
            </Button>
        </div>
      );
    }

    if (stage === "details") {
      return (
        <div className="p-0">
          <div className={`relative w-full ${eventDetails.imagenUrl ? 'aspect-video' : 'h-48'}`}>
              {eventDetails.imagenUrl ? (
                  <Image
                      src={eventDetails.imagenUrl}
                      alt={eventDetails.nombre}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, 50vw"
                  />
              ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600 to-orange-500 rounded-t-lg">
                      <p className="text-center font-bold text-white text-lg p-4">{eventDetails.nombre}</p>
                  </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
          </div>

          <div className="p-6">
            <DialogHeader className="text-left mb-6">
              <DialogTitle className="text-3xl font-bold mb-2">{eventDetails.nombre}</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                {format(new Date(eventDetails.inicio), "EEEE, dd 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 text-sm text-foreground/80">
              <p className="leading-relaxed">{eventDetails.descripcion}</p>
              
              {eventDetails.venue && (
                 <div className="flex items-start gap-3 pt-2">
                    <Building className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                        <h4 className="font-semibold text-foreground">Escenario</h4>
                        <p>{eventDetails.venue.nombre} - {eventDetails.venue.ubicacion}</p>
                    </div>
                </div>
              )}
               {eventDetails.organizer && (
                 <div className="flex items-start gap-3 pt-2">
                    <User className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                        <h4 className="font-semibold text-foreground">Organizador</h4>
                        <p>{eventDetails.organizer.nombre} {eventDetails.organizer.apellido}</p>
                    </div>
                </div>
              )}
               {eventDetails.folletoUrl && (
                <div className="flex items-start gap-3 pt-2">
                    <FileText className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                        <h4 className="font-semibold text-foreground">Folleto del Evento</h4>
                        <Button variant="link" asChild className="p-0 h-auto text-base">
                            <a href={eventDetails.folletoUrl} target="_blank" rel="noopener noreferrer">
                                Ver Folleto (PDF)
                                <LinkIcon className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>
               )}
               <div className="flex items-start gap-3 pt-2">
                    <Users className="h-5 w-5 mt-0.5 text-primary"/>
                    <div>
                        <h4 className="font-semibold text-foreground">Aforo</h4>
                        <p>Capacidad para {eventDetails.aforoMaximo} personas</p>
                    </div>
                </div>
            </div>
            
            <DialogFooter className="mt-8">
                <Button onClick={() => setStage("reservation")} className="w-full text-lg py-6" disabled={!eventDetails.localidades || eventDetails.localidades.length === 0}>
                  {eventDetails.localidades && eventDetails.localidades.length > 0 ? 'Reservar' : 'Entradas no disponibles'}
                </Button>
            </DialogFooter>
          </div>
        </div>
      );
    }

    if (stage === "reservation") {
      return (
        <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-bold">Confirmar Reserva: {eventDetails.nombre}</DialogTitle>
              <DialogDescription>Seleccione el tipo de entrada y la cantidad.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="ticket-tier" className="text-lg">Tipo de Entrada</Label>
                    <Select onValueChange={handleTierChange} defaultValue={selectedTier?.id}>
                        <SelectTrigger id="ticket-tier" className="text-base py-6">
                            <SelectValue placeholder="Seleccione un tipo de entrada" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventDetails.localidades?.map(tier => (
                            <SelectItem key={tier.id} value={tier.id} className="text-base p-3">
                              <div className="flex justify-between w-full">
                                <span className="font-semibold">{tier.nombre}</span>
                                <span className="text-muted-foreground ml-4">${tier.precio.toFixed(2)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-lg">Cantidad</Label>
                    <div className="flex items-center gap-4">
                         <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <Input id="quantity" type="number" value={quantity} readOnly className="w-20 text-center text-lg font-bold" />
                         <Button variant="outline" size="icon" onClick={incrementQuantity}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="border-t pt-6 mt-6">
                    <div className="flex justify-between items-center text-2xl font-bold">
                        <span>Precio Total:</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <DialogFooter className="mt-8 gap-4">
                <Button variant="outline" onClick={() => setStage("details")}>Atrás</Button>
                <Button className="w-full">Confirmar Reserva</Button>
            </DialogFooter>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
