

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
import { Users, Ticket, Tag, Package, Plus, Minus, Loader2, AlertCircle, Building, User, FileText, Link as LinkIcon, CheckCircle, ShoppingBag } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiEvent, Zone, Venue, Organizer, Seat, ComplementaryService, Product, ServiceBookingRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";

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
  const [stage, setStage] = useState<"details" | "reservation" | "services">("details");
  const [selectedTier, setSelectedTier] = useState<Zone | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [eventDetails, setEventDetails] = useState<DetailedEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSeats, setAvailableSeats] = useState<number | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
  const [services, setServices] = useState<ComplementaryService[]>([]);
  const [selectedService, setSelectedService] = useState<ComplementaryService | null>(null);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

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

    const fetchProducts = useCallback(async (serviceId: string) => {
        setIsLoadingProducts(true);
        setProductsError(null);
        setProducts([]);
        setSelectedProducts([]);
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setProductsError("Sesión expirada: Por favor, inicie sesión nuevamente para continuar con su compra.");
            setIsLoadingProducts(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:44335/api/ServComps/Prods/getProductosByIdServicio?idServicio=${serviceId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data: Product[] = await response.json();
                setProducts(data);
            } else if (response.status === 401) {
                throw new Error("Sesión expirada: Por favor, inicie sesión nuevamente para continuar con su compra.");
            } else {
                throw new Error("Error al cargar productos: No pudimos obtener la lista de productos en este momento. Inténtelo de nuevo.");
            }
        } catch (err: any) {
            setProductsError(err.message);
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    const handleServiceSelect = (service: ComplementaryService) => {
        if (selectedService?.id === service.id) {
            setSelectedService(null);
            setProducts([]);
            setSelectedProducts([]);
            setProductsError(null);
        } else {
            setSelectedService(service);
            fetchProducts(service.id);
        }
    };

    const handleProductSelection = (product: Product) => {
        setSelectedProducts(currentSelected => {
            const isSelected = currentSelected.some(p => p.id === product.id);
            if (isSelected) {
                return currentSelected.filter(p => p.id !== product.id);
            } else {
                return [...currentSelected, product];
            }
        });
    };

  const handleGoToServices = async () => {
    setIsLoadingServices(true);
    setServicesError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setServicesError("Error de sesión: Su sesión ha expirado. Por favor, inicie sesión de nuevo para continuar.");
        setIsLoadingServices(false);
        return;
    }

    try {
        const recordsResponse = await fetch(`http://localhost:44335/api/ServComps/Servs/getRegistrosByIdEvento?idEvento=${event.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (recordsResponse.status === 404) {
            setServices([]);
            setStage("services");
            return;
        }
        
        if (!recordsResponse.ok) {
            if (recordsResponse.status === 401) {
                throw new Error("Error de sesión: Su sesión ha expirado. Por favor, inicie sesión de nuevo para continuar.");
            }
            throw new Error("Vaya, algo salió mal: No pudimos cargar los servicios adicionales. Inténtelo de nuevo en unos momentos.");
        }
        
        const records: ServiceBookingRecord[] = await recordsResponse.json();

        const enrichedServices = await Promise.all(
            records.map(async (record) => {
                const serviceResponse = await fetch(`http://localhost:44335/api/ServComps/Servs/getServicioById?idServicio=${record.idServicio}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (serviceResponse.ok) {
                    return serviceResponse.json();
                }
                return null;
            })
        );
        
        const validServices: ComplementaryService[] = enrichedServices.filter(s => s !== null);

        const now = new Date();
        const availableServices = validServices.filter(service => {
            const record = records.find(r => r.idServicio === service.id);
            if (!record) return false;
            return new Date(record.fechaFin) >= now;
        });
        
        setServices(availableServices);
        setStage("services");
    } catch (err: any) {
        setServicesError(err.message);
    } finally {
        setIsLoadingServices(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    const maxQuantity = Math.min(availableSeats ?? 10, 10);
    if (newQuantity > 0 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const ticketPrice = selectedTier ? selectedTier.precio * quantity : 0;
  const productsPrice = selectedProducts.reduce((sum, p) => sum + p.precio, 0);
  const totalPrice = ticketPrice + productsPrice;


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

    let ticketReservationId: string | null = null;

    try {
        if (quantity <= 0) {
            throw new Error("La cantidad de boletos debe ser mayor a 0.");
        }

        // Step 1: Reserve event tickets, now including total price
        const reservaData = {
            eventId: eventDetails.id,
            zonaEventoId: selectedTier.id,
            cantidadBoletos: quantity,
            usuarioId: usuarioId,
            precioTotal: totalPrice // Send the combined price
        };

        const ticketResponse = await fetch('http://localhost:44335/api/Reservas/hold', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reservaData)
        });
        
        if (!ticketResponse.ok) {
            const errorData = await ticketResponse.json().catch(() => ({}));
            let errorMessage = `Error del servidor: ${ticketResponse.status}`;
            if (ticketResponse.status === 409 && errorData.message?.includes('No hay asientos suficientes')) {
                setError("No hay suficientes asientos disponibles en esta zona para la cantidad solicitada.");
                fetchAvailableSeats(eventDetails.id, selectedTier.id);
            } else if (ticketResponse.status === 401) {
                errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.";
            } else if (ticketResponse.status === 400) {
                errorMessage = "Datos inválidos para la reserva. Por favor, verifica la información.";
            } else {
                errorMessage = errorData.message || errorMessage;
            }
            if (ticketResponse.status !== 409) setError(errorMessage);
            throw new Error("Ticket reservation failed.");
        }
        
        const ticketResult = await ticketResponse.json();
        // The API returns an array of reservation details, one for each seat.
        // The reservation ID is the same for all of them.
        if (Array.isArray(ticketResult) && ticketResult.length > 0 && ticketResult[0].reservaId) {
            ticketReservationId = ticketResult[0].reservaId;
        } else {
            // Handle cases where the response is not as expected.
            console.error("Unexpected response format from ticket reservation:", ticketResult);
            throw new Error("No se pudo obtener el ID de la reserva de boletos.");
        }

        // Step 2: Reserve complementary services/products
        if (selectedProducts.length > 0) {
            const serviceReservationData = {
                idUsuario: usuarioId,
                idReserva: ticketReservationId,
                idEvento: eventDetails.id,
                idsProducto: selectedProducts.map(p => p.id)
            };

            const serviceResponse = await fetch('http://localhost:44335/api/ServComps/Resv/reservar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(serviceReservationData)
            });

            if (!serviceResponse.ok) {
                const serviceErrorData = await serviceResponse.json().catch(() => ({}));
                let serviceErrorMessage = serviceErrorData.message || "No se pudo confirmar la reserva de servicios.";
                throw new Error(`SERVICE_BOOKING_FAILED: ${serviceErrorMessage}`);
            }
        }
        
        // Step 3: Global success
        toast({
            title: "✅ ¡Reserva completada!",
            description: selectedProducts.length > 0
                ? "Tus entradas y servicios adicionales han sido reservados con éxito."
                : `Se han reservado ${quantity} boleto(s) para ${eventDetails.nombre}.`,
        });
        handleClose();
        router.push('/bookings');

    } catch (err: any) {
        if (err.message.startsWith("SERVICE_BOOKING_FAILED")) {
            const detailedError = err.message.replace("SERVICE_BOOKING_FAILED: ", "");
            toast({
                variant: "destructive",
                title: "Aviso Importante",
                description: `Tu entrada se reservó, pero hubo un problema con los servicios adicionales: ${detailedError}. Por favor, contacta a soporte.`,
                duration: 10000,
            });
            handleClose();
            router.push('/bookings');
        } else if (err.message !== "Ticket reservation failed.") {
            setError(err.message);
            toast({
                variant: "destructive",
                title: "❌ Error al crear la reserva",
                description: err.message,
            });
        }
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
        setServices([]);
        setSelectedService(null);
        setIsLoadingServices(false);
        setServicesError(null);
        setProducts([]);
        setSelectedProducts([]);
        setIsLoadingProducts(false);
        setProductsError(null);
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
              <DialogTitle className="text-3xl font-bold">Reserva: {eventDetails.nombre}</DialogTitle>
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
                            <span>${ticketPrice.toFixed(2)}</span>
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
                <Button onClick={handleGoToServices} disabled={isReserving || !selectedTier || quantity <= 0 || (availableSeats !== null && quantity > availableSeats) || isLoadingServices}>
                    {isLoadingServices ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Cargando...</>
                    ) : (
                        "Siguiente"
                    )}
                </Button>
            </DialogFooter>
        </div>
      );
    }

    if (stage === "services") {
      return (
          <div className="p-8">
              <DialogHeader className="mb-6">
                  <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                      <ShoppingBag className="h-8 w-8 text-primary"/>
                      Servicios Complementarios
                  </DialogTitle>
                  <DialogDescription>Mejora tu experiencia añadiendo uno de estos servicios a tu reserva.</DialogDescription>
              </DialogHeader>
  
              {servicesError && (
                  <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error al Cargar Servicios</AlertTitle>
                      <AlertDescription>{servicesError}</AlertDescription>
                  </Alert>
              )}
  
              <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                  {services.length > 0 ? (
                      services.map(service => (
                          <Card
                              key={service.id}
                              className={`cursor-pointer transition-all ${selectedService?.id === service.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-muted-foreground/50'}`}
                              onClick={() => handleServiceSelect(service)}
                          >
                              <CardContent className="p-4 flex items-start gap-4">
                                  <Image src={service.fotoServicio || '/placeholder.png'} alt={service.nombre} width={80} height={80} className="rounded-md aspect-square object-cover bg-muted" />
                                  <div className="flex-1">
                                      <h4 className="font-semibold">{service.nombre}</h4>
                                      <Badge variant="outline" className="my-1">{service.tipo}</Badge>
                                      <p className="text-xs text-muted-foreground line-clamp-2">{service.descripcion}</p>
                                  </div>
                              </CardContent>
                          </Card>
                      ))
                  ) : !servicesError && (
                      <div className="text-center py-8">
                          <p className="text-muted-foreground">No hay servicios adicionales disponibles para este evento.</p>
                      </div>
                  )}

                    {selectedService && (
                        <div className="pt-6 mt-6 border-t">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Productos para {selectedService.nombre}
                            </h3>
                            {isLoadingProducts ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-md" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                                    <div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-md" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                                </div>
                            ) : productsError ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error al cargar productos</AlertTitle>
                                    <AlertDescription>{productsError}</AlertDescription>
                                </Alert>
                            ) : (
                                <div className="space-y-3">
                                    {products.length > 0 ? (
                                        products.map(product => (
                                            <div key={product.id} className="flex items-center p-2 rounded-md hover:bg-muted/50">
                                                <Checkbox
                                                    id={`product-${product.id}`}
                                                    checked={selectedProducts.some(p => p.id === product.id)}
                                                    onCheckedChange={() => handleProductSelection(product)}
                                                    className="mr-4"
                                                />
                                                <label htmlFor={`product-${product.id}`} className="flex-1 flex items-center gap-3 cursor-pointer">
                                                    <Image src={product.fotoProducto || '/placeholder.png'} alt={product.nombre} width={48} height={48} className="rounded-md aspect-square object-cover bg-muted" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{product.nombre}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{product.descripcion}</p>
                                                    </div>
                                                    <p className="font-bold text-sm ml-4">${product.precio.toFixed(2)}</p>
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">No hay productos disponibles para este servicio.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
              </div>
              
              <div className="border-t pt-6 mt-6">
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{quantity} x {selectedTier?.nombre}</span>
                        <span>${ticketPrice.toFixed(2)}</span>
                    </div>
                    {selectedService && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Servicio: {selectedService.nombre}</span>
                            <span className="text-primary font-medium">Incluido</span>
                        </div>
                    )}
                     {selectedProducts.length > 0 && (
                        <div className="pl-4 pt-1">
                            {selectedProducts.map(p => (
                                <div key={p.id} className="flex justify-between text-muted-foreground">
                                    <span>- {p.nombre}</span>
                                    <span>+ ${p.precio.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                  <div className="flex justify-between items-center text-2xl font-bold mt-4">
                      <span>Precio Total:</span>
                      <span>${totalPrice.toFixed(2)}</span>
                  </div>
              </div>
  
              <DialogFooter className="mt-8 grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => setStage("reservation")} disabled={isReserving}>Atrás</Button>
                  <Button onClick={handleConfirmReservation} disabled={isReserving}>
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
