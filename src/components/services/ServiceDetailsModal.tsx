"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Edit, Trash2, Calendar, Package, Tag } from "lucide-react";
import type { ComplementaryService, Product } from "@/lib/types";
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
import { useToast } from "@/hooks/use-toast";

type ServiceDetailsModalProps = {
  serviceId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void;
  onEdit: () => void;
  onViewProducts: () => void;
};

const dayTranslation: { [key: string]: string } = {
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
  Saturday: "Sábado",
  Sunday: "Domingo",
};

const englishWeekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


export function ServiceDetailsModal({ serviceId, isOpen, onClose, onDeleteSuccess, onEdit, onViewProducts }: ServiceDetailsModalProps) {
  const [service, setService] = useState<ComplementaryService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchServiceDetails = useCallback(async () => {
    if (!serviceId) return;

    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Sesión expirada: Su sesión ha terminado. Por favor, identifíquese de nuevo.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/ServComps/Servs/getServicioById?idServicio=${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        throw new Error("Sesión expirada: Su sesión ha terminado. Por favor, identifíquese de nuevo.");
      }
      if (!response.ok) {
        throw new Error("Error de carga: No se pudo obtener la información del servicio. Intente cerrar y abrir de nuevo.");
      }

      const data: ComplementaryService = await response.json();
      setService(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (isOpen) {
      fetchServiceDetails();
    }
  }, [isOpen, fetchServiceDetails]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      toast({
        variant: "destructive",
        title: "Sesión expirada",
        description: "No tienes permisos o tu sesión ha caducado. Por favor, inicia sesión de nuevo.",
      });
      setIsDeleting(false);
      return;
    }

    try {
      // Step 1: Fetch associated products
      const productsResponse = await fetch(`http://localhost:44335/api/ServComps/Prods/getProductosByIdServicio?idServicio=${serviceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (productsResponse.ok) {
        const productsToDelete: Product[] = await productsResponse.json();
        
        // Step 2: Delete each product
        for (const product of productsToDelete) {
          const deleteProductResponse = await fetch(`http://localhost:44335/api/ServComps/Prods/eliminarProducto?idProducto=${product.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!deleteProductResponse.ok) {
             throw new Error(`No se pudo eliminar el producto asociado "${product.nombre}". La eliminación del servicio ha sido cancelada.`);
          }
        }
      } else if (productsResponse.status !== 404) {
        // If it's not a 404 (no products found), it's a real error we should stop for.
        throw new Error("No se pudieron verificar los productos asociados. Intente nuevamente.");
      }

      // Step 3: Delete the service itself
      const deleteServiceResponse = await fetch(`http://localhost:44335/api/ServComps/Servs/eliminarServicio?idServicio=${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const responseText = await deleteServiceResponse.text();

      if (deleteServiceResponse.ok && responseText.includes("Servicio eliminado exitosamente")) {
        toast({
          title: "¡Listo!",
          description: "El servicio y todos sus productos asociados han sido eliminados correctamente.",
        });
        onDeleteSuccess();
      } else {
        let errorMessage = "No se pudo eliminar el servicio. Por favor, inténtalo más tarde.";
        if (deleteServiceResponse.status === 401) {
          errorMessage = "Sesión expirada: No tienes permisos o tu sesión ha caducado. Por favor, inicia sesión de nuevo.";
        }
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <Skeleton className="h-48 w-full" />
          <div className="p-6 space-y-4">
              <div>
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-1/4" />
              </div>
              <div className="space-y-2 pt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="pt-4">
                <Skeleton className="h-24 w-full" />
              </div>
          </div>
        </>
      );
    }

    if (error) {
      return (
        <div className="p-6">
            <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
      );
    }

    if (!service) return null;

    const scheduleByDay = service.horario.reduce((acc, curr) => {
        acc[curr.dia] = curr.rangos;
        return acc;
    }, {} as { [key: string]: { inicio: string; fin: string }[] });


    return (
        <>
            <div className="relative w-full h-48 bg-muted">
              {service.fotoServicio && service.fotoServicio !== 'string' ? (
                <Image src={service.fotoServicio} alt={service.nombre} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Tag className="w-16 h-16 text-muted-foreground/30"/>
                </div>
              )}
            </div>

            <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-2xl">{service.nombre}</DialogTitle>
                <DialogDescription>
                    <Badge variant="outline">{service.tipo}</Badge>
                </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-4 space-y-6 max-h-[calc(80vh-300px)] overflow-y-auto">
                <section>
                    <h3 className="font-semibold mb-2">Descripción</h3>
                    <p className="text-sm text-muted-foreground">{service.descripcion || "No hay descripción disponible."}</p>
                </section>

                <section>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Horario Semanal
                    </h3>
                     <div className="border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-7 bg-muted/50">
                            {englishWeekDays.map((dayKey) => (
                                <div key={dayKey} className="text-center p-2 border-r font-medium text-sm last:border-r-0">
                                    {dayTranslation[dayKey]}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 min-h-[60px] divide-x">
                            {englishWeekDays.map((dayKey) => {
                                const dayRanges = scheduleByDay[dayKey];
                                return (
                                    <div key={dayKey} className="p-2 text-center text-xs flex items-center justify-center">
                                        {dayRanges ? (
                                            dayRanges.map((range, index) => (
                                            <div key={index}>
                                                <span>{range.inicio} - {range.fin}</span>
                                            </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground">Cerrado</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>
            
            <DialogFooter className="p-6 pt-4 border-t flex-col sm:flex-row sm:justify-between w-full">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onEdit}><Edit className="mr-2 h-4 w-4"/>Modificar</Button>
                    <Button variant="outline" onClick={onViewProducts}><Package className="mr-2 h-4 w-4"/>Productos</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                Eliminar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro de que deseas eliminar este servicio?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El servicio "{service?.nombre}" y todos sus productos asociados serán eliminados permanentemente.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Button variant="outline" onClick={onClose}>Cerrar</Button>
            </DialogFooter>
        </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
