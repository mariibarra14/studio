
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Venue } from "@/lib/types";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre del escenario es requerido"),
  descripcion: z.string().optional(),
  ubicacion: z.string().min(1, "La ubicación específica es requerida"),
});

type EditVenueFormProps = {
  venue: Venue;
  onSuccess: () => void;
  onCancel: () => void;
};

export function EditVenueForm({ venue, onSuccess, onCancel }: EditVenueFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: venue.nombre,
      descripcion: venue.descripcion || "",
      ubicacion: venue.ubicacion,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');

    if (!token) {
        setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        setIsLoading(false);
        return;
    }

    try {
        const submissionData = {
          ...values,
          ciudad: venue.ciudad,
          estado: venue.estado,
          pais: venue.pais,
          id: venue.id,
          activo: venue.activo,
          capacidadTotal: venue.capacidadTotal,
        };

        const response = await fetch(`http://localhost:44335/api/events/escenarios/${venue.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        });

        if (response.status === 204) {
            toast({
                title: "Éxito",
                description: "Escenario actualizado exitosamente.",
            });
            onSuccess();
        } else {
            let errorMessage = "No se pudo actualizar el escenario. Intenta nuevamente.";
            if (response.status === 401) errorMessage = "No tienes permiso para realizar esta acción.";
            if (response.status === 404) errorMessage = "El escenario no fue encontrado.";
            if (response.status === 400) errorMessage = "Datos inválidos. Verifica la información.";
            throw new Error(errorMessage);
        }
        
    } catch (err: any) {
        setError(err.message || "Ocurrió un error desconocido.");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al Actualizar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Escenario</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Teatro Nacional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe las características del escenario..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ubicacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección/Ubicación Específica</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Av. Principal #123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <h4 className="font-semibold text-sm">Ubicación Geográfica (No Editable)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                  <FormLabel className="text-muted-foreground text-xs">Ciudad</FormLabel>
                  <div className="p-2 mt-1 bg-background border rounded-md text-sm">{venue.ciudad}</div>
              </div>
              <div>
                  <FormLabel className="text-muted-foreground text-xs">Estado/Provincia</FormLabel>
                  <div className="p-2 mt-1 bg-background border rounded-md text-sm">{venue.estado}</div>
              </div>
              <div>
                  <FormLabel className="text-muted-foreground text-xs">País</FormLabel>
                  <div className="p-2 mt-1 bg-background border rounded-md text-sm">{venue.pais}</div>
              </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
