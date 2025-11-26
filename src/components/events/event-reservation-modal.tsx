
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
import { Users, Ticket, Tag, Package, Plus, Minus, Loader2, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiEvent, TicketTier } from "@/lib/types";

type EventReservationModalProps = {
  event: ApiEvent;
  isOpen: boolean;
  onClose: () => void;
};

export function EventReservationModal({
  event,
  isOpen,
  onClose,
}: EventReservationModalProps) {
  const [stage, setStage] = useState<"details" | "reservation">("details");
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [eventDetails, setEventDetails] = useState<ApiEvent | null>(null);
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
        const response = await fetch(`http://localhost:44335/api/events/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudieron cargar los detalles del evento.`);
        }
        const data: ApiEvent = await response.json();
        setEventDetails(data);
        if (data.localidades && data.localidades.length > 0) {
          setSelectedTier(data.localidades[0]);
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
    const tier = eventDetails?.localidades.find(t => t.id === tierId) || null;
    setSelectedTier(tier);
    setQuantity(1); // Reset quantity when tier changes
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
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div className="relative h-64 md:h-full min-h-[300px]">
        <Skeleton className="h-full w-full rounded-l-lg" />
      </div>
      <div className="p-8 flex flex-col">
        <DialogHeader className="text-left mb-4">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </DialogHeader>
        <Skeleton className="h-4 w-1/3 mb-6" />
        <div className="space-y-2 flex-grow">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <DialogFooter className="mt-8">
          <Skeleton className="h-12 w-full" />
        </DialogFooter>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return <DetailsViewSkeleton />;
    }

    if (error || !eventDetails) {
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
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
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative h-64 md:h-full min-h-[300px]">
            <Image
              src={eventDetails.imagenUrl || "https://picsum.photos/seed/default-event/600/400"}
              alt={eventDetails.nombre}
              fill
              className="object-cover md:rounded-l-lg"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="p-8 flex flex-col">
            <DialogHeader className="text-left mb-4">
              <DialogTitle className="text-3xl font-bold mb-2">{eventDetails.nombre}</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                {format(new Date(eventDetails.inicio), "EEEE, dd 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center text-sm text-muted-foreground mb-6">
                <Users className="mr-2 h-4 w-4"/>
                <span>Aforo máximo de {eventDetails.aforoMaximo} personas</span>
            </div>

            <p className="text-foreground/80 text-base leading-relaxed flex-grow">{eventDetails.descripcion}</p>
            
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
                            {eventDetails.localidades.map(tier => (
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
      <DialogContent className="max-w-4xl p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
