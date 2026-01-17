"use client";

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Heart } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import type { User } from '@/context/app-context';
import type { ApiEvent, ApiBooking } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type CustomerStat = {
    user: User;
    bookingCount: number;
    totalSpent: number;
    bookings: (ApiBooking & { eventName: string })[];
};

export function CustomerLoyaltyReport() {
    const [stats, setStats] = useState<CustomerStat[]>([]);
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
            const [bookingsRes, eventsRes] = await Promise.all([
                fetch(`http://localhost:44335/api/Reservas/todas`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`http://localhost:44335/api/events`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!bookingsRes.ok || !eventsRes.ok) throw new Error("No se pudo cargar la información de reservas o eventos.");

            const allBookings: ApiBooking[] = await bookingsRes.json();
            const allEvents: ApiEvent[] = await eventsRes.json();
            const eventsMap = new Map(allEvents.map(e => [e.id, e.nombre]));

            const confirmedBookings = allBookings.filter(b => b.estado === 'Confirmada');

            const bookingsByUser = confirmedBookings.reduce((acc, booking) => {
                if (!acc[booking.usuarioId]) {
                    acc[booking.usuarioId] = [];
                }
                acc[booking.usuarioId].push({ ...booking, eventName: eventsMap.get(booking.eventId) || 'Evento Desconocido' });
                return acc;
            }, {} as Record<string, (ApiBooking & { eventName: string })[]>);

            const userIds = Object.keys(bookingsByUser);
            const userDetails: User[] = await Promise.all(
                userIds.map(async userId => {
                    const userRes = await fetch(`http://localhost:44335/api/Usuarios/getUsuarioById?id=${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                    return userRes.ok ? userRes.json() : null;
                })
            ).then(results => results.filter(u => u !== null));

            const userMap = new Map(userDetails.map(u => [u.id, u]));

            const customerStats: CustomerStat[] = userIds.map(userId => {
                const userBookings = bookingsByUser[userId];
                const totalSpent = userBookings.reduce((sum, b) => sum + b.precioTotal, 0);
                return {
                    user: userMap.get(userId)!,
                    bookingCount: userBookings.length,
                    totalSpent,
                    bookings: userBookings,
                };
            }).filter(stat => stat.user); // Filter out any stats where user details couldn't be fetched

            setStats(customerStats.sort((a, b) => b.totalSpent - a.totalSpent));

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
        return <Card><CardHeader><CardTitle>Fidelización de Clientes</CardTitle></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>;
    }
    
    if (error) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Heart/>Fidelización de Clientes</CardTitle></CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {stats.map((customer, index) => (
                        <AccordionItem value={customer.user.id} key={customer.user.id}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-4 w-full">
                                    <span className="font-bold text-lg w-8 text-center">{index + 1}</span>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-base">{customer.user.nombre} {customer.user.apellido}</p>
                                        <p className="text-sm text-muted-foreground">{customer.user.correo}</p>
                                    </div>
                                    <div className="text-right pr-4">
                                        <p className="font-semibold text-base">{formatCurrency(customer.totalSpent, currency, language, conversionRates)}</p>
                                        <p className="text-sm text-muted-foreground">{customer.bookingCount} reservas</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                               <div className="pl-12 pr-4 py-2 bg-muted/50 rounded-md">
                                    <h4 className="font-semibold mb-2">Reservas Confirmadas:</h4>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Evento</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {customer.bookings.map(booking => (
                                                <TableRow key={booking.reservaId}>
                                                    <TableCell>{booking.eventName}</TableCell>
                                                    <TableCell>{format(new Date(booking.creadaEn), "dd/MM/yyyy", { locale: es })}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(booking.precioTotal, currency, language, conversionRates)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
