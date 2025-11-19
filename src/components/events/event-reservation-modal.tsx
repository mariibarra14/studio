
"use client";

import { useState } from "react";
import Image from "next/image";
import { MockEvent, TicketTier } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Ticket, Tag, Package, Plus, Minus } from "lucide-react";

type EventReservationModalProps = {
  event: MockEvent;
  isOpen: boolean;
  onClose: () => void;
};

export function EventReservationModal({
  event,
  isOpen,
  onClose,
}: EventReservationModalProps) {
  const [stage, setStage] = useState<"details" | "reservation">("details");
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(event.tiers[0] || null);
  const [quantity, setQuantity] = useState(1);

  const handleTierChange = (tierId: string) => {
    const tier = event.tiers.find(t => t.id === tierId) || null;
    setSelectedTier(tier);
    setQuantity(1); // Reset quantity when tier changes
  };

  const incrementQuantity = () => {
    if (selectedTier && quantity < selectedTier.available) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const totalPrice = selectedTier ? selectedTier.price * quantity : 0;

  const handleClose = () => {
    onClose();
    // Reset state after a short delay to allow closing animation
    setTimeout(() => {
        setStage("details");
        setSelectedTier(event.tiers[0] || null);
        setQuantity(1);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0">
        {stage === "details" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-64 md:h-full min-h-[300px]">
                    {event?.image && (
                        <Image
                            src={event.image.imageUrl}
                            alt={event.image.description}
                            data-ai-hint={event.image.imageHint}
                            fill
                            className="object-cover rounded-l-lg"
                        />
                    )}
                </div>
                <div className="p-8 flex flex-col">
                    <DialogHeader className="text-left mb-4">
                        <DialogTitle className="text-3xl font-bold mb-2">{event?.name}</DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground">
                            {event?.date} &bull; {event?.location}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-6">
                        <Users className="mr-2 h-4 w-4"/>
                        <span>Quedan {event?.remainingTickets} entradas</span>
                    </div>

                    <p className="text-foreground/80 text-base leading-relaxed flex-grow">{event?.description}</p>
                    
                    <DialogFooter className="mt-8">
                        <Button onClick={() => setStage("reservation")} className="w-full text-lg py-6">Reservar</Button>
                    </DialogFooter>
                </div>
            </div>
          </>
        ) : (
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-bold">Confirmar Reserva: {event?.name}</DialogTitle>
              <DialogDescription>Seleccione el tipo de entrada y la cantidad.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="ticket-tier" className="text-lg">Tipo de Entrada</Label>
                    <Select onValueChange={handleTierChange} defaultValue={selectedTier?.id}>
                        <SelectTrigger id="ticket-tier" className="text-base py-6">
                            <SelectValue placeholder="Seleccione un tipo de entrada" />
                        </SelectTrigger>
                        <SelectContent>
                            {event?.tiers.map(tier => (
                                <SelectItem key={tier.id} value={tier.id} className="text-base p-3">
                                    <div className="flex justify-between w-full">
                                        <span className="font-semibold">{tier.name}</span>
                                        <span className="text-muted-foreground ml-4">${tier.price} &bull; {tier.available} disp.</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-lg">Cantidad</Label>
                    <div className="flex items-center gap-4">
                         <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <Input id="quantity" type="number" value={quantity} readOnly className="w-20 text-center text-lg font-bold" />
                         <Button variant="outline" size="icon" onClick={incrementQuantity} disabled={!selectedTier || quantity >= selectedTier.available}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="border-t pt-6 mt-6">
                    <div className="flex justify-between items-center text-2xl font-bold">
                        <span>Precio Total:</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <DialogFooter className="mt-8 gap-4">
                <Button variant="outline" onClick={() => setStage("details")}>Atrás</Button>
                <Button className="w-full">Confirmar Reserva</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
