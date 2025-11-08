"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type PaymentMethod = typeof initialPaymentMethods[0];

export function PaymentMethods() {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);

  const handleRemove = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
    toast({
      title: "Payment Method Removed",
      description: `The selected card has been removed.`,
      variant: "destructive"
    });
  };

  const handleSetPrimary = (id: string) => {
    setPaymentMethods(paymentMethods.map(pm => ({
        ...pm,
        isPrimary: pm.id === id,
    })))
    toast({
        title: "Primary Method Updated",
        description: "Your primary payment method has been changed."
    })
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <Dialog key={method.id}>
          <DialogTrigger asChild>
            <button
              className='flex items-center gap-4 rounded-lg border p-4 text-left w-full transition-colors hover:bg-muted/50'
            >
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{method.type} ending in {method.last4}</p>
                <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
              </div>
              {method.isPrimary && <span className="ml-auto text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Primary</span>}
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Card Details</DialogTitle>
              <DialogDescription>Details for your {method.type} ending in {method.last4}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input id="card-number" value={`•••• •••• •••• ${method.last4}`} readOnly />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="expiry-date">Expiry Date</Label>
                    <Input id="expiry-date" value={method.expiry} readOnly />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" value="•••" readOnly />
                </div>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="billing-address">Billing Address</Label>
                  <Input id="billing-address" value={method.billingAddress} readOnly />
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              {!method.isPrimary && (
                <DialogClose asChild>
                    <Button variant="outline" onClick={() => handleSetPrimary(method.id)}>Set as Primary</Button>
                </DialogClose>
              )}
               <DialogClose asChild>
                  <Button variant="destructive" onClick={() => handleRemove(method.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Card
                  </Button>
               </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}

        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Method
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Payment Method</DialogTitle>
                    <DialogDescription>Enter your new card details below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-card-number">Card Number</Label>
                        <Input id="new-card-number" placeholder="•••• •••• •••• ••••" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-expiry-date">Expiry Date</Label>
                            <Input id="new-expiry-date" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-cvc">CVC</Label>
                            <Input id="new-cvc" placeholder="•••" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-billing-address">Billing Address</Label>
                        <Input id="new-billing-address" placeholder="123 Main St, Anytown, USA" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Add Card</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
