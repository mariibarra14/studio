
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

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre del escenario es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  ubicacion: z.string().min(1, "La ubicación es requerida"),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  estado: z.string().min(1, "El estado es requerido"),
  pais: z.string().min(1, "El país es requerido"),
});

type AddVenueFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function AddVenueForm({ onSuccess, onCancel }: AddVenueFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      ubicacion: "",
      ciudad: "",
      estado: "",
      pais: "",
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
        const response = await fetch('http://localhost:44335/api/events/escenarios', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(values)
        });

        if (!response.ok) {
            let errorMessage = "No se pudo crear el escenario. Intenta nuevamente.";
            if (response.status === 401) {
                errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.";
            } else if (response.status === 403) {
                errorMessage = "No tienes permisos para realizar esta acción.";
            } else if (response.status === 400) {
                errorMessage = "Por favor, verifica que todos los campos estén completos y sean válidos.";
            } else if (response.status === 500) {
                errorMessage = "Error del servidor. Por favor, intenta más tarde.";
            }
            throw new Error(errorMessage);
        }

        toast({
            title: "Éxito",
            description: "Escenario creado exitosamente.",
        });
        onSuccess();
        
    } catch (err: any) {
        setError(err.message || "Ocurrió un error desconocido.");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al crear escenario</AlertTitle>
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
              <FormLabel>Dirección/Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Av. Principal #123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ciudad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Caracas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado/Provincia</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Miranda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="pais"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Venezuela" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creando..." : "Crear Escenario"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
