
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Package, Calendar, Building, Clock, DollarSign, Layers } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MyServiceBooking, Product } from "@/lib/types";

type ServiceBookingDetailsModalProps = {
  booking: MyServiceBooking;
  isOpen: boolean;
  onClose: () => void;
};

export function ServiceBookingDetailsModal({ booking, isOpen, onClose }: ServiceBookingDetailsModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Sesión expirada.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/ServComps/Prods/getProductosByIdServicio?idServicio=${booking.idServicio}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 404) {
        setProducts([]);
        return;
      }
      if (!response.ok) {
        throw new Error("No se pudieron cargar los productos.");
      }
      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [booking.idServicio]);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, fetchProducts]);
  
  const renderProducts = () => {
      if (isLoading) {
          return (
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
          )
      }
      if (error) {
          return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
      }
      if (products.length === 0) {
          return <p className="text-sm text-muted-foreground text-center py-4">Este servicio no tiene productos asociados.</p>
      }
      return (
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {products.map(product => (
                <div key={product.id} className="flex items-center gap-4 p-2 border rounded-md bg-muted/30">
                    {product.fotoProducto && product.fotoProducto !== 'string' ? (
                        <Image src={product.fotoProducto} alt={product.nombre} width={48} height={48} className="rounded object-cover aspect-square" />
                    ) : (
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground"/></div>
                    )}
                    <div className="flex-1">
                        <p className="font-semibold">{product.nombre}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center"><DollarSign className="h-3 w-3 mr-1"/>{product.precio.toFixed(2)}</span>
                            <span className="flex items-center"><Layers className="h-3 w-3 mr-1"/>Stock: {product.cantidad}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0">
        <div className="relative w-full h-48 bg-muted">
          {booking.servicePhoto && booking.servicePhoto !== 'string' ? (
            <Image src={booking.servicePhoto} alt={booking.serviceName} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Sin Imagen</p></div>
          )}
        </div>
        
        <DialogHeader className="p-6 pb-2">
          <Badge variant="outline" className="w-fit mb-2">{booking.serviceType}</Badge>
          <DialogTitle className="text-2xl">{booking.serviceName}</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6 max-h-[calc(80vh-250px)] overflow-y-auto">
            <section className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary"/>Fechas del Servicio</h3>
                <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-2">
                    <p><strong className="text-foreground">Inicio:</strong> {format(new Date(booking.fechaInicio), "dd/MM/yyyy HH:mm")}</p>
                    <p><strong className="text-foreground">Fin:</strong> {format(new Date(booking.fechaFin), "dd/MM/yyyy HH:mm")}</p>
                </div>
            </section>
            
            <section className="space-y-3">
                 <h3 className="font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-primary"/>Vinculado al Evento</h3>
                 <div className="p-3 border rounded-md bg-muted/50">
                    <p className="font-semibold">{booking.eventName}</p>
                    <p className="text-sm text-muted-foreground">{booking.eventLugar}</p>
                 </div>
            </section>
            
            <section className="space-y-3">
                 <h3 className="font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-primary"/>Productos Incluidos</h3>
                 {renderProducts()}
            </section>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
