
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
import { Label } from "@/components/ui/label";
import { Users, Ticket, Tag, Package, Plus, Minus, Loader2, AlertCircle, Building, User, FileText, Link as LinkIcon, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiEvent, Zone, Venue, Organizer, Seat } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";

type EventReservationModalProps = {
  event: ApiEvent;
  isOpen: boolean;
  onClose: () => void;
};

type DetailedEvent = ApiEvent & {
  venue?: Venue | null;
  organizer?: Organizer | null;
  zonas?: Zone[];
};

export function EventReservationModal({
  event,
  isOpen,
  onClose,
}: EventReservationModalProps) {
  const [stage, setStage] = useState<"details" | "reservation">("details");
  const [selectedTier, setSelectedTier] = useState<Zone | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [eventDetails, setEventDetails] = useState<DetailedEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSeats, setAvailableSeats] = useState<number | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
        const [eventResponse, organizerResponse, venueResponse, zonasResponse] = await Promise.all([
          fetch(`http://localhost:44335/api/events/${eventId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`http://localhost:44335/api/Usuarios/getUsuarioById?id=${event.organizadorId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`http://localhost:44335/api/events/escenarios/${event.escenarioId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`http://localhost:44335/api/events/${eventId}/zonas`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!eventResponse.ok) {
            throw new Error(`Error ${eventResponse.status}: No se pudieron cargar los detalles del evento.`);
        }
        const eventData: ApiEvent = await eventResponse.json();

        const organizerData = organizerResponse.ok ? await organizerResponse.json() : null;
        const venueData = venueResponse.ok ? await venueResponse.json() : null;
        const zonasData = zonasResponse.ok ? await zonasResponse.json() : [];
        
        setEventDetails({
          ...eventData,
          organizer: organizerData,
          venue: venueData,
          zonas: zonasData,
        });

        if (zonasData && zonasData.length > 0) {
          handleTierChange(zonasData[0].id);
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
  }, [event.organizadorId, event.escenarioId]);

  useEffect(() => {
    if (isOpen && event?.id) {
        fetchEventDetails(event.id);
    }
  }, [isOpen, event, fetchEventDetails]);

  const fetchAvailableSeats = useCallback(async (eventId: string, zoneId: string) => {
    setIsLoadingAvailability(true);
    setAvailableSeats(null);
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:44335/api/events/${eventId}/zonas/${zoneId}/asientos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const seats: Seat[] = await response.json();
        const available = seats.filter(seat => seat.estado?.toLowerCase() === 'disponible').length;
        setAvailableSeats(available);
      } else {
        setAvailableSeats(0);
      }
    } catch (e) {
      setAvailableSeats(0);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, []);

  const handleTierChange = (tierId: string) => {
    const tier = eventDetails?.zonas?.find(t => t.id === tierId) || null;
    setSelectedTier(tier);
    setQuantity(1);
    if (tier && eventDetails) {
      fetchAvailableSeats(eventDetails.id, tier.id);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    const maxQuantity = Math.min(availableSeats ?? 10, 10);
    if (newQuantity > 0 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const totalPrice = selectedTier ? selectedTier.precio * quantity : 0;

  const handleConfirmReservation = async () => {
    setIsReserving(true);
    setError(null);

    const token = localStorage.getItem('accessToken');
    const usuarioId = localStorage.getItem('userId');
    
    if (!token || !usuarioId) {
      setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
      setIsReserving(false);
      return;
    }
    
    if (!selectedTier || !eventDetails) {
        setError("Información del evento o zona no disponible.");
        setIsReserving(false);
        return;
    }

    try {
        if (quantity <= 0) {
            throw new Error("La cantidad de boletos debe ser mayor a 0.");
        }

        const reservaData = {
            eventId: eventDetails.id,
            zonaEventoId: selectedTier.id,
            cantidadBoletos: quantity,
            usuarioId: usuarioId
        };

        const response = await fetch('http://localhost:44335/api/Reservas/hold', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reservaData)
        });
        
        if (response.ok) {
            const resultado = await response.json();
            toast({
                title: "✅ Reserva realizada con éxito",
                description: `Se han reservado ${quantity} boleto(s) para ${eventDetails.nombre}.`,
                duration: 5000,
            });
            handleClose();
            router.push('/bookings');
        } else {
            let errorMessage = `Error del servidor: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                 if (response.status === 409 && errorData.message?.includes('No hay asientos suficientes')) {
                    setError("No hay suficientes asientos disponibles en esta zona para la cantidad solicitada.");
                    // Re-fetch availability
                    fetchAvailableSeats(eventDetails.id, selectedTier.id);
                }
            } catch (e) {
                // Ignore if error body is not JSON
            }
            if (response.status !== 409) {
                 if (response.status === 401) {
                    errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.";
                } else if (response.status === 400) {
                    errorMessage = "Datos inválidos para la reserva. Por favor, verifica la información.";
                }
                 setError(errorMessage);
            }
        }

    } catch (err: any) {
        setError(err.message);
        toast({
            variant: "destructive",
            title: "❌ Error al crear la reserva",
            description: err.message,
        });
    } finally {
        setIsReserving(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setStage("details");
        setEventDetails(null);
        setSelectedTier(null);
        setQuantity(1);
        setIsLoading(true);
        setError(null);
        setAvailableSeats(null);
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

    if (error && !eventDetails) {
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

    if (!eventDetails) {
        return null; // Should be covered by error state but as a safeguard
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
                  <div className="flex h-full w-full items-center justify-center bg-primary rounded-t-lg">
                      <p className="text-center font-bold text-white text-lg p-4">{eventDetails.nombre}</p>
                  </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>

          <div className="p-6 -mt-10 relative bg-background rounded-t-2xl">
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
                <Button onClick={() => setStage("reservation")} className="w-full text-lg py-6" disabled={!eventDetails.zonas || eventDetails.zonas.length === 0}>
                  {eventDetails.zonas && eventDetails.zonas.length > 0 ? 'Reservar' : 'Entradas no disponibles'}
                </Button>
            </DialogFooter>
          </div>
        </div>
      );
    }

    if (stage === "reservation") {
      const maxQuantity = Math.min(availableSeats ?? 10, 10);
      return (
        <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-bold">Confirmar Reserva: {eventDetails.nombre}</DialogTitle>
              <DialogDescription>Seleccione el tipo de entrada y la cantidad.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="ticket-tier" className="text-base font-medium">Tipo de Entrada</Label>
                    <Select onValueChange={handleTierChange} defaultValue={selectedTier?.id}>
                        <SelectTrigger id="ticket-tier" className="text-base py-6">
                            <SelectValue placeholder="Seleccione un tipo de entrada" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventDetails.zonas?.map(tier => (
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
                
                {selectedTier && (
                  <>
                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-base font-medium">Cantidad</Label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                max={maxQuantity}
                                value={quantity}
                                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                                className="w-20 text-center text-lg font-bold"
                            />
                            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= maxQuantity}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground h-4">
                          {isLoadingAvailability ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin"/>
                              <span>Cargando disponibilidad...</span>
                            </div>
                          ) : availableSeats !== null ? (
                            <span>
                              {availableSeats > 0 ? `${availableSeats} boletos disponibles.` : 'No hay boletos disponibles.'}
                            </span>
                          ) : null}
                        </div>
                    </div>

                    <div className="border-t pt-6 mt-6">
                        <div className="flex justify-between items-center text-2xl font-bold">
                            <span>Precio Total:</span>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                  </>
                )}
            </div>

             {error && (
                <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <DialogFooter className="mt-8 grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setStage("details")} disabled={isReserving}>Atrás</Button>
                <Button onClick={handleConfirmReservation} disabled={isReserving || !selectedTier || quantity <= 0 || (availableSeats !== null && quantity > availableSeats)}>
                    {isReserving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            Procesando...
                        </>
                    ) : (
                        "Confirmar Reserva"
                    )}
                </Button>
            </DialogFooter>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

