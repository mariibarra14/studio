
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  contenido: z.string().min(1, "El comentario no puede estar vacío."),
});

type CommentFormProps = {
  forumId: string;
  threadId: string;
  onSuccess: () => void;
};

export function CommentForm({ forumId, threadId, onSuccess }: CommentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contenido: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    const autorId = localStorage.getItem('userId');

    if (!token || !autorId) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión para poder comentar.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/foros/${forumId}/hilos/${threadId}/comentarios`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foroId: forumId,
          hiloId: threadId,
          autorId: autorId,
          contenido: values.contenido,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Tu sesión ha expirado. Por favor, inicia sesión para poder comentar.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No pudimos publicar tu comentario en este momento. Inténtalo de nuevo.");
      }

      toast({ title: "Comentario publicado" });
      form.reset();
      onSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-6 pt-6 border-t">
        <h5 className="font-semibold text-sm mb-3">Deja un comentario</h5>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error al Comentar</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <FormField
                control={form.control}
                name="contenido"
                render={({ field }) => (
                    <FormItem>
                    <FormControl>
                        <Textarea placeholder="Escribe tu respuesta aquí..." {...field} rows={3}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Send className="mr-2 h-4 w-4"/>Comentar</>}
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}
