"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Receipt, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { EnrichedPayment, Payment } from "@/lib/types";
import { PaymentHistoryCard } from "./payment-history-card";

const fetchEventInfo = async (eventId: string, token: string) => {
    try {
        const response = await fetch(`http://localhost:44335/api/events/${eventId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) return await response.json();
        return null;
    } catch (error) {
        console.error('Error fetching event info:', error);
        return null;
    }
};

const fetchReservationInfo = async (reservaId: string, token: string) => {
    try {
        const response = await fetch(`http://localhost:44335/api/Reservas/${reservaId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) return await response.json();
        return null;
    } catch (error) {
        console.error('Error fetching reservation info:', error);
        return null;
    }
};

const fetchPaymentMethodInfo = async (idMPago: string, token: string) => {
    try {
        const response = await fetch(`http://localhost:44335/api/Pagos/getMPagoPorIdMPago?idMPago=${idMPago}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) return await response.json();
        return null;
    } catch (error) {
        console.error('Error fetching payment method info:', error);
        return null;
    }
};


export function PaymentHistory() {
    const [payments, setPayments] = useState<EnrichedPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchPaymentHistory = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            setError("No estás autenticado o tu sesión ha expirado.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:44335/api/Pagos/GetPagosPorIdUsuario?idUsuario=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("No se pudo cargar el historial de pagos.");
            }

            const basePayments: Payment[] = await response.json();

            if (basePayments.length === 0) {
              setPayments([]);
              setIsLoading(false);
              return;
            }
            
            const enrichedPayments = await Promise.all(
                basePayments.map(async (payment) => {
                    try {
                        const [eventInfo, reservationInfo, paymentMethodInfo] = await Promise.all([
                            fetchEventInfo(payment.idEvento, token),
                            fetchReservationInfo(payment.idReserva, token),
                            fetchPaymentMethodInfo(payment.idMPago, token)
                        ]);

                        return {
                            ...payment,
                            evento: eventInfo,
                            reserva: reservationInfo,
                            metodoPago: paymentMethodInfo
                        };
                    } catch (enrichError) {
                        console.error(`Error enriching payment ${payment.idPago}:`, enrichError);
                        return { ...payment, evento: null, reserva: null, metodoPago: null };
                    }
                })
            );
            
            setPayments(enrichedPayments.sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPaymentHistory();
    }, [fetchPaymentHistory]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold">Historial de Pagos</h1>
                <Button 
                    onClick={fetchPaymentHistory} 
                    variant="outline"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error al Cargar Historial</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isLoading && !error && payments.length === 0 && (
                <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-lg text-center p-8">
                    <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-muted-foreground mb-2">No hay pagos realizados</h3>
                    <p className="text-sm text-muted-foreground">Cuando completes un pago, aparecerá aquí.</p>
                </div>
            )}

            {!isLoading && !error && payments.length > 0 && (
                <div className="space-y-4">
                    {payments.map((payment) => (
                        <PaymentHistoryCard key={payment.idPago} payment={payment} />
                    ))}
                </div>
            )}
        </div>
    );
}
