
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, ShoppingBag } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import type { ServiceStat } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type ReportProps = {
    stats: ServiceStat[];
};

export function ComplementaryServicesReport({ stats }: ReportProps) {
    const { currency, language } = useApp();

    if (!stats) {
        return <Card><CardHeader><CardTitle>Rendimiento de Servicios</CardTitle></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag/>Rendimiento de Servicios Complementarios</CardTitle></CardHeader>
            <CardContent>
                {stats.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {stats.map((service) => (
                            <AccordionItem value={service.id} key={service.id}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold text-base">{service.nombre}</p>
                                            <p className="text-sm text-muted-foreground">{service.tipo}</p>
                                        </div>
                                        <div className="text-right pr-4">
                                            <p className="font-semibold text-base">{formatCurrency(service.totalRevenue, currency, language)}</p>
                                            <p className="text-sm text-muted-foreground">Total Recaudado</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-8 pr-4 py-2 bg-muted/50 rounded-md">
                                        <h4 className="font-semibold mb-2">Desglose de Productos:</h4>
                                        {service.products.length > 0 ? (
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Ventas</TableHead><TableHead className="text-right">Recaudación</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {service.products.sort((a,b) => b.revenue - a.revenue).map(product => (
                                                        <TableRow key={product.id}>
                                                            <TableCell>{product.nombre}</TableCell>
                                                            <TableCell>{product.salesCount}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(product.revenue, currency, language)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">Este servicio no tuvo productos vendidos.</p>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No hay datos de servicios complementarios para mostrar.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
