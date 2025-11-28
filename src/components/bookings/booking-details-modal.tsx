
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
import { Calendar, MapPin, Ticket, CreditCard, XCircle, QrCode, Armchair, Info, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ApiBooking, Seat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { generateBookingPDF } from "@/lib/pdf-generator";
import { useRouter } from "next/navigation";


type BookingDetailsModalProps = {
    booking: ApiBooking;
    isOpen: boolean;
    onClose: () => void;
  };

const getEstadoReal = (estado: string, expiraEn: string): string => {
  if (estado === 'Hold' && new Date(expiraEn) < new Date()) {
    return 'Expired';
  }
  return estado;
};

const getEstadoDisplay = (estado: string, expiraEn?: string) => {
  const estadoReal = expiraEn ? getEstadoReal(estado, expiraEn) : estado;
  const estados: { [key: string]: string } = {
    'Hold': 'Por Pagar',
    'Confirmada': 'Confirmada', 
    'Expired': 'Expirada'
  };
  return estados[estadoReal] || estadoReal;
};

const getEstadoColor = (estado: string, expiraEn?: string) => {
  const estadoReal = expiraEn ? getEstadoReal(estado, expiraEn) : estado;
  const colores: { [key: string]: string } = {
    'Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Confirmada': 'bg-green-100 text-green-800 border-green-200',
    'Expired': 'bg-red-100 text-red-800 border-red-200'
  };
  return colores[estadoReal] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getEstadoAsientoDisplay = (estado: string | undefined) => {
    if (!estado) return "No disponible";
    const estados: { [key: string]: string } = {
      'hold': 'Reservado',
      'available': 'Disponible',
      'Ocupado': 'Vendido',
      'reserved': 'Reservado',
      'blocked': 'Bloqueado',
      'error': 'No disponible'
    };
    return estados[estado.toLowerCase()] || estado;
};

export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
    const { toast } = useToast();
    const router = useRouter();

    const handleAction = () => {
        router.push(`/payments?reservaId=${booking.reservaId}&eventId=${booking.eventId}&monto=${booking.precioTotal}`);
    };

    const handleGeneratePdf = async () => {
        try {
            await generateBookingPDF(booking);
            toast({
                title: "PDF Generado",
                description: "El comprobante de tu reserva se ha descargado.",
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                variant: "destructive",
                title: "Error al generar PDF",
                description: "No se pudo crear el archivo PDF. Inténtalo de nuevo.",
            });
        }
    };

    const estadoReal = getEstadoReal(booking.estado, booking.expiraEn);
    const estadoDisplay = getEstadoDisplay(booking.estado, booking.expiraEn);
    const estadoColor = getEstadoColor(booking.estado, booking.expiraEn);

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), "dd MMMM, yyyy - h:mm a", { locale: es });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[1000px] max-h-[95vh] p-0 overflow-auto">
            {booking.eventoImagen ? (
                <div className="relative h-48 w-full">
                    <Image src={booking.eventoImagen} alt={booking.eventoNombre || 'Imagen del evento'} fill className="object-cover rounded-t-lg" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
            ) : (
                <div className="h-48 w-full bg-primary rounded-t-lg flex items-center justify-center">
                   <h2 className="text-2xl font-bold text-white text-center p-4">{booking.eventoNombre}</h2>
                </div>
            )}
            
            <div className="p-6 pt-4">
                <DialogHeader className="mb-6 text-left">
                    <Badge variant="outline" className="mb-2 w-fit">{booking.eventoCategoria}</Badge>
                    <DialogTitle className="text-3xl font-bold">{booking.eventoNombre}</DialogTitle>
                    <DialogDescription>Identificador de la Reserva: {booking.reservaId.substring(0,8)}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Event Dates */}
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <h4 className="font-semibold">Inicio del Evento</h4>
                            <p className="text-muted-foreground">{formatDate(booking.eventoInicio)}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <h4 className="font-semibold">Fin del Evento</h4>
                            <p className="text-muted-foreground">{formatDate(booking.eventoFin)}</p>
                        </div>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <h4 className="font-semibold">Ubicación</h4>
                            <p className="text-muted-foreground">{booking.escenarioNombre}</p>
                            <p className="text-xs text-muted-foreground">{booking.escenarioUbicacion}</p>
                        </div>
                    </div>

                     {/* Expiration Date */}
                     <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <h4 className="font-semibold">Expiración de la Reserva</h4>
                            <p className="text-muted-foreground">{formatDate(booking.expiraEn)}</p>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 mt-1 text-primary" />
                        <div>
                            <h4 className="font-semibold">Zona de la Reserva</h4>
                            <p className="text-muted-foreground">{booking.zonaNombre || 'Cargando...'}</p>
                        </div>
                    </div>
                    
                    {/* Seats */}
                    <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Armchair className="h-5 w-5 text-primary" /> Asientos Reservados</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                        {booking.asientos.map(asiento => (
                            <div key={asiento.asientoId} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                <div>
                                    <p>Asiento <span className="font-semibold">{asiento.label}</span></p>
                                    <p className="text-xs text-muted-foreground">ID: {asiento.asientoId.substring(0,8)}... </p>
                                </div>
                                <Badge variant={asiento.estado === 'hold' ? 'default' : 'outline'} className="capitalize">
                                    {getEstadoAsientoDisplay(asiento.estado)}
                                </Badge>
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
                {estadoReal === 'Hold' && (
                    <>
                        <Button className="w-full sm:w-auto" onClick={handleAction}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Proceder al Pago
                        </Button>
                    </>
                )}
                {estadoReal === 'Confirmada' && (
                   <>
                        <Button variant="outline" className="w-full sm:w-auto" onClick={handleGeneratePdf}>
                            <FileText className="mr-2 h-4 w-4" />
                            Imprimir PDF
                        </Button>
                   </>
                )}
                {(estadoReal === 'Cancelled' || estadoReal === 'Expired') && (
                    <p className="text-sm text-center w-full">
                        {estadoReal === 'Expired' ? 'Esta reserva ha expirado.' : 'Esta reserva ya no es válida.'}
                    </p>
                )}
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
