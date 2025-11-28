"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle, Circle, AlertTriangle, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

type PaymentMethod = {
  idMPago: string;
  idUsuario: string;
  marca: string;
  mesExpiracion: number;
  anioExpiracion: number;
  ultimos4: string;
  predeterminado: boolean;
};

export function PaymentProcessing() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventName, setEventName] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const reservaId = searchParams.get('reservaId');
  const eventId = searchParams.get('eventId');
  const monto = parseFloat(searchParams.get('monto') || '0');

  useEffect(() => {
    if (!reservaId || !eventId || !monto) {
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        toast({ variant: "destructive", title: "Error de Sesión", description: "Por favor, inicia sesión de nuevo." });
        router.push('/login');
        return;
      }

      try {
        const [methodsResponse, eventResponse] = await Promise.all([
          fetch(`http://localhost:44335/api/Pagos/getMPagoPorIdUsuario?idUsuario=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:44335/api/events/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (methodsResponse.ok) {
          const data: PaymentMethod[] = await methodsResponse.json();
          setPaymentMethods(data);
          const defaultMethod = data.find(m => m.predeterminado);
          if (defaultMethod) {
            setSelectedMethod(defaultMethod.idMPago);
          }
        }

        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          setEventName(eventData.nombre);
        }

      } catch (error) {
        toast({ variant: "destructive", title: "Error de Red", description: "No se pudo cargar la información necesaria." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [reservaId, eventId, monto, router, toast]);

  const handleProcessPayment = async () => {
    if (!selectedMethod) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona un método de pago." });
      return;
    }

    setIsProcessing(true);
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    const paymentData = {
      idMPago: selectedMethod,
      idUsuario: userId,
      idReserva: reservaId,
      idEvento: eventId,
      fechaPago: new Date().toISOString(),
      monto: monto
    };

    try {
      const response = await fetch(`http://localhost:44335/api/Pagos/AgregarPago?idMPago=${selectedMethod}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });
      
      if (response.status === 201) {
        toast({
          title: "✅ Pago Exitoso",
          description: "Tu reserva ha sido confirmada. Serás redirigido.",
        });
        setTimeout(() => router.push('/bookings'), 2000);
      } else {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `Error ${response.status} al procesar el pago.`);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error en el Pago", description: err.message });
      setIsProcessing(false);
    }
  };

  const renderPaymentMethods = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (paymentMethods.length === 0) {
      return (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No tienes métodos de pago guardados.</p>
          <Button onClick={() => router.push('/profile')}>
            <CreditCard className="mr-2" />
            Añadir Método de Pago
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <div
            key={method.idMPago}
            className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
              selectedMethod === method.idMPago
                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                : 'border-muted hover:border-primary/50'
            }`}
            onClick={() => setSelectedMethod(method.idMPago)}
          >
            <div className="flex items-center gap-4">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-medium capitalize">{method.marca} {method.predeterminado && <span className="text-xs text-primary">(Predeterminado)</span>}</p>
                <p className="text-sm text-muted-foreground">Terminada en {method.ultimos4} • Expira: {String(method.mesExpiracion).padStart(2, '0')}/{method.anioExpiracion}</p>
              </div>
            </div>
            {selectedMethod === method.idMPago ? <CheckCircle className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground/50" />}
          </div>
        ))}
      </div>
    );
  };

  if (!reservaId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
        <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-2xl font-semibold text-muted-foreground mb-2">
          No hay pagos pendientes
        </p>
        <p className="text-muted-foreground">
          Para realizar un pago, primero selecciona una reserva desde la sección "Mis Reservas".
        </p>
         <Button onClick={() => router.push('/bookings')} className="mt-6">Ver mis reservas</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-8 mt-8">
      <h1 className="text-3xl font-bold">Procesar Pago de Reserva</h1>
      <Card>
        <CardHeader>
          <CardTitle>Resumen de la Compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
              <>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Evento:</span>
                <span className="font-medium">{eventName || "Cargando..."}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ID Reserva:</span>
                <span className="font-mono text-sm">{reservaId?.substring(0, 12)}...</span>
              </div>
            </>
          )}
            <div className="flex justify-between items-baseline text-2xl font-bold border-t pt-4 mt-4">
            <span>Total a Pagar:</span>
            <span>${monto?.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Método de Pago</CardTitle>
          <CardDescription>Elige una de tus tarjetas guardadas para completar el pago.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderPaymentMethods()}
        </CardContent>
        <CardFooter>
            <Button
            onClick={handleProcessPayment}
            disabled={!selectedMethod || isProcessing || isLoading || paymentMethods.length === 0}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-5 w-5" />
            )}
            {isProcessing ? "Procesando..." : `Pagar $${monto?.toFixed(2)}`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
