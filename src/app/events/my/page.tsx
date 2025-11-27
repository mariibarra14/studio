
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-context";
import { PlusCircle, Search, AlertCircle, CalendarX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiEvent } from "@/lib/types";
import { MyEventCard } from "@/components/events/my-event-card";
import { MyEventDetailsModal } from "@/components/events/my-event-details-modal";
import { useToast } from "@/hooks/use-toast";

export default function MyEventsPage() {
  const { user, userRole, isLoadingUser } = useApp();
  const [allEvents, setAllEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { toast } = useToast();


  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:44335/api/events", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("No se pudieron cargar los eventos.");
      }
      
      const data: ApiEvent[] = await response.json();
      setAllEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchEvents();
    } else if (!isLoadingUser) {
        setIsLoading(false);
    }
  }, [user, isLoadingUser, fetchEvents]);

  const myEvents = useMemo(() => {
    if (!user) return [];
    
    const userEvents = allEvents.filter(event => event.organizadorId === user.id);

    if (!searchQuery) {
        return userEvents;
    }

    return userEvents.filter(event =>
      event.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allEvents, user, searchQuery]);

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleCloseModal = () => {
    setSelectedEventId(null);
  };
  
  const handleDeleteSuccess = () => {
    toast({
        title: "Evento Eliminado",
        description: "El evento ha sido eliminado exitosamente.",
    });
    setSelectedEventId(null); // Cierra la vista de detalles
    fetchEvents(); // Recarga la lista de eventos
  };


  const renderContent = () => {
    if (isLoading || isLoadingUser) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      );
    }
    
    if (selectedEventId) {
        return (
            <MyEventDetailsModal 
              eventId={selectedEventId} 
              onClose={handleCloseModal}
              onDeleteSuccess={handleDeleteSuccess}
            />
        );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4 bg-card">
          <Alert variant="destructive" className="max-w-md border-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al Cargar Eventos</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchEvents} className="mt-6">
            Reintentar
          </Button>
        </div>
      );
    }

    if (myEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
            <CalendarX className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
                {searchQuery ? "No se encontraron eventos" : "No has creado eventos todavía"}
            </h2>
            <p className="text-muted-foreground max-w-sm mb-6">
                {searchQuery 
                    ? "Prueba con otro término de búsqueda." 
                    : "Cuando crees un evento, aparecerá aquí para que puedas gestionarlo."
                }
            </p>
            {!searchQuery && (
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear mi primer evento
                </Button>
            )}
        </div>
      );
    }

    return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {myEvents.map((event) => (
          <MyEventCard key={event.id} event={event} onEventClick={handleEventClick} />
        ))}
      </div>
    );
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        {!selectedEventId && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold">Mis Eventos</h1>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar mis eventos..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
                {(userRole === 'organizador' || userRole === 'administrador') && (
                <Button className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Evento
                </Button>
                )}
            </div>
            </div>
        )}
        {renderContent()}
      </main>
    </AuthenticatedLayout>
  );
}
