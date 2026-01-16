"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiEvent } from "@/lib/types";
import { useApp } from "@/context/app-context";

const formSchema = z.object({
  titulo: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  eventoId: z.string({ required_error: "Debes seleccionar un evento." }),
});

type AddForumFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function AddForumForm({ onSuccess, onCancel }: AddForumFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const { user, userRole } = useApp();

  const fetchEvents = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:44335/api/events", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allEvents: ApiEvent[] = await response.json();
      
      if (userRole === 'organizador' && user) {
        setEvents(allEvents.filter(e => e.organizadorId === user.id));
      } else {
        setEvents(allEvents);
      }
    } catch (e) {
      console.error("Failed to fetch events for forum creation", e);
    }
  }, [user, userRole]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    const creadorId = localStorage.getItem('userId');

    if (!token || !creadorId) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:44335/api/foros/crear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, creadorId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo crear el foro.");
      }

      toast({ title: "Foro creado exitosamente." });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="eventoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asociar a Evento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un evento..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del Foro</FormLabel>
              <FormControl>
                <Input placeholder="Ej: ¿Qué te pareció el setlist?" {...field} />
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
                <Textarea placeholder="Describe el propósito de este foro de discusión." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Crear Foro"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
