
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
    nombre: z.string().min(1, "El nombre de la zona es requerido."),
    precio: z.coerce.number().min(0, "El precio debe ser 0 o mayor."),
    filas: z.coerce.number().min(1, "Debe haber al menos 1 fila."),
    columnas: z.coerce.number().min(1, "Debe haber al menos 1 asiento por fila."),
    capacidad: z.coerce.number().min(1, "La capacidad debe ser mayor que 0."),
    prefijoFila: z.string().min(1, "El prefijo de fila es requerido.").max(5),
    prefijoAsiento: z.string().max(5).optional(),
});

type AddZoneFormProps = {
  eventId: string;
  escenarioId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function AddZoneForm({ eventId, escenarioId, onSuccess, onCancel }: AddZoneFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      precio: 0,
      filas: 1,
      columnas: 1,
      capacidad: 1,
      prefijoFila: "F",
      prefijoAsiento: "",
    },
  });

  const { watch, setValue } = form;
  const watchedFilas = watch("filas");
  const watchedColumnas = watch("columnas");

  useEffect(() => {
    const newCapacity = (watchedFilas || 0) * (watchedColumnas || 0);
    setValue("capacidad", newCapacity, { shouldValidate: true });
  }, [watchedFilas, watchedColumnas, setValue]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError("Tu sesión ha expirado.");
        setIsLoading(false);
        return;
    }

    const submissionData = {
        eventId: eventId,
        escenarioId: escenarioId,
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
        
        await response.json();
        toast({ title: "✅ Zona Creada", description: `La zona "${values.nombre}" ha sido añadida.` });
        onSuccess();

    } catch (err: any) {
        setError(err.message || "Ocurrió un error desconocido.");
        toast({ variant: "destructive", title: "❌ Error al crear zona", description: err.message });
    } finally {
        setIsLoading(false);
    }
  }

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
              <FormControl><Input type="number" {...field} readOnly className="bg-muted/50" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
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
