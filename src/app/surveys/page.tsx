"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useApp } from "@/context/app-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Inbox, Edit } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import type { ApiBooking, Survey } from "@/lib/types";
import { SurveyListItem } from "@/components/surveys/SurveyListItem";
import { SurveyForm } from "@/components/surveys/SurveyForm";
import { SurveyView } from "@/components/surveys/SurveyView";

export default function SurveysPage() {
  const { user, isLoadingUser, i18n } = useApp();
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<(ApiBooking & { survey?: Survey }) | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    try {
      const [bookingsRes, surveysRes] = await Promise.all([
        fetch(`http://localhost:44335/api/Reservas/usuario/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:44335/api/foros/encuestas/usuario/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (!bookingsRes.ok) throw new Error("No se pudieron cargar tus reservas.");
      const allBookings: ApiBooking[] = await bookingsRes.json();
      
      const userSurveys: Survey[] = surveysRes.ok ? await surveysRes.json() : [];
      setSurveys(userSurveys);

      const enrichedBookings = await Promise.all(
        allBookings.map(async (booking) => {
          let eventoNombre = "Evento no disponible";
          let eventoImagen = "";
          let eventoInicio = "";
          
          try {
            const eventoResponse = await fetch(`http://localhost:44335/api/events/${booking.eventId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (eventoResponse.ok) {
              const eventoData = await eventoResponse.json();
              eventoNombre = eventoData.nombre;
              eventoImagen = eventoData.imagenUrl || "";
              eventoInicio = eventoData.inicio;
            }
          } catch (e) {
            console.error("Error fetching event details for booking:", booking.reservaId, e);
          }

          return { ...booking, eventoNombre, eventoImagen, eventoInicio };
        })
      );
      setBookings(enrichedBookings);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoadingUser && user) {
      fetchData();
    } else if (!isLoadingUser && !user) {
        setIsLoading(false);
        setError("Usuario no encontrado. Por favor, inicia sesión.");
    }
  }, [isLoadingUser, user, fetchData]);

  const eligibleBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter(b => b.estado === 'Confirmada' && b.eventoInicio && new Date(b.eventoInicio) < now)
      .map(booking => {
        const survey = surveys.find(s => s.eventoId === booking.eventId);
        return { ...booking, survey };
      })
      .sort((a, b) => new Date(b.eventoInicio!).getTime() - new Date(a.eventoInicio!).getTime());
  }, [bookings, surveys]);

  useEffect(() => {
      if (!selectedBooking && eligibleBookings.length > 0) {
          setSelectedBooking(eligibleBookings[0]);
      } else if (selectedBooking) {
          const updatedSelected = eligibleBookings.find(b => b.reservaId === selectedBooking.reservaId);
          setSelectedBooking(updatedSelected || null);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleBookings]);

  const handleSurveySuccess = () => {
      fetchData();
  };

  const renderLeftPanel = () => {
      if (isLoading) {
          return (
              <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
              </div>
          );
      }
      if (eligibleBookings.length === 0) {
          return (
              <div className="text-center p-8">
                  <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-semibold">{i18n.t('surveys.no_events_to_rate_title')}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                      {i18n.t('surveys.no_events_to_rate_desc')}
                  </p>
              </div>
          );
      }
      return (
          <ScrollArea className="h-full">
              <div className="space-y-1 pr-4">
                  {eligibleBookings.map(booking => (
                      <SurveyListItem
                          key={booking.reservaId}
                          booking={booking}
                          isSelected={selectedBooking?.reservaId === booking.reservaId}
                          onSelect={() => setSelectedBooking(booking)}
                      />
                  ))}
              </div>
          </ScrollArea>
      );
  };
  
  const renderRightPanel = () => {
    if (isLoading) {
        return <Skeleton className="h-full w-full" />
    }
    if (!selectedBooking) {
        return (
             <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                    <Edit className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 font-semibold">{i18n.t('surveys.select_event_title')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {i18n.t('surveys.select_event_desc')}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="relative h-48 p-0 overflow-hidden rounded-t-lg">
                <Image src={selectedBooking.eventoImagen || '/placeholder.jpg'} alt={selectedBooking.eventoNombre!} fill className="object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                    <h2 className="text-2xl font-bold text-white">{selectedBooking.eventoNombre}</h2>
                </div>
            </CardHeader>
            <CardContent className="p-6 flex-1">
                {selectedBooking.survey ? (
                    <SurveyView survey={selectedBooking.survey} />
                ) : (
                    <SurveyForm booking={selectedBooking} onSuccess={handleSurveySuccess} />
                )}
            </CardContent>
        </Card>
    );
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">{i18n.t('surveys.title')}</h1>
        {error ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
                <div className="md:col-span-1 h-full">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>{i18n.t('surveys.attended_events_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-2">
                           {renderLeftPanel()}
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 h-full">
                    {renderRightPanel()}
                </div>
            </div>
        )}
      </main>
    </AuthenticatedLayout>
  );
}
