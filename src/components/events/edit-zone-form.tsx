
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
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Zone } from "@/lib/types";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre de la zona es requerido."),
  precio: z.coerce.number().min(0, "El precio debe ser 0 o mayor."),
});

type EditZoneFormProps = {
  eventId: string;
  zone: Zone;
  onSuccess: () => void;
  onCancel: () => void;
};

export function EditZoneForm({ eventId, zone, onSuccess, onCancel }: EditZoneFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: zone.nombre,
      precio: zone.precio,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setServerError(null);

    const token = localStorage.getItem('accessToken');
    if (!token) {
        setServerError("Tu sesión ha expirado.");
        setIsLoading(false);
        return;
    }

    const submissionData = {
        eventId: eventId,
        zonaId: zone.id,
        nombre: values.nombre,
        precio: values.precio,
        estado: "Abierto", 
        grid: {
            startRow: 1,
            startCol: 1,
            rowSpan: 1,
            colSpan: 1
        }
    };

    try {
        const response = await fetch(`http://localhost:44335/api/events/${eventId}/zonas/${zone.id}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        });

        if (response.status === 204) {
            toast({ title: "✅ Zona Actualizada", description: `La zona "${values.nombre}" ha sido actualizada.` });
            onSuccess();
        } else {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || "No se pudo actualizar la zona.");
        }
    } catch (err: any) {
        setServerError(err.message || "Ocurrió un error desconocido.");
        toast({ variant: "destructive", title: "❌ Error al actualizar zona", description: err.message });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        
        <div className="p-3 bg-muted/30 rounded-lg space-y-2 border">
            <h4 className="font-semibold text-sm">Información de la Zona (No modificable)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs">Capacidad</p>
                    <p className="font-medium">{zone.capacidad?.toLocaleString()}</p>
                </div>
            </div>
        </div>

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
        
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
            <strong>Nota:</strong> La capacidad no se puede cambiar una vez creada la zona.
            </p>
        </div>
        
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al Actualizar</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end gap-4 pt-8 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
