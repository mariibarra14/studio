
"use client";

import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter } from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import { mockEvents, MockEvent } from "@/lib/mock-data";
import { EventReservationModal } from "@/components/events/event-reservation-modal";
import { useState } from "react";

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<MockEvent | null>(null);

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Eventos</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Evento
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockEvents.map((event) => (
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
