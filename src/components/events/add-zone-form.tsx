
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Venue } from "@/lib/types";

const formSchema = z.object({
    nombre: z.string().min(1, "El nombre de la zona es requerido."),
    precio: z.coerce.number().min(0, "El precio debe ser 0 o mayor."),
    escenarioId: z.string().min(1, "Debes seleccionar un escenario."),
    capacidad: z.coerce.number().min(1, "La capacidad debe ser al menos 1."),
    filas: z.coerce.number().min(1, "Debe haber al menos 1 fila."),
    columnas: z.coerce.number().min(1, "Debe haber al menos 1 asiento por fila."),
    prefijoFila: z.string().min(1, "El prefijo de fila es requerido.").max(5),
    prefijoAsiento: z.string().max(5).optional(),
}).refine(data => data.filas * data.columnas === data.capacidad, {
    message: "La capacidad total debe ser igual al número de filas multiplicado por las columnas.",
    path: ["capacidad"],
});

type AddZoneFormProps = {
  eventId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function AddZoneForm({ eventId, onSuccess, onCancel }: AddZoneFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      precio: 0,
      escenarioId: "",
      capacidad: 1,
      filas: 1,
      columnas: 1,
      prefijoFila: "F",
      prefijoAsiento: "",
    },
  });

  useEffect(() => {
    const fetchVenues = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const response = await fetch('http://localhost:44335/api/events/escenarios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setVenues(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch venues", error);
      }
    };
    fetchVenues();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    
    if (values.filas * values.columnas !== values.capacidad) {
      form.setError("capacidad", { type: "manual", message: "La capacidad no coincide con filas x columnas." });
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError("Tu sesión ha expirado.");
        setIsLoading(false);
        return;
    }

    const submissionData = {
        eventId: eventId,
        escenarioId: values.escenarioId,
        nombre: values.nombre,
        tipo: "sentado",
        capacidad: values.capacidad,
        numeracion: {
            modo: "Sillas",
            filas: values.filas,
            columnas: values.columnas,
            prefijoFila: values.prefijoFila,
            prefijoAsiento: values.prefijoAsiento || ""
        },
        precio: values.precio,
        estado: "Abierto",
        grid: {
            startRow: 1,
            startCol: 1,
            rowSpan: 1,
            colSpan: 1
        },
        autogenerarAsientos: true
    };

    try {
        const response = await fetch(`http://localhost:44335/api/events/${eventId}/zonas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || "No se pudo crear la zona.");
        }
        
        const result = await response.json();
        toast({ title: "✅ Zona Creada", description: `La zona "${values.nombre}" ha sido añadida.` });
        onSuccess();

    } catch (err: any) {
        setError(err.message || "Ocurrió un error desconocido.");
        toast({ variant: "destructive", title: "❌ Error al crear zona", description: err.message });
    } finally {
        setIsLoading(false);
    }
  }

  const watchedValues = form.watch();
  const capacityMatch = watchedValues.filas * watchedValues.columnas === watchedValues.capacidad;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
        
        <FormField control={form.control} name="escenarioId" render={({ field }) => (
          <FormItem>
            <FormLabel>Escenario</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un escenario" /></SelectTrigger></FormControl>
              <SelectContent>
                {venues.map(venue => <SelectItem key={venue.id} value={venue.id}>{venue.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

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
          <FormField control={form.control} name="capacidad" render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad Total</FormLabel>
              <FormControl><Input type="number" min="1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {watchedValues.filas > 0 && watchedValues.columnas > 0 && watchedValues.capacidad > 0 && (
            <Alert variant={capacityMatch ? "default" : "destructive"} className={capacityMatch ? "bg-green-50 border-green-200 text-green-800" : ""}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{capacityMatch ? "Configuración Correcta" : "Atención"}</AlertTitle>
                <AlertDescription>
                    {watchedValues.filas} filas × {watchedValues.columnas} columnas = {watchedValues.filas * watchedValues.columnas} asientos. 
                    {capacityMatch ? " Coincide con la capacidad." : " No coincide con la capacidad especificada."}
                </AlertDescription>
            </Alert>
        )}

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
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end gap-4 pt-8 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando Zona...</> : "Crear Zona"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
