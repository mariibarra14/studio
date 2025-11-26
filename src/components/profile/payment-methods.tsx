
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Wifi, Cog, AlertCircle, RefreshCw, Loader2, Star, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/app-context";
import { Badge } from "@/components/ui/badge";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { AddPaymentMethodForm } from "./add-payment-method-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


type PaymentMethod = {
  idMPago: string;
  marca: string;
  ultimos4: string;
  mesExpiracion: string;
  anioExpiracion: number;
  predeterminado: boolean;
  fechaRegistro: string;
};

const STRIPE_PUBLIC_KEY = "pk_test_51RbrjtRKEQAOXjwp02QqVDCwVbfw6y8NM7pW5QkxO25bm1WY7qAlTcBB8yvjW7ABumuQodttdrB7VZNSrvRmN9RO00ITLC6ytk";
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

const formatCardBrand = (brand: string) => {
    const lowerBrand = brand.toLowerCase();
    if (lowerBrand.includes("visa")) return "Visa";
    if (lowerBrand.includes("master")) return "Mastercard";
    if (lowerBrand.includes("amex") || lowerBrand.includes("american")) return "Amex";
    return brand.charAt(0).toUpperCase() + brand.slice(1);
};

const CardComponent = ({ method }: { method: PaymentMethod }) => {
    const cardColor = formatCardBrand(method.marca) === 'Visa' ? "from-purple-500 to-indigo-600" : "from-pink-500 to-rose-500";

    return (
        <div className={cn("relative h-48 w-full rounded-xl text-white shadow-lg transition-transform hover:scale-105 overflow-hidden bg-gradient-to-br", cardColor)}>
            <div className="absolute top-4 right-4 text-2xl font-bold uppercase tracking-wider">{formatCardBrand(method.marca)}</div>
            <div className="absolute top-4 left-4">
                <Wifi className="h-6 w-6 transform -rotate-90" />
            </div>
            <div className="absolute bottom-4 left-4 right-4">
                <p className="font-mono text-xl tracking-widest">•••• •••• •••• {method.ultimos4}</p>
                <div className="flex justify-between items-end mt-4">
                    <div>
                        <p className="text-xs uppercase">Registrada</p>
                        <p className="text-sm font-medium">{new Date(method.fechaRegistro).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase">Expira</p>
                        <p className="text-sm font-medium">{String(method.mesExpiracion).padStart(2, '0')}/{String(method.anioExpiracion).slice(-2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PaymentMethodSkeleton = () => (
    <div className="relative w-full max-w-sm justify-self-center">
        <Skeleton className="h-48 w-full rounded-xl" />
    </div>
);

export function PaymentMethods() {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSettingPrimary, setIsSettingPrimary] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('accessToken');

    if (!userId || !token) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/Pagos/getMPagoPorIdUsuario?idUsuario=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      } else if (response.status === 401) {
        setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      } else {
        setError("No pudimos cargar tus métodos de pago. Por favor, intenta nuevamente más tarde.");
      }
    } catch (err) {
      setError("No pudimos cargar tus métodos de pago. Por favor, intenta nuevamente más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);
  
  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    fetchPaymentMethods();
  };

  const handleRemove = async (id: string) => {
    setIsDeleting(id);
    const token = localStorage.getItem('accessToken');
    if (!token) {
        toast({ variant: "destructive", title: "Error", description: "Tu sesión ha expirado." });
        setIsDeleting(null);
        return;
    }

    try {
        const response = await fetch(`http://localhost:44335/api/Pagos/eliminarMPago?idMPago=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            toast({
                title: "Método de Pago Eliminado",
                description: `La tarjeta seleccionada ha sido eliminada.`
            });
            setPaymentMethods(prev => prev.filter(pm => pm.idMPago !== id));
        } else {
            let errorMessage = "No se pudo eliminar el método de pago.";
            if (response.status === 401) errorMessage = "Tu sesión ha expirado.";
            if (response.status === 404) errorMessage = "El método de pago no fue encontrado.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Error de Conexión", description: "No se pudo conectar al servidor." });
    } finally {
        setIsDeleting(null);
    }
  };


  const handleSetPrimary = async (paymentMethodId: string) => {
    setIsSettingPrimary(paymentMethodId);
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('accessToken');

    if (!userId || !token) {
        toast({ variant: "destructive", title: "Error", description: "Tu sesión ha expirado." });
        setIsSettingPrimary(null);
        return;
    }

    try {
        const response = await fetch(`http://localhost:44335/api/Pagos/actualizarMPagoPredeterminado?idMPago=${paymentMethodId}&idUsuario=${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            toast({
                title: "Método Principal Actualizado",
                description: "Tu método de pago principal ha sido cambiado."
            });
            await fetchPaymentMethods(); // Refresh the list
        } else {
            const errorText = await response.text();
            let errorMessage = "Ocurrió un error al actualizar. Intenta de nuevo.";
            if (response.status === 401) errorMessage = "Tu sesión ha expirado.";
            if (response.status === 404) errorMessage = "El método de pago no fue encontrado.";
            if (response.status === 500) errorMessage = "Error del servidor. Por favor, intenta nuevamente más tarde.";
            
            toast({
                variant: "destructive",
                title: "Error al actualizar",
                description: errorMessage,
            });
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error de Conexión",
            description: "No se pudo conectar con el servidor.",
        });
    } finally {
        setIsSettingPrimary(null);
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PaymentMethodSkeleton />
                <PaymentMethodSkeleton />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-center p-8">
            <Alert variant="destructive" className="max-w-md border-0 bg-transparent">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al Cargar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={fetchPaymentMethods} className="mt-6">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
            </Button>
        </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-center p-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground mb-2">
              Aún no tienes métodos de pago
            </p>
            <p className="text-sm text-muted-foreground mb-6">Agrega una tarjeta para realizar tus compras de forma más rápida.</p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Primer Método
                    </Button>
                </DialogTrigger>
                <AddPaymentMethodDialog onSuccessfulAdd={handleSuccess} />
            </Dialog>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentMethods.map((method) => (
                <Dialog key={method.idMPago}>
                  <DialogTrigger asChild>
                      <button className={cn(
                          "relative w-full max-w-sm rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 justify-self-center",
                          method.predeterminado && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          )}>
                          <CardComponent method={method} />
                          {method.predeterminado && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  Principal
                              </div>
                          )}
                      </button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                      <DialogTitle>Detalles de la Tarjeta</DialogTitle>
                      <DialogDescription>Detalles para tu tarjeta {formatCardBrand(method.marca)} que termina en {method.ultimos4}.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                          <div className="space-y-2">
                              <Label>Número de Tarjeta</Label>
                              <Input value={`•••• •••• •••• ${method.ultimos4}`} readOnly />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label>Fecha de Expiración</Label>
                                  <Input value={`${String(method.mesExpiracion).padStart(2, '0')}/${String(method.anioExpiracion).slice(-2)}`} readOnly />
                              </div>
                              <div className="space-y-2">
                                  <Label>CVC</Label>
                                  <Input value="•••" readOnly />
                              </div>
                          </div>
                      </div>
                      <DialogFooter className="sm:justify-between flex-wrap gap-2">
                      {!method.predeterminado && (
                          <Button variant="outline" onClick={() => handleSetPrimary(method.idMPago)} disabled={!!isSettingPrimary}>
                              {isSettingPrimary === method.idMPago ? <Loader2 className="animate-spin mr-2"/> : <Star className="mr-2 h-4 w-4" />}
                              Marcar como Principal
                          </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={!!isDeleting}>
                            {isDeleting === method.idMPago ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Eliminar Tarjeta
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción es permanente y eliminará tu método de pago. No podrás deshacer esta acción.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemove(method.idMPago)}>
                                    Continuar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      </DialogFooter>
                  </DialogContent>
                </Dialog>
            ))}
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Nuevo Método
                </Button>
            </DialogTrigger>
            <AddPaymentMethodDialog onSuccessfulAdd={handleSuccess} />
        </Dialog>
    </div>
  );
}

const AddPaymentMethodDialog = ({ onSuccessfulAdd }: { onSuccessfulAdd: () => void }) => {
    const { user } = useApp();

    if (!user) {
        return (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Error</DialogTitle>
                    <DialogDescription>Debe iniciar sesión para agregar un método de pago.</DialogDescription>
                </DialogHeader>
            </DialogContent>
        );
    }
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Agregar Nuevo Método de Pago</DialogTitle>
                <DialogDescription>Ingresa los detalles de tu nueva tarjeta. Tu información de pago es procesada de forma segura por Stripe.</DialogDescription>
            </DialogHeader>
            <Elements stripe={stripePromise}>
                <AddPaymentMethodForm user={user} onSuccessfulAdd={onSuccessfulAdd} />
            </Elements>
        </DialogContent>
    );
};

    