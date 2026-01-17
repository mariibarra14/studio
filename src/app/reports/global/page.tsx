
"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/app-context";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Loader2, AlertCircle, Download, Crown, Heart, ShoppingBag } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { OrganizerRankingReport } from "@/components/reports/global/organizer-ranking";
import { CustomerLoyaltyReport } from "@/components/reports/global/customer-loyalty";
import { ComplementaryServicesReport } from "@/components/reports/global/complementary-services";
import { generateGlobalReportPDF } from "@/lib/global-report-generator";
import type { User } from '@/context/app-context';
import type { ApiEvent, Payment, ApiBooking, ComplementaryService, Product, OrganizerStat, CustomerStat, ServiceStat } from '@/lib/types';


export default function GlobalReportsPage() {
  const { userRole, isLoadingUser, currency, language, conversionRates } = useApp();

  const [organizerStats, setOrganizerStats] = useState<OrganizerStat[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStat[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([]);
  
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllReportsData = useCallback(async () => {
    setIsLoadingReports(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError("Sesión expirada.");
        setIsLoadingReports(false);
        return;
    }

    try {
        // Fetch all base data in parallel
        const [usersRes, eventsRes, allBookingsRes, allServicesRes] = await Promise.all([
            fetch(`http://localhost:44335/api/Usuarios/getTodosUsuarios`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`http://localhost:44335/api/events`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`http://localhost:44335/api/Reservas/todas`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:44335/api/ServComps/Servs/getTodosServicios', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        if (!usersRes.ok || !eventsRes.ok || !allBookingsRes.ok || !allServicesRes.ok) {
            throw new Error("No se pudo cargar la información base para los reportes.");
        }

        const allUsers: User[] = await usersRes.json();
        const allEvents: ApiEvent[] = await eventsRes.json();
        const allBookings: ApiBooking[] = await allBookingsRes.json();
        const allServices: ComplementaryService[] = await allServicesRes.json();

        // --- Process Organizer Ranking ---
        const organizers = allUsers.filter(u => u.rol === 'organizador');
        const processedOrganizerStats: OrganizerStat[] = await Promise.all(
            organizers.map(async (organizer) => {
                const organizerEvents = allEvents.filter(e => e.organizadorId === organizer.id);
                let totalRevenue = 0;
                const eventsWithRevenue = await Promise.all(
                    organizerEvents.map(async (event) => {
                        let eventRevenue = 0;
                        try {
                            const paymentsRes = await fetch(`http://localhost:44335/api/Pagos/GetPagoPorIdEvento?idEvento=${event.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                            if (paymentsRes.ok) {
                                const payments: Payment[] = await paymentsRes.json();
                                eventRevenue = payments.reduce((sum, p) => sum + p.monto, 0);
                                totalRevenue += eventRevenue;
                            }
                        } catch (e) { /* Ignore single event payment fetch errors */ }
                        return { ...event, revenue: eventRevenue };
                    })
                );
                return { ...organizer, eventCount: organizerEvents.length, totalRevenue, events: eventsWithRevenue };
            })
        );
        setOrganizerStats(processedOrganizerStats.sort((a, b) => b.totalRevenue - a.totalRevenue));

        // --- Process Customer Loyalty ---
        const eventsMap = new Map(allEvents.map(e => [e.id, e.nombre]));
        const confirmedBookings = allBookings.filter(b => b.estado === 'Confirmada');
        const bookingsByUser = confirmedBookings.reduce((acc, booking) => {
            if (!acc[booking.usuarioId]) acc[booking.usuarioId] = [];
            acc[booking.usuarioId].push({ ...booking, eventName: eventsMap.get(booking.eventId) || 'Evento Desconocido' });
            return acc;
        }, {} as Record<string, (ApiBooking & { eventName: string })[]>);

        const userMap = new Map(allUsers.map(u => [u.id, u]));
        const processedCustomerStats: CustomerStat[] = Object.keys(bookingsByUser).map(userId => {
            const userBookings = bookingsByUser[userId];
            const totalSpent = userBookings.reduce((sum, b) => sum + b.precioTotal, 0);
            return { user: userMap.get(userId)!, bookingCount: userBookings.length, totalSpent, bookings: userBookings };
        }).filter(stat => stat.user);
        setCustomerStats(processedCustomerStats.sort((a, b) => b.totalSpent - a.totalSpent));

        // --- Process Service Performance ---
        const productSales: Record<string, { serviceId: string; count: number }> = {};
        for (const booking of confirmedBookings) {
            const compRes = await fetch(`http://localhost:44335/api/ServComps/Resv/getReservaByIdReserva?idReserva=${booking.reservaId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (compRes.ok) {
                const compData = await compRes.json();
                if (compData.idsProducto) {
                    for (const prodId of compData.idsProducto) {
                        if (!productSales[prodId]) productSales[prodId] = { serviceId: '', count: 0 };
                        productSales[prodId].count++;
                    }
                }
            }
        }
        const productDetails: Product[] = await Promise.all(
            Object.keys(productSales).map(async prodId => {
                const prodRes = await fetch(`http://localhost:44335/api/ServComps/Prods/getProductoById?id=${prodId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                return prodRes.ok ? prodRes.json() : null;
            })
        ).then(results => results.filter(p => p !== null));
        productDetails.forEach(p => { if(productSales[p.id]) productSales[p.id].serviceId = p.idServicio; });
        const processedServiceStats = allServices.map(service => {
            const serviceProducts = productDetails.filter(p => p.idServicio === service.id).map(p => ({
                ...p,
                salesCount: productSales[p.id]?.count || 0,
                revenue: (productSales[p.id]?.count || 0) * p.precio
            }));
            const totalRevenue = serviceProducts.reduce((sum, p) => sum + p.revenue, 0);
            return { ...service, products: serviceProducts, totalRevenue };
        });
        setServiceStats(processedServiceStats.sort((a, b) => b.totalRevenue - a.totalRevenue));

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === 'administrador' || userRole === 'soporte_tecnico') {
        fetchAllReportsData();
    }
  }, [userRole, fetchAllReportsData]);


  if (isLoadingUser) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </AuthenticatedLayout>
    );
  }

  if (userRole !== 'administrador' && userRole !== 'soporte_tecnico') {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acceso Denegado</AlertTitle>
            <AlertDescription>No tienes permiso para ver esta página.</AlertDescription>
          </Alert>
        </main>
      </AuthenticatedLayout>
    );
  }
  
  const handleDownloadReport = () => {
    generateGlobalReportPDF({
        organizerStats,
        customerStats,
        serviceStats,
        currency,
        language
    });
  }

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reportes Globales</h1>
            <p className="text-muted-foreground">Visión consolidada del rendimiento de la plataforma.</p>
          </div>
          <Button onClick={handleDownloadReport} disabled={isLoadingReports || !!error}>
              <Download className="mr-2 h-4 w-4" />
              Descargar Reporte Global
          </Button>
        </div>
        
        {isLoadingReports ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        ) : error ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al Cargar Reportes</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : (
            <Tabs defaultValue="organizers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="organizers"><Crown className="mr-2"/>Ranking de Organizadores</TabsTrigger>
                <TabsTrigger value="customers"><Heart className="mr-2"/>Fidelización de Clientes</TabsTrigger>
                <TabsTrigger value="services"><ShoppingBag className="mr-2"/>Rendimiento de Servicios</TabsTrigger>
            </TabsList>
            <TabsContent value="organizers">
                <OrganizerRankingReport stats={organizerStats} />
            </TabsContent>
            <TabsContent value="customers">
                <CustomerLoyaltyReport stats={customerStats} />
            </TabsContent>
            <TabsContent value="services">
                <ComplementaryServicesReport stats={serviceStats} />
            </TabsContent>
            </Tabs>
        )}

      </main>
    </AuthenticatedLayout>
  );
}
