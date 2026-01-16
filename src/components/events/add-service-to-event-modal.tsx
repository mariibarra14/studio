
"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertCircle, ConciergeBell, Calendar } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import type { ComplementaryService, ApiEvent, ServiceBookingRecord } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type AddServiceToEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event: ApiEvent;
};

export function AddServiceToEventModal({ isOpen, onClose, onSuccess, event }: AddServiceToEventModalProps) {
  const [services, setServices] = useState<ComplementaryService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [dates, setDates] = useState({ inicio: "", fin: "" });
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Sesión expirada.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:44335/api/ServComps/Servs/getTodosServicios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("No se pudieron cargar los servicios.");
      const data = await response.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      setSelectedServiceId(null);
      setDates({ inicio: "", fin: "" });
    }
  }, [isOpen, fetchServices]);

  const handleApartar = async () => {
    if (!selectedServiceId || !dates.inicio || !dates.fin) {
      setError("Por favor, selecciona un servicio y un rango de fechas.");
      return;
    }

    setIsBooking(true);
    setError(null);

    const token = localStorage.getItem("accessToken");
    const idOrganizador = localStorage.getItem("userId");

    try {
      const fechaInicio = new Date(dates.inicio);
      const fechaFin = new Date(dates.fin);
      const eventoInicio = new Date(event.inicio);
      const eventoFin = new Date(event.fin || event.inicio);

      if (fechaFin <= fechaInicio) {
        throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.");
      }
      if (fechaFin > eventoFin) {
        throw new Error("El servicio no puede terminar después de que finalice el evento.");
      }

      // Check for date conflicts
      const registrosResponse = await fetch("http://localhost:44335/api/ServComps/Servs/getTodosRegistros", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!registrosResponse.ok) throw new Error("No se pudo verificar la disponibilidad del servicio.");
      const todosLosRegistros: ServiceBookingRecord[] = await registrosResponse.json();
      
      const registrosDelServicio = todosLosRegistros.filter(r => r.idServicio === selectedServiceId);
      
      const hayConflicto = registrosDelServicio.some(registro => {
        const registroInicio = new Date(registro.fechaInicio);
        const registroFin = new Date(registro.fechaFin);
        return fechaInicio < registroFin && fechaFin > registroInicio;
      });

      if (hayConflicto) {
        throw new Error("El servicio no está disponible en las fechas seleccionadas debido a un conflicto de horario.");
      }

      const submissionData = {
        idServicio: selectedServiceId,
        idOrganizador,
        idEvento: event.id,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      };

      const response = await fetch("http://localhost:44335/api/ServComps/Servs/apartarServicio", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo apartar el servicio.");
      }

      toast({ title: "✅ ¡Éxito!", description: "Servicio apartado correctamente para tu evento." });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error al apartar servicio", description: err.message });
    } finally {
      setIsBooking(false);
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Agregar Servicio al Evento</DialogTitle>
          <DialogDescription>Selecciona un servicio y define las fechas en las que estará disponible durante tu evento.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div>
            <Label className="font-semibold text-base">1. Selecciona un Servicio</Label>
            <ScrollArea className="h-64 mt-2 border rounded-md p-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <RadioGroup value={selectedServiceId || ""} onValueChange={setSelectedServiceId}>
                  <div className="space-y-3">
                    {services.map(service => (
                      <Label key={service.id} htmlFor={service.id} className="block cursor-pointer">
                        <Card className="hover:bg-muted/50 has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-colors">
                          <CardContent className="p-3 flex items-center gap-4">
                            <RadioGroupItem value={service.id} id={service.id} />
                            {service.fotoServicio && service.fotoServicio !== 'string' ? (
                                <Image src={service.fotoServicio} alt={service.nombre} width={48} height={48} className="rounded-md object-cover aspect-square"/>
                            ) : (
                                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center"><ConciergeBell className="h-6 w-6 text-muted-foreground"/></div>
                            )}
                            <div>
                                <p className="font-semibold">{service.nombre}</p>
                                <p className="text-sm text-muted-foreground">{service.tipo}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </ScrollArea>
          </div>

          {selectedServiceId && (
            <div className="space-y-4 pt-4 border-t">
              <Label className="font-semibold text-base">2. Define el Rango de Fechas</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fecha-inicio">Fecha de Inicio</Label>
                    <Input id="fecha-inicio" type="datetime-local" value={dates.inicio} onChange={e => setDates(d => ({...d, inicio: e.target.value}))}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fecha-fin">Fecha de Fin</Label>
                    <Input id="fecha-fin" type="datetime-local" value={dates.fin} onChange={e => setDates(d => ({...d, fin: e.target.value}))}/>
                </div>
              </div>
               <Alert variant="default" className="flex items-start">
                    <Calendar className="h-4 w-4 mt-1" />
                    <div className="ml-3">
                        <AlertTitle className="text-sm">Rango del evento</AlertTitle>
                        <AlertDescription className="text-xs">
                            El evento se realiza desde <br/> {new Date(event.inicio).toLocaleString('es-ES')} hasta {new Date(event.fin || event.inicio).toLocaleString('es-ES')}.
                        </AlertDescription>
                    </div>
                </Alert>
            </div>
          )}

          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleApartar} disabled={isBooking || !selectedServiceId || !dates.inicio || !dates.fin}>
            {isBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isBooking ? "Apartando..." : "Apartar Servicio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    