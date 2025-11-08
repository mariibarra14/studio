
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Wifi, Cog } from "lucide-react";
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
import { cn } from "@/lib/utils";

const initialPaymentMethods = [
  {
    id: '1',
    type: 'Visa',
    last4: '4242',
    expiry: '12/26',
    isPrimary: true,
    billingAddress: "123 Main St, Anytown, USA",
    cardHolder: "John Doe",
  },
  {
    id: '2',
    type: 'Mastercard',
    last4: '5555',
    expiry: '08/25',
    isPrimary: false,
    billingAddress: "456 Oak Ave, Otherville, USA",
    cardHolder: "John Doe",
  },
];

type PaymentMethod = typeof initialPaymentMethods[0];

const cardColors = [
    "from-purple-500 to-indigo-600",
    "from-pink-500 to-rose-500",
    "from-teal-400 to-cyan-500",
    "from-amber-400 to-orange-500",
]

const CardComponent = ({ method, colorClass }: { method: PaymentMethod; colorClass: string }) => (
    <div className={cn("relative h-48 w-full max-w-sm rounded-xl text-white shadow-lg transition-transform hover:scale-105 overflow-hidden", colorClass, "bg-gradient-to-br")}>
      <div className="absolute top-4 right-4 text-2xl font-bold uppercase tracking-wider">{method.type}</div>
      <div className="absolute top-4 left-4">
        <Wifi className="h-6 w-6 transform -rotate-90" />
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <p className="font-mono text-xl tracking-widest">•••• •••• •••• {method.last4}</p>
        <div className="flex justify-between items-end mt-4">
          <div>
            <p className="text-xs uppercase">Card Holder</p>
            <p className="text-sm font-medium">{method.cardHolder}</p>
          </div>
          <div>
            <p className="text-xs uppercase">Expires</p>
            <p className="text-sm font-medium">{method.expiry}</p>
          </div>
        </div>
      </div>
    </div>
  );


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
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentMethods.map((method, index) => (
                <Dialog key={method.id}>
                <DialogTrigger asChild>
                    <button className="relative rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <CardComponent method={method} colorClass={cardColors[index % cardColors.length]} />
                        {method.isPrimary && (
                          <div className="absolute top-0 right-0 h-16 w-16">
                            <div className="absolute transform rotate-45 bg-primary text-center text-white font-semibold py-1 right-[-34px] top-[32px] w-[170px]">
                              Primary
                            </div>
                          </div>
                        )}
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
                    <DialogFooter className="sm:justify-between flex-wrap gap-2">
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
        </div>

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
