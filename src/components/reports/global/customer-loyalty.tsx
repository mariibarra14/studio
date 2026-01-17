
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import type { CustomerStat } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ReportProps = {
    stats: CustomerStat[];
};

export function CustomerLoyaltyReport({ stats }: ReportProps) {
    const { currency, language } = useApp();

    if (!stats) {
        return <Card><CardHeader><CardTitle>Fidelización de Clientes</CardTitle></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>;
    }
    
    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Heart/>Fidelización de Clientes</CardTitle></CardHeader>
            <CardContent>
                {stats.length > 0 ? (
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
                                            <p className="font-semibold text-base">{formatCurrency(customer.totalSpent, currency, language)}</p>
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
                                                        <TableCell className="text-right">{formatCurrency(booking.precioTotal, currency, language)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No hay datos de clientes para mostrar.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
