
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, BarChart2 } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import type { OrganizerStat } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type ReportProps = {
    stats: OrganizerStat[];
};

export function OrganizerRankingReport({ stats }: ReportProps) {
    const { currency, language } = useApp();

    if (!stats) {
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 />Ranking de Organizadores</CardTitle>
            </CardHeader>
            <CardContent>
                {stats.length > 0 ? (
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
                                            <p className="font-semibold text-base">{formatCurrency(organizer.totalRevenue, currency, language)}</p>
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
                                                            <TableCell className="text-right font-medium">{formatCurrency(event.revenue, currency, language)}</TableCell>
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
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No hay datos de organizadores para mostrar.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
