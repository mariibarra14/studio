
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Zone } from "@/lib/types";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    nombre: z.string().min(1, "El nombre de la zona es requerido."),
    precio: z.coerce.number().min(0, "El precio debe ser 0 o mayor."),
    filas: z.coerce.number().min(1, "Debe haber al menos 1 fila."),
    columnas: z.coerce.number().min(1, "Debe haber al menos 1 asiento por fila."),
    prefijoFila: z.string().min(1, "El prefijo de fila es requerido.").max(5),
    prefijoAsiento: z.string().max(5).optional(),
});

type AddZoneFormProps = {
  eventId: string;
  escenarioId: string;
  eventoAforoMaximo: number;
  zonasExistentes: Zone[];
  onSuccess: () => void;
  onCancel: () => void;
};

export function AddZoneForm({ 
  eventId, 
  escenarioId, 
  eventoAforoMaximo, 
  zonasExistentes, 
  onSuccess, 
  onCancel 
}: AddZoneFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      precio: 0,
      filas: 1,
      columnas: 1,
      prefijoFila: "F",
      prefijoAsiento: "",
    },
  });

  const { watch, setValue } = form;
  const watchedFilas = watch("filas");
  const watchedColumnas = watch("columnas");

  const capacidadActualZonas = useMemo(() => 
    zonasExistentes.reduce((acc, zona) => acc + zona.capacidad, 0),
    [zonasExistentes]
  );
  
  const aforoDisponible = eventoAforoMaximo - capacidadActualZonas;
  const nuevaCapacidad = (watchedFilas || 0) * (watchedColumnas || 0);

  const aforoError = useMemo(() => {
    if (nuevaCapacidad > aforoDisponible) {
      return `La capacidad (${nuevaCapacidad}) excede el aforo disponible (${aforoDisponible}).`;
    }
    return null;
  }, [nuevaCapacidad, aforoDisponible]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setServerError(null);
    
    if (aforoError) {
      form.setError("filas", { type: "manual", message: aforoError });
      form.setError("columnas", { type: "manual", message: aforoError });
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
        setServerError("Tu sesión ha expirado.");
        setIsLoading(false);
        return;
    }

    const submissionData = {
        eventId: eventId,
        escenarioId: escenarioId,
        nombre: values.nombre,
        tipo: "sentado",
        capacidad: nuevaCapacidad,
        numeracion: {
            modo: "Sillas",
            filas: values.filas,
            columnas: values.columnas,
            prefijoFila: values.prefijoFila,
            prefijoAsiento: values.prefijoAsiento || ""
        },
        precio: values.precio,
        estado: "Abierto",
        grid: { startRow: 1, startCol: 1, rowSpan: 1, colSpan: 1 },
        autogenerarAsientos: true
    };

    try {
        const response = await fetch(`http://localhost:44335/api/events/${eventId}/zonas`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || "No se pudo crear la zona.");
        }
        
        await response.json();
        toast({ title: "✅ Zona Creada", description: `La zona "${values.nombre}" ha sido añadida.` });
        onSuccess();

    } catch (err: any) {
        setServerError(err.message || "Ocurrió un error desconocido.");
        toast({ variant: "destructive", title: "❌ Error al crear zona", description: err.message });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="p-4 bg-muted/30 rounded-lg border">
          <h4 className="font-semibold text-sm mb-2">Información de Aforo</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Aforo Máx. Evento</p>
              <p className="font-medium">{eventoAforoMaximo.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Capacidad Usada</p>
              <p className="font-medium">{capacidadActualZonas.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Aforo Disponible</p>
              <p className="font-medium text-green-600">{aforoDisponible.toLocaleString()}</p>
            </div>
             <div>
              <p className="text-muted-foreground text-xs">Capacidad Nueva Zona</p>
              <p className={cn("font-medium", aforoError ? "text-red-600" : "text-blue-600")}>
                {nuevaCapacidad.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormField control={form.control} name="nombre" render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Zona</FormLabel>
              <FormControl><Input {...field} placeholder="Ej: Platea VIP" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="precio" render={({ field }) => (
            <FormItem>
              <FormLabel>Precio por Asiento ($)</FormLabel>
              <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FormField control={form.control} name="filas" render={({ field }) => (
            <FormItem>
              <FormLabel>Nº de Filas</FormLabel>
              <FormControl><Input type="number" min="1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="columnas" render={({ field }) => (
            <FormItem>
              <FormLabel>Asientos por Fila</FormLabel>
              <FormControl><Input type="number" min="1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
           <FormItem>
              <FormLabel>Capacidad Total</FormLabel>
              <FormControl>
                <Input 
                    type="number" 
                    value={nuevaCapacidad} 
                    readOnly 
                    className={cn(
                      "bg-muted/50 font-bold", 
                      aforoError && "border-destructive bg-red-50 text-destructive-foreground"
                    )}
                />
                </FormControl>
              <FormMessage />
            </FormItem>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField control={form.control} name="prefijoFila" render={({ field }) => (
                <FormItem>
                <FormLabel>Prefijo de Fila</FormLabel>
                <FormControl><Input {...field} placeholder="Ej: F, Fila" maxLength={5} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="prefijoAsiento" render={({ field }) => (
                <FormItem>
                <FormLabel>Prefijo de Asiento (Opcional)</FormLabel>
                <FormControl><Input {...field} placeholder="Ej: A, Asiento" maxLength={5} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
        </div>
        
        {(serverError || aforoError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de Validación</AlertTitle>
            <AlertDescription>{serverError || aforoError}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end gap-4 pt-8 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading || !!aforoError}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando Zona...</> : "Crear Zona"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
