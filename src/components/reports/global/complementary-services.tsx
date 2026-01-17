"use client";

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, ShoppingBag } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import type { ApiBooking, ComplementaryService, Product } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type ProductStat = Product & { salesCount: number; revenue: number };
type ServiceStat = ComplementaryService & { products: ProductStat[], totalRevenue: number };

export function ComplementaryServicesReport() {
    const [stats, setStats] = useState<ServiceStat[]>([]);
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
            const [allServicesRes, allBookingsRes] = await Promise.all([
                fetch('http://localhost:44335/api/ServComps/Servs/getTodosServicios', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:44335/api/Reservas/todas', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!allServicesRes.ok || !allBookingsRes.ok) throw new Error("No se pudo cargar la información de servicios o reservas.");
            
            const allServices: ComplementaryService[] = await allServicesRes.json();
            const allBookings: ApiBooking[] = await allBookingsRes.json();
            const confirmedBookings = allBookings.filter(b => b.estado === 'Confirmada');

            const productSales: Record<string, { serviceId: string; count: number }> = {};
            
            for (const booking of confirmedBookings) {
                const compRes = await fetch(`http://localhost:44335/api/ServComps/Resv/getReservaByIdReserva?idReserva=${booking.reservaId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (compRes.ok) {
                    const compData = await compRes.json();
                    if (compData.idsProducto) {
                        for (const prodId of compData.idsProducto) {
                            if (!productSales[prodId]) {
                                productSales[prodId] = { serviceId: '', count: 0 };
                            }
                            productSales[prodId].count++;
                        }
                    }
                }
            }

            const productIds = Object.keys(productSales);
            const productDetails: Product[] = await Promise.all(
                productIds.map(async prodId => {
                    const prodRes = await fetch(`http://localhost:44335/api/ServComps/Prods/getProductoById?id=${prodId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                    return prodRes.ok ? prodRes.json() : null;
                })
            ).then(results => results.filter(p => p !== null));
            
            productDetails.forEach(p => {
                if(productSales[p.id]) {
                    productSales[p.id].serviceId = p.idServicio;
                }
            });

            const serviceStats = allServices.map(service => {
                const serviceProducts: ProductStat[] = productDetails
                    .filter(p => p.idServicio === service.id)
                    .map(p => ({
                        ...p,
                        salesCount: productSales[p.id]?.count || 0,
                        revenue: (productSales[p.id]?.count || 0) * p.precio
                    }));
                
                const totalRevenue = serviceProducts.reduce((sum, p) => sum + p.revenue, 0);

                return { ...service, products: serviceProducts, totalRevenue };
            });

            setStats(serviceStats.sort((a, b) => b.totalRevenue - a.totalRevenue));

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
        return <Card><CardHeader><CardTitle>Rendimiento de Servicios</CardTitle></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>;
    }

    if (error) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag/>Rendimiento de Servicios Complementarios</CardTitle></CardHeader>
            <CardContent>
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
                                        <p className="font-semibold text-base">{formatCurrency(service.totalRevenue, currency, language, conversionRates)}</p>
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
                                                        <TableCell className="text-right">{formatCurrency(product.revenue, currency, language, conversionRates)}</TableCell>
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
            </CardContent>
        </Card>
    );
}
