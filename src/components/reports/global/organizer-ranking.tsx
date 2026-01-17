"use client";

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Crown, BarChart2 } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import type { User } from '@/context/app-context';
import type { ApiEvent, Payment } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type OrganizerStat = User & {
    eventCount: number;
    totalRevenue: number;
    events: (ApiEvent & { revenue: number })[];
};

export function OrganizerRankingReport() {
    const [stats, setStats] = useState<OrganizerStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { currency, language, conversionRates } = useApp();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError("Sesión expirada.");
            setIsLoading(false);
            return;
        }

        try {
            // Fetch all users and all events in parallel
            const [usersRes, eventsRes] = await Promise.all([
                fetch(`http://localhost:44335/api/Usuarios/todos`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`http://localhost:44335/api/events`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!usersRes.ok || !eventsRes.ok) throw new Error("No se pudo cargar la información base de usuarios o eventos.");

            const allUsers: User[] = await usersRes.json();
            const allEvents: ApiEvent[] = await eventsRes.json();
            
            const organizers = allUsers.filter(u => u.rol === 'organizador');

            const organizerStats: OrganizerStat[] = await Promise.all(
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
                            } catch (e) {
                                // Ignore payment fetch errors for a single event
                            }
                            return { ...event, revenue: eventRevenue };
                        })
                    );

                    return {
                        ...organizer,
                        eventCount: organizerEvents.length,
                        totalRevenue,
                        events: eventsWithRevenue,
                    };
                })
            );

            // Sort by total revenue
            setStats(organizerStats.sort((a, b) => b.totalRevenue - a.totalRevenue));

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Ranking de Organizadores</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    if (error) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 />Ranking de Organizadores</CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {stats.map((organizer, index) => (
                        <AccordionItem value={organizer.id} key={organizer.id}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-4 w-full">
                                    <span className="font-bold text-lg w-8 text-center">{index + 1}</span>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-base flex items-center gap-2">
                                            {organizer.nombre} {organizer.apellido}
                                            {index === 0 && <Crown className="h-5 w-5 text-yellow-500"/>}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{organizer.correo}</p>
                                    </div>
                                    <div className="text-right pr-4">
                                        <p className="font-semibold text-base">{formatCurrency(organizer.totalRevenue, currency, language, conversionRates)}</p>
                                        <p className="text-sm text-muted-foreground">{organizer.eventCount} eventos</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pl-12 pr-4 py-2 bg-muted/50 rounded-md">
                                    <h4 className="font-semibold mb-2">Eventos y Recaudación:</h4>
                                    {organizer.events.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Evento</TableHead>
                                                    <TableHead className="text-right">Recaudación</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {organizer.events.sort((a,b) => b.revenue - a.revenue).map(event => (
                                                    <TableRow key={event.id}>
                                                        <TableCell>{event.nombre}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(event.revenue, currency, language, conversionRates)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Este organizador no tiene eventos con recaudación.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
