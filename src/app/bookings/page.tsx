
"use client";

import { useState, useEffect, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal";
import { TicketStub } from "@/components/bookings/ticket-stub";
import type { ApiBooking, ApiEvent, Seat } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Ticket, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryNameById } from "@/lib/categories";

export default function BookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      toast({
        variant: "destructive",
        title: "Sesión expirada",
        description: "Redirigiendo al login...",
      });
      localStorage.clear();
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/Reservas/usuario/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) throw new Error("401");
      if (response.status === 404) {
        setBookings([]);
        return;
      }
      if (!response.ok) throw new Error("Server Error");

      const initialBookings: ApiBooking[] = await response.json();
      
      const enrichedBookings = await Promise.all(
        initialBookings.map(async (booking) => {
          let zonaNombre = "No disponible";
          let eventoNombre = "Evento no disponible";
          let eventoImagen = "";
          let eventoCategoria = "General";
          let eventoInicio = "";
          let eventoFin = "";
          let escenarioNombre = "Ubicación no disponible";
          let escenarioUbicacion = "";
          let enrichedAsientos: Seat[] = booking.asientos;

          try {
            const [zonaResponse, eventoResponse] = await Promise.all([
              fetch(`http://localhost:44335/api/events/${booking.eventId}/zonas/${booking.zonaEventoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }),
              fetch(`http://localhost:44335/api/events/${booking.eventId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
            ]);

            if (zonaResponse.ok) {
              const zonaData = await zonaResponse.json();
              zonaNombre = zonaData.nombre;
            }
            
            if (eventoResponse.ok) {
                const eventoData: ApiEvent = await eventoResponse.json();
                eventoNombre = eventoData.nombre;
                eventoImagen = eventoData.imagenUrl || "";
                eventoCategoria = getCategoryNameById(eventoData.categoriaId) || 'General';
                eventoInicio = eventoData.inicio;
                eventoFin = eventoData.fin || "";

                if (eventoData.escenarioId) {
                  const escenarioResponse = await fetch(`http://localhost:44335/api/events/escenarios/${eventoData.escenarioId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (escenarioResponse.ok) {
                    const escenarioData = await escenarioResponse.json();
                    escenarioNombre = escenarioData.nombre;
                    escenarioUbicacion = escenarioData.ubicacion;
                  }
                }
            }

            // Enrich seats
            enrichedAsientos = await Promise.all(
              booking.asientos.map(async (asiento) => {
                try {
                  const asientoResponse = await fetch(`http://localhost:44335/api/events/${booking.eventId}/zonas/${booking.zonaEventoId}/asientos/${asiento.asientoId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (asientoResponse.ok) {
                    const asientoData = await asientoResponse.json();
                    return {
                      ...asiento,
                      label: asientoData.label || asiento.label,
                      estado: asientoData.estado
                    };
                  }
                  return { ...asiento, label: asiento.label || 'N/A', estado: 'error' };
                } catch (e) {
                   return { ...asiento, label: asiento.label || 'N/A', estado: 'error' };
                }
              })
            );
            
          } catch (e) {
            console.error("Error fetching extra details for booking:", booking.reservaId, e);
          }

          return { 
            ...booking, 
            zonaNombre,
            eventoNombre,
            eventoImagen,
            eventoCategoria,
            eventoInicio,
            eventoFin,
            escenarioNombre,
            escenarioUbicacion,
            asientos: enrichedAsientos,
          };
        })
      );
      setBookings(enrichedBookings);

    } catch (err: any) {
      if (err.message === "401") {
        toast({
          variant: "destructive",
          title: "Sesión expirada",
          description: "Redirigiendo al login...",
        });
        localStorage.clear();
        router.push("/login");
      } else if (err.message === "Server Error") {
        setError({
          title: "Error del servidor",
          message: "No se pudieron cargar las reservas. Por favor, intenta nuevamente más tarde.",
        });
      } else {
        setError({
          title: "Error de conexión",
          message: "Verifica tu conexión a internet e intenta de nuevo.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleBookingSelect = (booking: ApiBooking) => {
    setSelectedBooking(booking);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      );
    }
    
    if (error) {
       return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
          <Alert variant="destructive" className="max-w-md border-0 bg-transparent">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error.title}</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
          <Button onClick={fetchBookings} className="mt-6">Reintentar</Button>
        </div>
      );
    }

    if (bookings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
          <Ticket className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-2xl font-semibold text-muted-foreground mb-2">
            No tienes reservas activas
          </p>
          <p className="text-muted-foreground">
            Cuando reserves un tiquete para un evento, aparecerá aquí.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {bookings.map((booking) => (
          <TicketStub key={booking.reservaId} booking={booking} onSelect={handleBookingSelect} />
        ))}
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Mis Reservas</h1>
        </div>
        
        {renderContent()}

      </main>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={handleCloseModal}
        />
      )}
    </AuthenticatedLayout>
  );
}
