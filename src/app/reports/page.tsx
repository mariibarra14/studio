
"use client";

import { useState, useEffect, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useApp } from "@/context/app-context";
import { Loader2, AlertCircle, BarChart2, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiEvent, ReportData, Category, Zone } from "@/lib/types";
import { generateSalesReportPDF, generateConversionReportPDF } from "@/lib/report-generator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const { user, userRole, isLoadingUser, currency, language, conversionRates } = useApp();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMyEvents = useCallback(async () => {
    if (!user) return;
    setIsLoadingEvents(true);
    setError(null);
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch('http://localhost:44335/api/events', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error("No se pudieron cargar tus eventos.");
      const allEvents: ApiEvent[] = await response.json();
      
      const now = new Date();

      const myEvents = allEvents.filter(event => {
        const isOwner = (userRole === 'administrador') || (event.organizadorId === user.id);
        const hasFinished = event.fin ? new Date(event.fin) < now : false;
        return isOwner && hasFinished;
      });

      setEvents(myEvents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    if (!isLoadingUser && user) {
      fetchMyEvents();
    }
  }, [isLoadingUser, user, fetchMyEvents]);

  const handleGenerateReport = useCallback(async (eventId: string) => {
    setIsLoadingReport(true);
    setReportData(null);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError("Tu sesión ha expirado.");
        setIsLoadingReport(false);
        return;
    }

    try {
        const selectedEvent = events.find(e => e.id === eventId);
        if (!selectedEvent) throw new Error("Evento no encontrado");
        
        // Fetch all required data in parallel where possible
        const [
            paymentsRes,
            reservationsRes,
            surveysRes,
            zonasRes,
            organizerRes,
            categoriesRes
        ] = await Promise.all([
            fetch(`http://localhost:44335/api/Pagos/GetPagoPorIdEvento?idEvento=${eventId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`http://localhost:44335/api/Reservas/todas`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`http://localhost:44335/api/foros/encuestas/evento/${eventId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`http://localhost:44335/api/events/${eventId}/zonas`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`http://localhost:44335/api/Usuarios/getUsuarioById?id=${selectedEvent.organizadorId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`http://localhost:44335/api/events/Categorias`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        const payments = paymentsRes.ok ? await paymentsRes.json() : [];
        const allReservations = reservationsRes.ok ? await reservationsRes.json() : [];
        const surveys = surveysRes.ok ? await surveysRes.json() : [];
        const zonas: Zone[] = zonasRes.ok ? await zonasRes.json() : [];
        const organizer = organizerRes.ok ? await organizerRes.json() : null;
        const categories: Category[] = categoriesRes.ok ? await categoriesRes.json() : [];

        const category = categories.find(c => c.id === selectedEvent.categoriaId);

        // Process Reservations for conversion analysis
        const eventReservations = allReservations.filter((r: any) => r.eventId === eventId);
        const totalReservations = eventReservations.length;
        const confirmedReservations = eventReservations.filter((r: any) => r.estado === 'Confirmada').length;
        const cancelledReservations = totalReservations - confirmedReservations;

        // Process Sales
        const ticketSales: { [key: string]: { name: string; count: number; revenue: number } } = {};
        
        // Pre-fetch all reservation details for payments
        const reservationDetailsMap = new Map();
        await Promise.all(payments.map(async (p: any) => {
            if (!reservationDetailsMap.has(p.idReserva)) {
                const res = await fetch(`http://localhost:44335/api/Reservas/${p.idReserva}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if(res.ok) reservationDetailsMap.set(p.idReserva, await res.json());
            }
        }));

        payments.forEach((p: any) => {
            const reservation = reservationDetailsMap.get(p.idReserva);
            if (reservation) {
                const zona = zonas.find(z => z.id === reservation.zonaEventoId);
                if (zona) {
                    if (!ticketSales[zona.id]) {
                        ticketSales[zona.id] = { name: zona.nombre, count: 0, revenue: 0 };
                    }
                    ticketSales[zona.id].count += reservation.asientos.length;
                    ticketSales[zona.id].revenue += p.monto;
                }
            }
        });
        
        const totalTicketRevenue = Object.values(ticketSales).reduce((sum, zone) => sum + zone.revenue, 0);

        // Process Complementary Services Sales
        const compServiceSales: { [key: string]: { name: string; count: number; revenue: number } } = {};
        const confirmedResIds = eventReservations.filter((r: any) => r.estado === 'Confirmada').map((r: any) => r.id);
        
        if (confirmedResIds.length > 0) {
            const compReservationsRes = await Promise.all(
                confirmedResIds.map((resId: string) => 
                    fetch(`http://localhost:44335/api/ServComps/Resv/getReservaByIdReserva?idReserva=${resId}`, { headers: { 'Authorization': `Bearer ${token}` } })
                )
            );
            
            const productDetailsCache = new Map();
            for (const res of compReservationsRes) {
                if (res.ok) {
                    const compResData = await res.json();
                    if (compResData?.idsProducto) {
                        for (const prodId of compResData.idsProducto) {
                            let product = productDetailsCache.get(prodId);
                            if (!product) {
                                const prodRes = await fetch(`http://localhost:44335/api/ServComps/Prods/getProductoById?id=${prodId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                                if (prodRes.ok) {
                                    product = await prodRes.json();
                                    productDetailsCache.set(prodId, product);
                                }
                            }
                            if (product) {
                                if (!compServiceSales[prodId]) {
                                    compServiceSales[prodId] = { name: product.nombre, count: 0, revenue: 0 };
                                }
                                compServiceSales[prodId].count += 1;
                                compServiceSales[prodId].revenue += product.precio;
                            }
                        }
                    }
                }
            }
        }
        
        const totalServiceRevenue = Object.values(compServiceSales).reduce((sum, s) => sum + s.revenue, 0);

        // Process satisfaction
        const averageSatisfaction = surveys.length > 0
            ? surveys.reduce((acc: number, s: any) => acc + s.calificacion, 0) / surveys.length
            : 0;

        setReportData({
            event: selectedEvent,
            organizerName: organizer ? `${organizer.nombre} ${organizer.apellido}` : "N/A",
            categoryName: category?.nombre || "N/A",
            sales: {
                ticketSales: Object.values(ticketSales),
                serviceSales: Object.values(compServiceSales),
                totalTicketRevenue,
                totalServiceRevenue,
                grandTotal: totalTicketRevenue + totalServiceRevenue,
            },
            conversion: {
                totalReservations,
                confirmed: confirmedReservations,
                cancelled: cancelledReservations,
                confirmationRate: totalReservations > 0 ? (confirmedReservations / totalReservations) * 100 : 0,
            },
            satisfaction: {
                averageRating: averageSatisfaction,
                totalSurveys: surveys.length,
            },
        });
    } catch (err: any) {
        setError(err.message);
        toast({ variant: "destructive", title: "Error al generar reporte", description: err.message });
    } finally {
        setIsLoadingReport(false);
    }
  }, [events, toast]);
  
  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
                <BarChart2 className="h-6 w-6"/>
                Generador de Reportes
            </CardTitle>
            <CardDescription>Selecciona un evento para generar y descargar los reportes de rendimiento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label htmlFor="event-select" className="text-sm font-medium">Seleccionar Evento</label>
                {isLoadingEvents ? (
                    <Skeleton className="h-10 w-full mt-2" />
                ) : events.length > 0 ? (
                    <Select onValueChange={setSelectedEventId} value={selectedEventId || ""}>
                        <SelectTrigger id="event-select" className="mt-2"><SelectValue placeholder="Elige un evento..." /></SelectTrigger>
                        <SelectContent>
                            {events.map(event => <SelectItem key={event.id} value={event.id}>{event.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="mt-2 text-center p-4 border-2 border-dashed rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-sm">No tienes eventos finalizados para generar reportes en este momento.</p>
                    </div>
                )}
              </div>
              <Button onClick={() => selectedEventId && handleGenerateReport(selectedEventId)} disabled={!selectedEventId || isLoadingReport}>
                {isLoadingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Generar Reporte
              </Button>
            </div>
            
            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            {isLoadingReport && (
                <div className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                </div>
            )}

            {reportData && selectedEvent && (
                <div className="pt-6 border-t space-y-6">
                    <h3 className="text-xl font-bold text-center">Resumen para: {selectedEvent.nombre}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Ingresos Totales</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{formatCurrency(reportData.sales.grandTotal, currency, language, conversionRates)}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Tasa de Conversión</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{reportData.conversion.confirmationRate.toFixed(1)}%</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Satisfacción</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{reportData.satisfaction.averageRating.toFixed(1)} / 5.0</p></CardContent>
                        </Card>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="outline" onClick={() => generateSalesReportPDF(reportData)}>
                            <Download className="mr-2 h-4 w-4"/>Descargar Reporte de Ventas (PDF)
                        </Button>
                        <Button variant="outline" onClick={() => generateConversionReportPDF(reportData)}>
                            <Download className="mr-2 h-4 w-4"/>Descargar Reporte de Conversión (PDF)
                        </Button>
                     </div>
                </div>
            )}

            {!selectedEventId && !isLoadingReport && !isLoadingEvents && events.length > 0 && (
                 <div className="text-center py-10 text-muted-foreground">
                    <p>Por favor, selecciona un evento para comenzar.</p>
                 </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AuthenticatedLayout>
  );
}
