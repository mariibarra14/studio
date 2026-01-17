
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApp } from "@/context/app-context";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Loader2, AlertCircle, BarChart, PieChart, Users, DollarSign, Percent, Star, MessageSquare, Ticket } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, Pie, Cell, ResponsiveContainer, BarChart as RechartsBarChart, PieChart as RechartsPieChart, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { ApiEvent, User, ApiBooking, Payment, Survey, ForumThread, Product, Category } from "@/lib/types";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/utils";

const COLORS_EVENT_STATUS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];
const COLORS_BOOKING_STATUS = ["#82ca9d", "#ffc658", "#ff8042"];

type DashboardData = {
  allEvents: ApiEvent[];
  allUsers: User[];
  allBookings: ApiBooking[];
  allPayments: Payment[];
  allSurveys: Survey[];
  allCategories: Category[];
  forumActivity: { totalThreads: number; totalComments: number; };
  bestSellingProduct: { name: string; count: number; } | null;
};

export default function ControlPanelPage() {
  const { userRole, isLoadingUser, currency, language, conversionRates } = useApp();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    categoryId: "",
    startDate: "",
    endDate: "",
  });

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Sesión expirada.");
      setIsLoading(false);
      return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      // Parallel fetches for base data
      const [eventsRes, usersRes, bookingsRes, categoriesRes, forumsRes] = await Promise.all([
        fetch('http://localhost:44335/api/events', { headers }),
        fetch('http://localhost:44335/api/Usuarios/getTodosUsuarios', { headers }),
        fetch('http://localhost:44335/api/Reservas/todas', { headers }),
        fetch('http://localhost:44335/api/events/Categorias', { headers }),
        fetch('http://localhost:44335/api/foros/todos', { headers })
      ]);

      if (!eventsRes.ok || !usersRes.ok || !bookingsRes.ok || !categoriesRes.ok || !forumsRes.ok) {
        throw new Error("No se pudo cargar la información base del dashboard.");
      }

      const allEvents: ApiEvent[] = await eventsRes.json();
      const allUsers: User[] = await usersRes.json();
      const allBookings: ApiBooking[] = await bookingsRes.json();
      const allCategories: Category[] = await categoriesRes.json();
      const allForums: any[] = await forumsRes.json();

      // Dependent fetches
      const paymentPromises = allEvents.map(event =>
        fetch(`http://localhost:44335/api/Pagos/GetPagoPorIdEvento?idEvento=${event.id}`, { headers })
          .then(res => res.ok ? res.json() : [])
      );
      const allPaymentsArrays: Payment[][] = await Promise.all(paymentPromises);
      const allPayments = allPaymentsArrays.flat();

      const surveyPromises = allEvents.map(event =>
        fetch(`http://localhost:44335/api/foros/encuestas/evento/${event.id}`, { headers })
          .then(res => res.ok ? res.json() : [])
      );
      const allSurveysArrays: Survey[][] = await Promise.all(surveyPromises);
      const allSurveys = allSurveysArrays.flat();
      
      let totalThreads = 0, totalComments = 0;
      const threadPromises = allForums.map(forum =>
        fetch(`http://localhost:44335/api/foros/${forum.id}/hilos`, { headers })
      );
      const threadResults = await Promise.all(threadPromises);
      for (const res of threadResults) {
        if (res.ok) {
          const threads: ForumThread[] = await res.json();
          totalThreads += threads.length;
          totalComments += threads.reduce((sum, t) => sum + t.comentarios.length, 0);
        }
      }

      const confirmedBookings = allBookings.filter(b => b.estado === 'Confirmada');
      const compResPromises = confirmedBookings.map(b => fetch(`http://localhost:44335/api/ServComps/Resv/getReservaByIdReserva?idReserva=${b.reservaId}`, { headers }));
      const compResResults = await Promise.all(compResPromises);
      const productIds: string[] = [];
      for (const res of compResResults) {
        if (res.ok) {
            const data = await res.json();
            if (data && data.idsProducto) productIds.push(...data.idsProducto);
        }
      }
      
      const productIdCounts = productIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      let bestSellingProductId: string | null = null;
      let maxCount = 0;
      Object.entries(productIdCounts).forEach(([id, count]) => {
        if (count > maxCount) {
          maxCount = count;
          bestSellingProductId = id;
        }
      });
      
      let bestSellingProductData: { name: string; count: number } | null = null;
      if (bestSellingProductId) {
        const productRes = await fetch(`http://localhost:44335/api/ServComps/Prods/getProductoById?id=${bestSellingProductId}`, { headers });
        if (productRes.ok) {
            const product: Product = await productRes.json();
            bestSellingProductData = { name: product.nombre, count: maxCount };
        }
      }

      setData({
        allEvents, allUsers, allBookings, allPayments, allSurveys, allCategories,
        forumActivity: { totalThreads, totalComments },
        bestSellingProduct: bestSellingProductData,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingUser && (userRole === 'administrador' || userRole === 'soporte_tecnico')) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, isLoadingUser, userRole]);

  const filteredData = useMemo(() => {
    if (!data) return null;

    let filteredEvents = data.allEvents;
    if (filters.categoryId) {
      filteredEvents = filteredEvents.filter(e => e.categoriaId === filters.categoryId);
    }
    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(e => new Date(e.createdAt) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filteredEvents = filteredEvents.filter(e => new Date(e.createdAt) <= endOfDay);
    }

    const filteredEventIds = new Set(filteredEvents.map(e => e.id));
    const filteredPayments = data.allPayments.filter(p => filteredEventIds.has(p.idEvento));
    const filteredBookings = data.allBookings.filter(b => filteredEventIds.has(b.eventId));

    return { ...data, allEvents: filteredEvents, allPayments: filteredPayments, allBookings: filteredBookings };
  }, [data, filters]);

  const kpis = useMemo(() => {
    if (!filteredData) return { totalRevenue: 0, avgOccupancy: 0, totalUsers: 0, bestSellingProduct: null, avgRating: 0, forumActivity: {totalThreads: 0, totalComments: 0} };
    
    const totalRevenue = filteredData.allPayments.reduce((sum, p) => sum + p.monto, 0);
    const totalCapacity = filteredData.allEvents.reduce((sum, e) => sum + e.aforoMaximo, 0);
    const confirmedTickets = filteredData.allBookings
      .filter(b => b.estado === 'Confirmada')
      .reduce((sum, b) => sum + b.asientos.length, 0);
    const avgOccupancy = totalCapacity > 0 ? (confirmedTickets / totalCapacity) * 100 : 0;
    
    const avgRating = filteredData.allSurveys.length > 0 
        ? filteredData.allSurveys.reduce((sum, s) => sum + s.calificacion, 0) / filteredData.allSurveys.length
        : 0;

    return {
      totalRevenue,
      avgOccupancy,
      totalUsers: filteredData.allUsers.length,
      bestSellingProduct: filteredData.bestSellingProduct,
      avgRating,
      forumActivity: filteredData.forumActivity,
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (!filteredData) return { eventStatus: [], bookingStatus: [], topEvents: [] };

    const eventStatus = Object.entries(
      filteredData.allEvents.reduce((acc, event) => {
        const status = event.estado || 'Desconocido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const bookingStatus = Object.entries(
      filteredData.allBookings.reduce((acc, booking) => {
        let status = booking.estado;
        if (status === 'Hold' && new Date(booking.expiraEn) < new Date()) {
          status = 'Expirada';
        }
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const eventsWithRevenue = filteredData.allEvents.map(event => {
      const revenue = filteredData.allPayments
        .filter(p => p.idEvento === event.id)
        .reduce((sum, p) => sum + p.monto, 0);
      return { name: event.nombre, revenue };
    });
    const topEvents = eventsWithRevenue.sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return { eventStatus, bookingStatus, topEvents };
  }, [filteredData]);


  if (isLoadingUser) {
    return <AuthenticatedLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></AuthenticatedLayout>;
  }
  
  if (userRole !== 'administrador' && userRole !== 'soporte_tecnico') {
    return <AuthenticatedLayout><div className="p-8"><Alert variant="destructive"><AlertCircle/><AlertTitle>Acceso Denegado</AlertTitle><AlertDescription>No tienes permisos para ver esta página.</AlertDescription></Alert></div></AuthenticatedLayout>;
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 p-4 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32"/>)}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
            <Skeleton className="h-80"/>
            <Skeleton className="h-80"/>
            <Skeleton className="h-80"/>
          </div>
        </main>
      </AuthenticatedLayout>
    );
  }
  
  if (error) {
     return <AuthenticatedLayout><div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertTitle>Error al Cargar Dashboard</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div></AuthenticatedLayout>
  }
  
  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Panel de Control</h1>
            <p className="text-muted-foreground">Una vista general del rendimiento de la plataforma.</p>
          </div>
          <DashboardFilters filters={filters} setFilters={setFilters} categories={data?.allCategories || []} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard title="Ingresos Totales" value={formatCurrency(kpis.totalRevenue, currency, language, conversionRates)} icon={DollarSign} description="Suma de todos los pagos confirmados."/>
            <StatCard title="Ocupación Promedio" value={`${kpis.avgOccupancy.toFixed(1)}%`} icon={Percent} description="Tickets confirmados vs. capacidad total."/>
            <StatCard title="Usuarios Totales" value={kpis.totalUsers.toLocaleString()} icon={Users} description="Total de usuarios registrados."/>
            <StatCard title="Producto Estrella" value={kpis.bestSellingProduct?.name || 'N/A'} icon={Ticket} description={`Vendido ${kpis.bestSellingProduct?.count || 0} veces.`}/>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Estado de Eventos</CardTitle><CardDescription>Distribución de todos los eventos.</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={chartData.eventStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {chartData.eventStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_EVENT_STATUS[index % COLORS_EVENT_STATUS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Top 5 Eventos por Ingresos</CardTitle><CardDescription>Los eventos más rentables.</CardDescription></CardHeader>
            <CardContent>
               <ResponsiveContainer width="100%" height={250}>
                    <RechartsBarChart data={chartData.topEvents} layout="vertical" margin={{ left: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={150} />
                        <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={4} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

           <Card>
            <CardHeader><CardTitle>Balance de Reservas</CardTitle><CardDescription>Estado de todas las reservas creadas.</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={chartData.bookingStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {chartData.bookingStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_BOOKING_STATUS[index % COLORS_BOOKING_STATUS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <StatCard title="Rating Global" value={`${kpis.avgRating.toFixed(2)} / 5`} icon={Star} description={`Basado en ${data?.allSurveys.length.toLocaleString()} valoraciones.`}/>

          <Card>
            <CardHeader><CardTitle>Actividad de Comunidad</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-muted/50 rounded-lg">
                    <MessageSquare className="h-6 w-6 mx-auto text-primary"/>
                    <p className="text-2xl font-bold mt-2">{kpis.forumActivity.totalThreads.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Hilos Creados</p>
                </div>
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <Users className="h-6 w-6 mx-auto text-primary"/>
                    <p className="text-2xl font-bold mt-2">{kpis.forumActivity.totalComments.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Comentarios Totales</p>
                </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </AuthenticatedLayout>
  );
}
