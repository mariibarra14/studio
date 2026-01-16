"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useApp } from "@/context/app-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Inbox, Edit, Star, Users, MessageSquare, Calendar as CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import type { ApiEvent, Survey } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/surveys/StarRating';

// Component for the list item in the left panel
const EventListItem = ({ event, isSelected, onSelect }: { event: ApiEvent, isSelected: boolean, onSelect: () => void }) => {
    const { i18n } = useTranslation();
    const locale = i18n.language === 'es' ? es : enUS;

    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-4",
                isSelected ? "bg-primary/10" : "hover:bg-muted/50"
            )}
        >
            <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0 bg-muted">
                {event.imagenUrl ? (
                    <Image src={event.imagenUrl} alt={event.nombre || ''} fill className="object-cover" />
                ) : null}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{event.nombre}</p>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{format(new Date(event.inicio), 'dd MMM yyyy', { locale })}</span>
                </div>
            </div>
        </button>
    );
};

// Main component for the page
export default function MySurveysPage() {
  const { user, userRole, isLoadingUser } = useApp();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'es' ? es : enUS;
  
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);

  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Fetch organizer's events
  const fetchMyEvents = useCallback(async () => {
    if (!user) return;
    setIsLoadingEvents(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(`http://localhost:44335/api/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("No se pudieron cargar tus eventos.");
      
      const allEvents: ApiEvent[] = await response.json();
      const myEvents = allEvents.filter(e => e.organizadorId === user.id);
      
      const sortedEvents = myEvents.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
      setEvents(sortedEvents);

      // Automatically select the first event if list is not empty
      if (sortedEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(sortedEvents[0]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [user, selectedEvent]);

  // Fetch surveys for the selected event
  const fetchSurveysForEvent = useCallback(async (eventId: string) => {
    setIsLoadingSurveys(true);
    setSurveys([]);
    setError(null);
    const token = localStorage.getItem("accessToken");

    try {
        const response = await fetch(`http://localhost:44335/api/foros/encuestas/evento/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 404) {
            setSurveys([]);
            return;
        }
        if (!response.ok) {
            throw new Error("No se pudieron cargar las valoraciones de este evento.");
        }
        const data: Survey[] = await response.json();
        setSurveys(data);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoadingSurveys(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingUser && user && (userRole === 'organizador' || userRole === 'administrador')) {
      fetchMyEvents();
    } else if (!isLoadingUser) {
        setIsLoadingEvents(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, user, userRole]);

  useEffect(() => {
    if (selectedEvent) {
      fetchSurveysForEvent(selectedEvent.id);
    }
  }, [selectedEvent, fetchSurveysForEvent]);

  const globalRating = useMemo(() => {
      if (surveys.length === 0) return 0;
      const total = surveys.reduce((acc, survey) => acc + survey.calificacion, 0);
      return total / surveys.length;
  }, [surveys]);


  const renderLeftPanel = () => {
      if (isLoadingEvents) {
          return (
              <div className="space-y-2 p-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
              </div>
          );
      }
      if (events.length === 0) {
          return (
              <div className="text-center p-8">
                  <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-semibold">No has creado eventos</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                      Cuando crees un evento y recibas valoraciones, aparecerán aquí.
                  </p>
              </div>
          );
      }
      return (
          <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                  {events.map(event => (
                      <EventListItem
                          key={event.id}
                          event={event}
                          isSelected={selectedEvent?.id === event.id}
                          onSelect={() => setSelectedEvent(event)}
                      />
                  ))}
              </div>
          </ScrollArea>
      );
  };
  
  const renderRightPanel = () => {
    if (!selectedEvent && !isLoadingEvents) {
        return (
             <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                    <Edit className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 font-semibold">Selecciona un Evento</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Elige un evento de la lista para ver sus valoraciones.
                    </p>
                </div>
            </div>
        )
    }
    
    if (isLoadingEvents || isLoadingSurveys) {
        return (
             <div className="space-y-4 p-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }
    
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="relative h-48 p-0 overflow-hidden rounded-t-lg">
                {selectedEvent?.imagenUrl ? (
                    <Image src={selectedEvent.imagenUrl} alt={selectedEvent.nombre!} fill className="object-cover"/>
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                        <h2 className="text-2xl font-bold">{selectedEvent?.nombre}</h2>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                    <h2 className="text-2xl font-bold text-white">{selectedEvent?.nombre}</h2>
                </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 overflow-y-auto">
                <Card className="mb-6 bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-xl">Resumen de Valoraciones</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center justify-around gap-6">
                        <div className="text-center">
                            <p className="text-5xl font-bold text-primary">{globalRating.toFixed(1)}</p>
                            <StarRating rating={globalRating} readOnly size={24} />
                        </div>
                        <div className="text-center">
                            <p className="text-5xl font-bold">{surveys.length}</p>
                            <p className="text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4"/> Valoraciones Totales</p>
                        </div>
                    </CardContent>
                </Card>

                <h3 className="text-lg font-semibold mb-4">Opiniones de los Asistentes</h3>
                
                 {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error al cargar valoraciones</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {surveys.length > 0 ? (
                    <div className="space-y-4">
                        {surveys.map(survey => (
                            <Card key={survey.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <StarRating rating={survey.calificacion} readOnly size={20} />
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(survey.fechaCreacion), 'dd/MM/yyyy', { locale })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">"{survey.comentario || 'El usuario no dejó un comentario.'}"</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !error && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h4 className="mt-4 font-semibold">Sin Valoraciones Todavía</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Este evento aún no ha recibido valoraciones por parte de los asistentes.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">{t('my_surveys.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
            <div className="md:col-span-1 h-full">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Mis Eventos</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        {renderLeftPanel()}
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 h-full">
                {renderRightPanel()}
            </div>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
