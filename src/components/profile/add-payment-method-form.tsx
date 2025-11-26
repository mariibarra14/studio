
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { User } from "@/context/app-context";
import { useRouter } from "next/navigation";

const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      color: "hsl(var(--foreground))",
      fontFamily: "Inter, sans-serif",
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "hsl(var(--muted-foreground))",
      },
    },
    invalid: {
      color: "hsl(var(--destructive))",
      iconColor: "hsl(var(--destructive))",
    },
  },
  hidePostalCode: true,
};

type AddPaymentMethodFormProps = {
  user: User;
  onSuccessfulAdd: () => void;
};

export function AddPaymentMethodForm({ user, onSuccessfulAdd }: AddPaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        setErrorMessage("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        setIsLoading(false);
        router.push("/login");
        return;
    }

    if (!stripe || !elements) {
      setErrorMessage("Stripe no se ha cargado correctamente. Intente de nuevo.");
      setIsLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage("El componente de tarjeta no se encontró. Intente de nuevo.");
      setIsLoading(false);
      return;
    }

    // 1. Create Stripe Payment Method
    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (stripeError) {
      setErrorMessage(stripeError.message ?? "Ocurrió un error con Stripe.");
      setIsLoading(false);
      return;
    }

    const idMPagoStripe = paymentMethod.id;
    
    // 2. Send to Backend API
    try {
      const response = await fetch('http://localhost:44335/api/Pagos/agregarMPago', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idUsuario: userId,
          idMPagoStripe: idMPagoStripe,
          correoUsuario: user.correo,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "No pudimos agregar el método de pago. Por favor, intenta nuevamente.");
      }

      toast({
        title: "Éxito",
        description: "Método de pago agregado exitosamente.",
      });
      onSuccessfulAdd();

    } catch (error: any) {
        setErrorMessage(error.message || "Ocurrió un error de red. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-md">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" disabled={isLoading}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Agregar Tarjeta"}
        </Button>
      </DialogFooter>
    </form>
  );
}
