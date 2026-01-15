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
import { Loader2, AlertCircle, Edit, Trash2, Calendar, Clock, Tag } from "lucide-react";
import type { ComplementaryService } from "@/lib/types";

type ServiceDetailsModalProps = {
  serviceId: string;
  isOpen: boolean;
  onClose: () => void;
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


export function ServiceDetailsModal({ serviceId, isOpen, onClose }: ServiceDetailsModalProps) {
  const [service, setService] = useState<ComplementaryService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-6">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
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
            <DialogHeader className="p-6 pb-0">
                <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {service.fotoServicio && service.fotoServicio !== 'string' ? (
                        <Image src={service.fotoServicio} alt={service.nombre} fill className="object-cover" />
                    ) : (
                        <Tag className="w-8 h-8 text-muted-foreground m-auto"/>
                    )}
                    </div>
                    <div>
                        <DialogTitle className="text-2xl">{service.nombre}</DialogTitle>
                        <DialogDescription>
                            <Badge variant="secondary">{service.tipo}</Badge>
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                <section>
                    <h3 className="font-semibold mb-2">Descripción</h3>
                    <p className="text-sm text-muted-foreground">{service.descripcion || "No hay descripción disponible."}</p>
                </section>

                <section>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Horario Semanal
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {englishWeekDays.map((dayKey) => {
                        const dayRanges = scheduleByDay[dayKey];
                        const spanishDay = dayTranslation[dayKey];
                        return (
                        <div key={dayKey} className="p-3 border rounded-md bg-background">
                            <h4 className="font-medium text-sm mb-2">{spanishDay}</h4>
                            <div className="text-xs text-muted-foreground space-y-1">
                            {dayRanges ? (
                                dayRanges.map((range, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span>{range.inicio} - {range.fin}</span>
                                </div>
                                ))
                            ) : (
                                <p>Cerrado</p>
                            )}
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </section>
            </div>
            
            <DialogFooter className="p-6 pt-0 border-t mt-4 pt-4">
                <div className="w-full flex justify-between">
                    <div className="flex gap-2">
                        <Button variant="outline" disabled><Edit className="mr-2 h-4 w-4"/>Modificar</Button>
                        <Button variant="destructive" disabled><Trash2 className="mr-2 h-4 w-4"/>Eliminar</Button>
                    </div>
                    <Button onClick={onClose}>Cerrar</Button>
                </div>
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
