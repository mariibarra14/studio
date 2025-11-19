
"use client";

import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Search } from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin } from "lucide-react";
import { mockEvents, MockEvent } from "@/lib/mock-data";
import { EventReservationModal } from "@/components/events/event-reservation-modal";
import { useState, useMemo } from "react";

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<MockEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = useMemo(() => {
    if (!searchQuery) {
      return mockEvents;
    }
    return mockEvents.filter((event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Eventos</h1>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar eventos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Evento
            </Button>
          </div>
        </div>
        
        {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
                <Card
                key={event.id}
                className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer"
                onClick={() => setSelectedEvent(event)}
                >
                <CardHeader className="p-0">
                    <div className="relative h-48 w-full">
                    <Image
                        src={event.image.imageUrl}
                        alt={event.image.description}
                        data-ai-hint={event.image.imageHint}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-xl font-bold mb-2 line-clamp-2">
                    {event.name}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{event.date}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{event.location}</span>
                    </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <Button className="w-full" onClick={(e) => {
                        e.stopPropagation(); // Prevent card's onClick
                        setSelectedEvent(event);
                    }}>Reservar</Button>
                </CardFooter>
                </Card>
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
                <p className="text-2xl font-semibold text-muted-foreground mb-4">No se encontraron eventos</p>
                <p className="text-muted-foreground">Intenta con otro término de búsqueda o ajusta los filtros.</p>
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
