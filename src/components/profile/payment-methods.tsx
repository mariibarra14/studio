
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

type PaymentMethod = {
  idMPago: string;
  marca: string;
  ultimos4: string;
  mesExpiracion: string;
  anioExpiracion: number;
  predeterminado: boolean;
  fechaRegistro: string;
};

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

  const handleRemove = (id: string) => {
    // API call to delete would go here
    setPaymentMethods(prev => prev.filter(pm => pm.idMPago !== id));
    toast({
      title: "Método de Pago Eliminado",
      description: `La tarjeta seleccionada ha sido eliminada.`,
      variant: "destructive"
    });
  };

  const handleSetPrimary = (id: string) => {
     // API call to set primary would go here
    setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        predeterminado: pm.idMPago === id,
    })));
    toast({
        title: "Método Principal Actualizado",
        description: "Tu método de pago principal ha sido cambiado."
    });
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
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Primer Método
                    </Button>
                </DialogTrigger>
                <AddPaymentMethodDialog />
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
                                <Input value={`${method.mesExpiracion}/${method.anioExpiracion}`} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label>CVC</Label>
                                <Input value="•••" readOnly />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between flex-wrap gap-2">
                    {!method.predeterminado && (
                        <DialogClose asChild>
                            <Button variant="outline" onClick={() => handleSetPrimary(method.idMPago)}>Marcar como Principal</Button>
                        </DialogClose>
                    )}
                    <DialogClose asChild>
                        <Button variant="destructive" onClick={() => handleRemove(method.idMPago)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Tarjeta
                        </Button>
                    </DialogClose>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
            ))}
        </div>

        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Nuevo Método
                </Button>
            </DialogTrigger>
            <AddPaymentMethodDialog />
        </Dialog>
    </div>
  );
}

const AddPaymentMethodDialog = () => (
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Agregar Nuevo Método de Pago</DialogTitle>
            <DialogDescription>Ingresa los detalles de tu nueva tarjeta.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="new-card-number">Número de Tarjeta</Label>
                <Input id="new-card-number" placeholder="•••• •••• •••• ••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="new-expiry-date">Fecha de Expiración</Label>
                    <Input id="new-expiry-date" placeholder="MM/AA" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-cvc">CVC</Label>
                    <Input id="new-cvc" placeholder="•••" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="new-billing-address">Dirección de Facturación</Label>
                <Input id="new-billing-address" placeholder="123 Calle Principal, Cualquier Ciudad" />
            </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Agregar Tarjeta</Button>
        </DialogFooter>
    </DialogContent>
);

    

    