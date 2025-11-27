
"use client";

import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Button } from "@/components/ui/button";
import { Filter, Search, AlertCircle, Calendar, MapPin, X } from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EventReservationModal } from "@/components/events/event-reservation-modal";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiEvent } from "@/lib/types";
import { useApp } from "@/context/app-context";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getAllCategories } from "@/lib/categories";
import { FiltersSheet } from "@/components/events/filters-sheet";
import { Badge } from "@/components/ui/badge";

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userRole } = useApp();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const categories = getAllCategories();

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError("No estás autenticado. Por favor, inicia sesión de nuevo.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:44335/api/events", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        }
        if (response.status === 404) {
          setEvents([]); // Set events to empty array on 404
          return;
        }
        throw new Error(`Error ${response.status}: Error al cargar los eventos.`);
      }
      const data: ApiEvent[] = await response.json();
      setEvents(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          setError("No se pudo conectar con el servidor. Verifique su conexión o inténtelo de nuevo más tarde.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Ha ocurrido un error inesperado al cargar los eventos.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
        const searchMatch = event.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        
        const categoryMatch = !selectedCategory || event.categoriaId === selectedCategory;

        let dateMatch = true;
        if (dateRange.start || dateRange.end) {
            const eventDate = new Date(event.inicio);
            eventDate.setHours(0,0,0,0); // Compare dates only
            
            if (dateRange.start) {
                const startDate = new Date(dateRange.start);
                if (eventDate < startDate) dateMatch = false;
            }
            if (dateRange.end) {
                const endDate = new Date(dateRange.end);
                if (eventDate > endDate) dateMatch = false;
            }
        }
        
        return searchMatch && categoryMatch && dateMatch;
    });
  }, [searchQuery, events, selectedCategory, dateRange]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setDateRange({ start: "", end: "" });
  };
  
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategory) count++;
    if (dateRange.start || dateRange.end) count++;
    return count;
  }, [searchQuery, selectedCategory, dateRange]);


  const EventCard = ({ event }: { event: ApiEvent }) => {
    const eventDate = new Date(event.inicio);
    return (
        <Card
            className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer group"
            onClick={() => setSelectedEvent(event)}
        >
            <CardHeader className="p-0">
                <div className="relative aspect-video w-full">
                {event.imagenUrl ? (
                    <Image
                        src={event.imagenUrl}
                        alt={event.descripcion || event.nombre}
                        data-ai-hint="event cover"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600 to-orange-500/20">
                        <p className="text-center font-bold text-white p-4">{event.nombre}</p>
                    </div>
                )}

                <div className="absolute top-3 left-3 bg-background/90 rounded-lg p-2 text-center shadow-md">
                    <p className="text-xs font-bold uppercase text-primary">
                        {format(eventDate, "MMM", { locale: es })}
                    </p>
                    <p className="text-xl font-bold">
                        {format(eventDate, "dd")}
                    </p>
                </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {event.nombre}
                </CardTitle>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                        {format(eventDate, "EEEE, h:mm a", { locale: es })}
                    </span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{event.lugar}</span>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                }}>Reservar</Button>
            </CardFooter>
        </Card>
    );
  };

  const EventCardSkeleton = () => (
    <Card className="overflow-hidden shadow-lg flex flex-col">
      <CardHeader className="p-0">
        <Skeleton className="h-48 w-full" />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold mb-1">Eventos Disponibles</h1>
                <p className="text-muted-foreground">Encuentra tu próxima experiencia inolvidable.</p>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setIsFiltersOpen(true)} className="relative">
                    <Filter className="mr-2 h-4 w-4"/>
                    Filtrar
                    {activeFiltersCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{activeFiltersCount}</Badge>
                    )}
                </Button>
            </div>
        </div>

        <FiltersSheet
            isOpen={isFiltersOpen}
            onClose={() => setIsFiltersOpen(false)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            dateRange={dateRange}
            setDateRange={setDateRange}
            categories={categories}
            clearFilters={clearFilters}
        />
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
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
        ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
                <p className="text-2xl font-semibold text-muted-foreground mb-4">No se encontraron eventos</p>
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory || dateRange.start || dateRange.end
                    ? "Intenta con otros filtros o un término de búsqueda diferente."
                    : "No hay eventos disponibles en este momento."}
                </p>
            </div>
        )}
      </main>
      {selectedEvent && (
        <EventReservationModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </AuthenticatedLayout>
  );
}
