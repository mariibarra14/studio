
"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle, Circle, AlertTriangle, Wallet, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { ApiBooking, Product } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PaymentMethod = {
  idMPago: string;
  idUsuario: string;
  marca: string;
  ultimos4: string;
  mesExpiracion: number;
  anioExpiracion: number;
  predeterminado: boolean;
};

function PaymentForm({ reservaId, eventId, monto }: { reservaId: string, eventId: string, monto: number }) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventName, setEventName] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
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
        // START: Confirm complementary services reservation
        try {
            const compResResponse = await fetch(`http://localhost:44335/api/ServComps/Resv/getReservaByIdReserva?idReserva=${reservaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (compResResponse.ok) {
                const compResData = await compResResponse.json();
                const complementaryReservationId = compResData.id;

                if (complementaryReservationId) {
                    const confirmCompResResponse = await fetch(`http://localhost:44335/api/ServComps/Resv/confirmar?idReserva=${complementaryReservationId}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!confirmCompResResponse.ok) {
                        toast({
                            variant: "destructive",
                            title: "Error de Sincronización",
                            description: "Hubo un problema al marcar sus servicios como confirmados. Por favor, guarde su comprobante y revise 'Mis Reservas' en unos minutos.",
                            duration: 8000
                        });
                    }
                }
            }
        } catch (compError) {
            console.error("Error during complementary service confirmation:", compError);
            toast({
                variant: "destructive",
                title: "Error de Sincronización",
                description: "Hubo un problema al marcar sus servicios como confirmados. Por favor, guarde su comprobante y revise 'Mis Reservas' en unos minutos.",
                duration: 8000
            });
        }
        // END: Confirm complementary services reservation
        
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

  return (
    <div className="max-w-2xl mx-auto grid gap-8 mt-8">
       <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/payments')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
          <h1 className="text-3xl font-bold">Procesar Pago de Reserva</h1>
      </div>
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
  )
}

function PendingPaymentsList() {
    const [pendingBookings, setPendingBookings] = useState<ApiBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const fetchPendingBookings = async () => {
            setIsLoading(true);
            setError(null);
            const token = localStorage.getItem('accessToken');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                setError("No estás autenticado. Por favor, inicia sesión.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:44335/api/Reservas/usuario/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error("No se pudieron cargar las reservas pendientes.");
                }

                const allBookings: ApiBooking[] = await response.json();
                const now = new Date();
                const holdBookings = allBookings.filter(b => b.estado === 'Hold' && new Date(b.expiraEn) > now);

                const enrichedBookings = await Promise.all(
                    holdBookings.map(async (booking) => {
                        let eventoNombre = "Evento no disponible";
                        let complementaryProducts: Product[] = [];

                        try {
                            const eventResponse = await fetch(`http://localhost:44335/api/events/${booking.eventId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (eventResponse.ok) {
                                const eventData = await eventResponse.json();
                                eventoNombre = eventData.nombre;
                            }

                            const complementaryRes = await fetch(`http://localhost:44335/api/ServComps/Resv/getReservaByIdReserva?idReserva=${booking.reservaId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (complementaryRes.ok) {
                                const complementaryData = await complementaryRes.json();
                                if (complementaryData && complementaryData.idsProducto && complementaryData.idsProducto.length > 0) {
                                    const productPromises = complementaryData.idsProducto.map((productId: string) => 
                                    fetch(`http://localhost:44335/api/ServComps/Prods/getProductoById?id=${productId}`, {
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    }).then(res => res.ok ? res.json() : null)
                                    );
                                    
                                    const fetchedProducts = await Promise.all(productPromises);
                                    complementaryProducts = fetchedProducts.filter((p): p is Product => p !== null);
                                }
                            }
                        } catch (e) {
                            console.error(`Error enriching booking ${booking.reservaId}:`, e);
                        }

                        return { ...booking, eventoNombre, complementaryProducts };
                    })
                );

                setPendingBookings(enrichedBookings);

            } catch (err: any) {
                setError(err.message);
                toast({ variant: "destructive", title: "Error", description: err.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPendingBookings();
    }, [toast]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex flex-col items-center justify-center h-96">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error al cargar pagos pendientes</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
         )
    }

    if (pendingBookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
                <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-2xl font-semibold text-muted-foreground mb-2">
                    No tienes pagos pendientes
                </p>
                <p className="text-muted-foreground">
                    Cuando realices una reserva, aparecerá aquí para que puedas completarla.
                </p>
                <Button onClick={() => router.push('/events')} className="mt-6">Explorar Eventos</Button>
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto grid gap-6 mt-8">
             <h1 className="text-3xl font-bold">Pagos Pendientes</h1>
             <Card>
                <CardHeader>
                    <CardTitle>Tus Reservas por Pagar</CardTitle>
                    <CardDescription>Selecciona una reserva para proceder al pago.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {pendingBookings.map(booking => {
                        const productsTotal = booking.complementaryProducts?.reduce((sum, p) => sum + p.precio, 0) || 0;
                        const grandTotal = booking.precioTotal + productsTotal;

                        return (
                            <div key={booking.reservaId} className="border rounded-lg p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                                <div>
                                    <p className="font-semibold">{booking.eventoNombre || `Evento ${booking.eventId.substring(0,8)}...`}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Expira: {format(new Date(booking.expiraEn), "dd MMM yyyy, h:mm a", { locale: es })}
                                    </p>
                                    <p className="font-bold mt-1">${grandTotal.toFixed(2)}</p>
                                </div>
                                <Button onClick={() => router.push(`/payments?reservaId=${booking.reservaId}&eventId=${booking.eventId}&monto=${grandTotal}`)}>
                                    Pagar ahora
                                </Button>
                            </div>
                        )
                    })}
                </CardContent>
             </Card>
        </div>
    )

}

export function PaymentProcessing() {
  const searchParams = useSearchParams();
  const reservaId = searchParams.get('reservaId');
  const eventId = searchParams.get('eventId');
  const monto = parseFloat(searchParams.get('monto') || '0');

  if (reservaId && eventId && monto > 0) {
    return <PaymentForm reservaId={reservaId} eventId={eventId} monto={monto} />;
  }

  return <PendingPaymentsList />;
}

    