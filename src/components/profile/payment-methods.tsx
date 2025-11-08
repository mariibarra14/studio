"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialPaymentMethods = [
  {
    id: '1',
    type: 'Visa',
    last4: '4242',
    expiry: '12/26',
    isPrimary: true,
    billingAddress: "123 Main St, Anytown, USA",
  },
  {
    id: '2',
    type: 'Mastercard',
    last4: '5555',
    expiry: '08/25',
    isPrimary: false,
    billingAddress: "456 Oak Ave, Otherville, USA",
  },
];

export function PaymentMethods() {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [selectedMethod, setSelectedMethod] = useState<typeof initialPaymentMethods[0] | null>(paymentMethods[0]);

  const handleRemove = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
    if (selectedMethod?.id === id) {
      setSelectedMethod(null);
    }
    toast({
      title: "Payment Method Removed",
      description: `The selected card has been removed.`,
    });
  };

  const handleSelect = (method: typeof initialPaymentMethods[0]) => {
    setSelectedMethod(method);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 flex flex-col gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleSelect(method)}
            className={`flex items-center gap-4 rounded-lg border p-4 text-left w-full transition-colors ${selectedMethod?.id === method.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
          >
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{method.type} ending in {method.last4}</p>
              <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
            </div>
            {method.isPrimary && <span className="ml-auto text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Primary</span>}
          </button>
        ))}
         <Button>Add New Method</Button>
      </div>

      <div className="md:col-span-2">
        {selectedMethod ? (
          <Card>
            <CardHeader>
              <CardTitle>Card Details</CardTitle>
              <CardDescription>Details for your {selectedMethod.type} ending in {selectedMethod.last4}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input id="card-number" value={`•••• •••• •••• ${selectedMethod.last4}`} readOnly />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="expiry-date">Expiry Date</Label>
                    <Input id="expiry-date" value={selectedMethod.expiry} readOnly />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" value="•••" readOnly />
                </div>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="billing-address">Billing Address</Label>
                  <Input id="billing-address" value={selectedMethod.billingAddress} readOnly />
              </div>
              <div className="flex justify-between items-center pt-4">
                 {!selectedMethod.isPrimary && <Button variant="outline">Set as Primary</Button>}
                 <div className="flex-grow" />
                 <Button variant="destructive" onClick={() => handleRemove(selectedMethod.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Card
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full rounded-lg border border-dashed p-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-semibold">Select a payment method</p>
            <p className="text-sm text-muted-foreground">Or add a new one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
