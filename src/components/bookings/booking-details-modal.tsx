
"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket, CreditCard, XCircle, QrCode, Armchair, Info, Clock, FileText, Package, Loader2 } from "lucide-react";
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
    onCancelSuccess: () => void;
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

export function BookingDetailsModal({ booking, isOpen, onClose, onCancelSuccess }: BookingDetailsModalProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isCancelling, setIsCancelling] = useState(false);


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

    const handleCancelReservation = async () => {
        setIsCancelling(true);
        const token = localStorage.getItem('accessToken');
    
        if (!token) {
            toast({ variant: "destructive", title: "Sesión expirada", description: "Inicie sesión para realizar esta acción" });
            setIsCancelling(false);
            return;
        }
    
        try {
            // Step 1: Cancel event reservation
            const eventCancelResponse = await fetch(`http://localhost:44335/api/Reservas/${booking.reservaId}/cancelar`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            if (eventCancelResponse.status !== 204) {
                throw new Error("No se pudo cancelar la reserva del evento. Puede que ya no sea válida o ya haya sido procesada.");
            }
    
            // Step 2: Find and conditionally cancel complementary service reservation
            const compResResponse = await fetch(`http://localhost:44335/api/ServComps/Resv/getReservaByIdReserva?idReserva=${booking.reservaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Only proceed if a complementary reservation was found
            if (compResResponse.ok) {
                const compResData = await compResResponse.json();
                const complementaryReservationId = compResData.id;

                if (complementaryReservationId) {
                    const cancelCompResResponse = await fetch(`http://localhost:44335/api/ServComps/Resv/cancelar?idReserva=${complementaryReservationId}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    // If this cancellation fails, throw a specific error
                    if (!cancelCompResResponse.ok) {
                         throw new Error("PARTIAL_CANCELLATION");
                    }
                }
            } else if (compResResponse.status !== 404) {
                // If the check failed for a reason other than "Not Found", it's a server issue
                 throw new Error("PARTIAL_CANCELLATION_CHECK_FAILED");
            }
            // If the status is 404, we just continue, as there's nothing to cancel.
    
            // If we reach here, everything was successful (or there was nothing to cancel)
            toast({
                title: "Reserva Cancelada",
                description: "Tu reserva y los servicios asociados han sido cancelados."
            });
            onCancelSuccess();
    
        } catch (err: any) {
            let title = "Error al Cancelar";
            let description = err.message;

            if (err.message === "PARTIAL_CANCELLATION") {
                title = "Cancelación Parcial";
                description = "La reserva del evento se canceló, pero hubo un error al cancelar los servicios adicionales. Por favor, contacte a soporte.";
                onCancelSuccess(); // Update UI even on partial success
            } else if (err.message === "PARTIAL_CANCELLATION_CHECK_FAILED") {
                title = "Cancelación Parcial";
                description = "La reserva del evento se canceló, pero no se pudo verificar el estado de los servicios adicionales. Contacte a soporte.";
                onCancelSuccess(); // Update UI even on partial success
            }

            toast({
                variant: "destructive",
                title: title,
                description: description,
                duration: 8000
            });
        } finally {
            setIsCancelling(false);
        }
    }

    const estadoReal = getEstadoReal(booking.estado, booking.expiraEn);
    const estadoDisplay = getEstadoDisplay(booking.estado, booking.expiraEn);
    const estadoColor = getEstadoColor(booking.estado, booking.expiraEn);

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), "dd MMMM, yyyy - h:mm a", { locale: es });
    }

    const ticketsTotal = booking.precioTotal;
    const productsTotal = booking.complementaryProducts?.reduce((sum, p) => sum + p.precio, 0) || 0;
    const grandTotal = ticketsTotal + productsTotal;

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
                    
                    {/* Complementary Products */}
                    {booking.complementaryProducts && booking.complementaryProducts.length > 0 && (
                        <div className="md:col-span-2">
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Productos Adicionales</h4>
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                            {booking.complementaryProducts.map(product => (
                                <div key={product.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        {product.fotoProducto && product.fotoProducto !== 'string' ? (
                                            <Image src={product.fotoProducto} alt={product.nombre} width={40} height={40} className="rounded-md aspect-square object-cover" />
                                        ) : (
                                            <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground"/></div>
                                        )}
                                        <div>
                                            <p className="font-semibold">{product.nombre}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{product.descripcion}</p>
                                        </div>
                                    </div>
                                    <p className="font-semibold">${product.precio.toFixed(2)}</p>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}


                    {/* Total Price and Status */}
                    <div className="md:col-span-2 border-t pt-6 mt-2 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h4 className="text-xl font-bold">Estado:</h4>
                                <Badge variant="outline" className={cn("text-sm", estadoColor)}>{estadoDisplay}</Badge>
                            </div>
                            <div className="text-right">
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Entradas:</span>
                                        <span>${ticketsTotal.toFixed(2)}</span>
                                    </div>
                                    {productsTotal > 0 && (
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Productos:</span>
                                            <span>${productsTotal.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t my-2"></div>
                                <p className="text-sm text-muted-foreground">Precio Total</p>
                                <p className="text-2xl font-bold">${grandTotal.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="bg-muted/50 px-6 py-4 flex-col sm:flex-row sm:justify-between gap-2">
                 <div className="flex gap-2">
                    {estadoReal === 'Hold' && (
                        <>
                            <Button className="w-full sm:w-auto" onClick={handleAction}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Proceder al Pago
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full sm:w-auto" disabled={isCancelling}>
                                        {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                        Cancelar Reserva
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Cancelar Reserva?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            ¿Estás seguro de que deseas cancelar esta reserva? Se cancelarán también todos los servicios adicionales asociados. Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>No</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCancelReservation} disabled={isCancelling}>
                                            {isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
                </div>
                 <Button variant="outline" onClick={onClose}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}

    