"use client";

import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const paymentMethods = [
  {
    id: '1',
    type: 'Visa',
    last4: '4242',
    expiry: '12/26',
    isPrimary: true,
  },
  {
    id: '2',
    type: 'Mastercard',
    last4: '5555',
    expiry: '08/25',
    isPrimary: false,
  },
];

const VisaIcon = () => (
    <svg width="40" height="25" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_1_1)">
            <path d="M47.213 6.697H33.228V23.328H47.213V6.697Z" fill="#1A1F71"/>
            <path d="M28.08 6.697L23.86 16.92L28.106 23.328H22.12L16.023 11.238L14.004 23.328H8.05L12.597 6.697H18.72L22.94 16.662L24.053 11.082L22.247 6.697H28.08Z" fill="#1A1F71"/>
            <path d="M3.325 6.697C5.074 8.79 7.994 10.932 12.084 12.27L10.334 23.329H4.379L0 6.697H3.325Z" fill="#1A1F71"/>
        </g>
        <defs>
            <clipPath id="clip0_1_1"><rect width="47.213" height="16.631" fill="white" transform="translate(0 6.697)"/></clipPath>
        </defs>
    </svg>
)

const MastercardIcon = () => (
    <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12.5" cy="12.5" r="12.5" fill="#EB001B"/>
        <circle cx="27.5" cy="12.5" r="12.5" fill="#F79E1B" fillOpacity="0.8"/>
    </svg>
)

export function PaymentMethods() {
  const { toast } = useToast();
  
  const handleRemove = (id: string) => {
    toast({
      title: "Payment Method Removed",
      description: `The selected card has been removed.`,
    });
    // Here you would typically update state or call an API
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <div key={method.id} className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            {method.type === 'Visa' ? <VisaIcon /> : <MastercardIcon />}
            <div>
              <p className="font-medium">{method.type} ending in {method.last4}</p>
              <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
            </div>
            {method.isPrimary && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Primary</span>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!method.isPrimary && <DropdownMenuItem>Set as primary</DropdownMenuItem>}
              <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(method.id)}>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
      <div className="flex justify-end pt-4">
        <Button>Add New Method</Button>
      </div>
    </div>
  );
}
