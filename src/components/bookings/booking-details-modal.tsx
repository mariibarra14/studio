
"use client";

import Image from "next/image";
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
import { Calendar, MapPin, Ticket, CreditCard, XCircle, QrCode, Armchair, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ApiBooking } from "@/lib/types";
import { cn } from "@/lib/utils";

type BookingDetailsModalProps = {
  booking: ApiBooking;
  isOpen: boolean;
  onClose: () => void;
};

const getEstadoDisplay = (estado: string) => {
  const estados: { [key: string]: string } = {
    'Hold': 'Por Pagar',
    'Confirmed': 'Confirmada', 
    'Cancelled': 'Cancelada',
    'Expired': 'Expirada'
  };
  return estados[estado] || estado;
};

const getEstadoColor = (estado: string) => {
  const colores: { [key: string]: string } = {
    'Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Confirmed': 'bg-green-100 text-green-800 border-green-200',
    'Cancelled': 'bg-red-100 text-red-800 border-red-200',
    'Expired': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
};


export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
    const { toast } = useToast();

    const handleAction = () => {
        // Lógica de pago o cancelación
        toast({ title: "Función no implementada" });
    };

    const estadoDisplay = getEstadoDisplay(booking.estado);
    const estadoColor = getEstadoColor(booking.estado);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl p-0">
            <div className="p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold">Detalles de la Reserva</DialogTitle>
                    <DialogDescription>ID de Reserva: {booking.reservaId}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Event Details */}
                    <div className="flex items-start gap-3 col-span-full">
                        <Info className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <h4 className="font-semibold">Información General</h4>
                            <p className="text-sm text-muted-foreground">Evento ID: {booking.eventId}</p>
                            <p className="text-sm text-muted-foreground">Zona ID: {booking.zonaEventoId}</p>
                        </div>
                    </div>
                    
                    {/* Dates */}
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <h4 className="font-semibold">Fecha de Creación</h4>
                            <p className="text-muted-foreground">{format(new Date(booking.creadaEn), "dd/MM/yyyy, h:mm a", { locale: es })}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <h4 className="font-semibold">Fecha de Expiración</h4>
                            <p className="text-muted-foreground">{format(new Date(booking.expiraEn), "dd/MM/yyyy, h:mm a", { locale: es })}</p>
                        </div>
                    </div>
                    
                    {/* Seats */}
                    <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Armchair className="h-5 w-5 text-primary" /> Asientos Reservados</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                        {booking.asientos.map(asiento => (
                            <div key={asiento.asientoId} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                <p>Asiento <span className="font-semibold">{asiento.label}</span></p>
                                <p className="text-muted-foreground text-xs">(ID: {asiento.asientoId.substring(0,8)})</p>
                                <p className="font-semibold">${asiento.precioUnitario.toFixed(2)}</p>
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Total Price and Status */}
                    <div className="md:col-span-2 border-t pt-6 mt-2 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h4 className="text-xl font-bold">Estado:</h4>
                            <Badge variant="outline" className={cn("text-sm", estadoColor)}>{estadoDisplay}</Badge>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Precio Total</p>
                            <p className="text-2xl font-bold">${booking.precioTotal.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="bg-muted/50 px-6 py-4 flex-col sm:flex-row gap-2">
                {booking.estado === 'Hold' && (
                    <>
                        <Button variant="destructive" onClick={handleAction}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar Reserva
                        </Button>
                        <Button className="w-full sm:w-auto" onClick={handleAction}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Proceder al Pago
                        </Button>
                    </>
                )}
                {booking.estado === 'Confirmed' && (
                    <Button className="w-full sm:w-auto" onClick={handleAction}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Ver Tiquete (QR)
                    </Button>
                )}
                {(booking.estado === 'Cancelled' || booking.estado === 'Expired') && (
                    <p className="text-sm text-center w-full">Esta reserva ya no es válida.</p>
                )}
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
