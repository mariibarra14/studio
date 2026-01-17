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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { EnrichedForumComment } from "@/lib/types";

const formSchema = z.object({
  contenido: z.string().min(1, "El comentario no puede estar vacío."),
});

type EditCommentFormProps = {
  comment: EnrichedForumComment;
  forumId: string;
  threadId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function EditCommentForm({ comment, forumId, threadId, onSuccess, onCancel }: EditCommentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contenido: comment.contenido,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    const solicitanteId = localStorage.getItem('userId');

    if (!token || !solicitanteId) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión para poder editar.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/foros/${forumId}/hilos/${threadId}/comentarios/${comment.id}?solicitanteId=${solicitanteId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values.contenido),
      });

      if (response.status === 204) {
        toast({ title: "Comentario actualizado correctamente." });
        onSuccess();
      } else {
        if (response.status === 401) throw new Error("Tu sesión ha expirado. Por favor, inicia sesión para poder editar.");
        if (response.status === 403) throw new Error("No tienes permiso para editar este comentario.");
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No pudimos guardar la modificación en este momento.");
      }
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
            <AlertTitle>Error al Editar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="contenido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido del Comentario</FormLabel>
              <FormControl>
                <Textarea placeholder="Escribe tu respuesta aquí..." {...field} rows={5}/>
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
            {isLoading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
