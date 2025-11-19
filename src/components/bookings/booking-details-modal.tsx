
"use client";

import Image from "next/image";
import { MockBooking } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket, CreditCard, XCircle, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BookingDetailsModalProps = {
  booking: MockBooking;
  isOpen: boolean;
  onClose: () => void;
};

const statusVariantMap: { [key in MockBooking['status']]: "default" | "secondary" | "destructive" } = {
    'Confirmed': 'default',
    'Pending Payment': 'secondary',
    'Cancelled': 'destructive',
};

const statusTextMap: { [key in MockBooking['status']]: string } = {
    'Confirmed': 'Confirmado',
    'Pending Payment': 'Pago Pendiente',
    'Cancelled': 'Cancelado'
};

export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
    const { toast } = useToast();

    const handleCancel = () => {
        toast({
            title: "Reserva Cancelada",
            description: `Tu reserva para ${booking.event.name} ha sido cancelada.`,
            variant: "destructive",
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl p-0">
            <div className="relative h-56 w-full">
                 <Image
                    src={booking.event.image.imageUrl}
                    alt={booking.event.image.description}
                    data-ai-hint={booking.event.image.imageHint}
                    fill
                    className="object-cover rounded-t-lg"
                    sizes="100vw"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                 <div className="absolute bottom-0 left-0 p-6 text-white">
                    <DialogTitle className="text-3xl font-bold mb-1">{booking.event.name}</DialogTitle>
                    <DialogDescription className="text-lg text-white/90">Detalles de tu reserva</DialogDescription>
                 </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 mt-1 text-primary" />
                    <div>
                        <h4 className="font-semibold">Fecha y Hora</h4>
                        <p className="text-muted-foreground">{booking.event.date}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-1 text-primary" />
                    <div>
                        <h4 className="font-semibold">Ubicación</h4>
                        <p className="text-muted-foreground">{booking.event.location}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Ticket className="h-5 w-5 mt-1 text-primary" />
                    <div>
                        <h4 className="font-semibold">Categoría y Asiento</h4>
                        <p className="text-muted-foreground">{booking.tier.name} &bull; {booking.seat}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <h4 className="font-semibold mt-0.5">Cantidad:</h4>
                    <p className="text-muted-foreground mt-0.5">{booking.quantity} tiquete(s)</p>
                </div>
                <div className="md:col-span-2 border-t pt-6 mt-2 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h4 className="text-xl font-bold">Estado:</h4>
                         <Badge variant={statusVariantMap[booking.status]} className="text-sm">
                            {statusTextMap[booking.status]}
                        </Badge>
                    </div>
                     <div className="text-right">
                        <p className="text-sm text-muted-foreground">Precio Total</p>
                        <p className="text-2xl font-bold">${booking.totalPrice.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <DialogFooter className="bg-muted/50 px-6 py-4 flex-col sm:flex-row gap-2">
                {booking.status === 'Pending Payment' && (
                    <>
                        <Button variant="destructive" onClick={handleCancel}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar Reserva
                        </Button>
                        <Button className="w-full sm:w-auto">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Proceder al Pago
                        </Button>
                    </>
                )}
                {booking.status === 'Confirmed' && (
                    <Button className="w-full sm:w-auto">
                        <QrCode className="mr-2 h-4 w-4" />
                        Ver Tiquete (QR)
                    </Button>
                )}
                 {booking.status === 'Cancelled' && (
                    <p className="text-sm text-destructive-foreground text-center w-full">Esta reserva ha sido cancelada.</p>
                )}
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
