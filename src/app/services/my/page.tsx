
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useApp } from "@/context/app-context";
import { Loader2, AlertCircle, CalendarClock, ServerCrash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MyServiceBooking, ServiceBookingRecord, ComplementaryService, ApiEvent } from "@/lib/types";
import { ServiceBookingCard } from "@/components/services/ServiceBookingCard";
import { ServiceBookingDetailsModal } from "@/components/services/ServiceBookingDetailsModal";

export default function MyServicesPage() {
  const { user, userRole, isLoadingUser } = useApp();
  const [bookings, setBookings] = useState<MyServiceBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<MyServiceBooking | null>(null);

  const fetchMyServiceBookings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Tu sesión ha expirado.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/ServComps/Servs/getRegistrosByIdOrganizador?idOrganizador=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 404) {
        setBookings([]);
        setIsLoading(false);
        return;
      }
      if (!response.ok) {
        throw new Error("No se pudieron cargar las reservas de servicios.");
      }
      
      const records: ServiceBookingRecord[] = await response.json();
      
      const enrichedBookings = await Promise.all(
        records.map(async (record) => {
          try {
            const [serviceRes, eventRes] = await Promise.all([
              fetch(`http://localhost:44335/api/ServComps/Servs/getServicioById?idServicio=${record.idServicio}`, { headers: { 'Authorization': `Bearer ${token}` } }),
              fetch(`http://localhost:44335/api/events/${record.idEvento}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const serviceData: ComplementaryService = serviceRes.ok ? await serviceRes.json() : { nombre: "Servicio no encontrado", fotoServicio: "", tipo: "", descripcion: "", horario: [] };
            const eventData: ApiEvent = eventRes.ok ? await eventRes.json() : { id: "", nombre: "Evento no encontrado", lugar: "", inicio: "", fin: null, aforoMaximo: 0, tipo: "", estado: "", imagenUrl: null, folletoUrl: null, organizadorId: "", escenarioId: "", createdAt: "", updatedAt: "", categoriaId: "" };

            return {
              ...record,
              serviceName: serviceData.nombre,
              servicePhoto: serviceData.fotoServicio,
              serviceType: serviceData.tipo,
              eventName: eventData.nombre,
              eventLugar: eventData.lugar,
              eventInicio: eventData.inicio,
            };
          } catch (e) {
            return null; // Handle cases where enrichment fails for one record
          }
        })
      );
      
      // Filter out nulls and sort by start date
      setBookings(
        enrichedBookings
          .filter((b): b is MyServiceBooking => b !== null)
          .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())
      );

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoadingUser && user) {
      fetchMyServiceBookings();
    } else if (!isLoadingUser && !user) {
        setIsLoading(false);
        setError("Usuario no encontrado.");
    }
  }, [isLoadingUser, user, fetchMyServiceBookings]);

  const activeBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(b => new Date(b.fechaFin) >= now);
  }, [bookings]);

  const renderBookingsList = (list: MyServiceBooking[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg mt-6">
          <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No hay servicios apartados aquí</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Aún no has apartado ningún servicio que coincida con esta vista.
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {list.map(booking => (
          <ServiceBookingCard key={booking.id} booking={booking} onSelect={setSelectedBooking} />
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading || isLoadingUser) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-80 w-full" />)}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (bookings.length === 0 && !error) {
         return (
             <div className="text-center py-16 border-2 border-dashed rounded-lg mt-6">
                <ServerCrash className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No has apartado servicios</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Cuando apartes un servicio para uno de tus eventos, aparecerá aquí.
                </p>
            </div>
         );
    }

    return (
      <Tabs defaultValue="active" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="active">Servicios Activos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {renderBookingsList(activeBookings)}
        </TabsContent>
        <TabsContent value="history">
          {renderBookingsList(bookings)}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-2">Mis Servicios Apartados</h1>
        <p className="text-muted-foreground">Gestiona las reservas de servicios para tus eventos.</p>
        
        {renderContent()}

        {selectedBooking && (
          <ServiceBookingDetailsModal
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            booking={selectedBooking}
          />
        )}
      </main>
    </AuthenticatedLayout>
  );
}
