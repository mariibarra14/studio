
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiEvent, Venue } from "@/lib/types";
import type { Category } from "@/lib/categories";
import { format } from "date-fns";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fin: z.string().min(1, "La fecha de fin es requerida"),
  lugar: z.string().min(1, "El lugar es requerido"),
  aforoMaximo: z.coerce.number().min(1, "El aforo debe ser mayor a 0"),
  tipo: z.string().min(1, "El tipo de evento es requerido"),
  escenarioId: z.string().min(1, "El escenario es requerido"),
  categoriaId: z.string().min(1, "La categoría es requerida"),
}).refine(data => new Date(data.fin) > new Date(data.inicio), {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["fin"],
});

type EditEventFormProps = {
  event: ApiEvent;
  venues: Venue[];
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
};

// Helper to format date for datetime-local input
const toDateTimeLocal = (dateString: string | null) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Adjust for timezone offset
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
    } catch(e) {
        return '';
    }
}

export function EditEventForm({ event, venues, categories, onSuccess, onCancel }: EditEventFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: event.nombre,
      descripcion: event.descripcion || "",
      inicio: toDateTimeLocal(event.inicio),
      fin: toDateTimeLocal(event.fin),
      lugar: event.lugar,
      aforoMaximo: event.aforoMaximo,
      tipo: event.tipo,
      escenarioId: event.escenarioId,
      categoriaId: event.categoriaId,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        setIsSaving(false);
        return;
    }

    // Include all required fields from original event not in the form
    const submissionData = {
      ...values,
      id: event.id,
      estado: event.estado,
      organizadorId: event.organizadorId,
      inicio: new Date(values.inicio).toISOString(),
      fin: new Date(values.fin).toISOString()
    };

    try {
        const response = await fetch(`http://localhost:44335/api/events/${event.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        });

        if (response.status === 204 || response.ok) {
            onSuccess();
        } else {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || "No se pudo actualizar el evento.");
        }
    } catch (err: any) {
        setError(err.message || "Ocurrió un error desconocido.");
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al actualizar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Evento</FormLabel>
              <FormControl><Input {...field} /></FormControl>
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
              <FormControl><Textarea {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoriaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.Nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Evento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Presencial">Presencial</SelectItem>
                    <SelectItem value="Virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="escenarioId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Escenario</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecciona un escenario" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {venues.map(venue => <SelectItem key={venue.id} value={venue.id}>{venue.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lugar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lugar (Dirección)</FormLabel>
              <FormControl><Input {...field} placeholder="Dirección detallada del evento" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y Hora de Inicio</FormLabel>
                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y Hora de Fin</FormLabel>
                <FormControl><Input type="datetime-local" {...field} min={form.watch('inicio')} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="aforoMaximo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aforo Máximo</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
