"use client";

import { useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  titulo: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  contenido: z.string().min(10, "El contenido debe tener al menos 10 caracteres."),
});

type AddThreadFormProps = {
  forumId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function AddThreadForm({ forumId, onSuccess, onCancel }: AddThreadFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      contenido: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    const autorId = localStorage.getItem('userId');

    if (!token || !autorId) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/foros/${forumId}/hilos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, foroId, autorId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo publicar tu hilo.");
      }

      toast({ title: "Hilo publicado correctamente." });
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
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del Hilo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: ¿Qué canción fue su favorita?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contenido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido</FormLabel>
              <FormControl>
                <Textarea placeholder="Comparte tus pensamientos, preguntas o experiencias aquí..." {...field} rows={6}/>
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
            {isLoading ? <Loader2 className="animate-spin" /> : "Publicar Hilo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
