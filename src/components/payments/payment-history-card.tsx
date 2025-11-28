"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Ticket, DollarSign, Calendar, CreditCard } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import type { EnrichedPayment } from "@/lib/types";
import { generateReceiptPDF } from "@/lib/receipt-generator";

export function PaymentHistoryCard({ payment }: { payment: EnrichedPayment }) {
    const [isPrinting, setIsPrinting] = useState(false);
    const { toast } = useToast();

    const handlePrintReceipt = async () => {
        setIsPrinting(true);
        try {
            await generateReceiptPDF(payment);
            toast({
                title: "Recibo Generado",
                description: "Tu recibo se ha descargado correctamente."
            });
        } catch (error) {
            console.error("Error generating receipt PDF:", error);
            toast({
                variant: "destructive",
                title: "Error al generar recibo",
                description: "No se pudo crear el archivo PDF. Inténtalo de nuevo."
            });
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                           <Ticket className="h-5 w-5 text-primary" /> 
                           {payment.evento?.nombre || 'Evento no disponible'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            ID de Pago: {payment.idPago}
                        </p>
                    </div>
                    <Badge variant={payment.reserva?.estado === 'Confirmada' ? 'default' : 'secondary'} className="self-start sm:self-center">
                        {payment.reserva?.estado || 'Estado Desconocido'}
                    </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 text-sm border-t border-b py-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold text-muted-foreground">Fecha de Pago</p>
                            <p>
                                {new Date(payment.fechaPago).toLocaleDateString('es-ES', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold text-muted-foreground">Monto Pagado</p>
                            <p className="font-bold text-lg">${payment.monto.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold text-muted-foreground">Método de Pago</p>
                             <p className="capitalize">
                                {payment.metodoPago ? 
                                    `${payment.metodoPago.marca} •••• ${payment.metodoPago.ultimos4}` : 
                                    'No disponible'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center pt-4">
                    <Button 
                        onClick={handlePrintReceipt}
                        disabled={isPrinting}
                        variant="outline"
                        size="sm"
                    >
                        {isPrinting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Printer className="h-4 w-4 mr-2" />
                        )}
                        Imprimir Recibo
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
