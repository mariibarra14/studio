"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import type { ApiBooking } from '@/lib/types';
import { StarRating } from './StarRating';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

const formSchema = z.object({
  calificacion: z.number().min(1, "La calificación es obligatoria").max(5),
  comentario: z.string().optional(),
});

type SurveyFormProps = {
  booking: ApiBooking;
  onSuccess: () => void;
};

export function SurveyForm({ booking, onSuccess }: SurveyFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calificacion: 0,
      comentario: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    
    const token = localStorage.getItem('accessToken');
    const usuarioId = localStorage.getItem('userId');

    if (!token || !usuarioId) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:44335/api/foros/encuestas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventoId: booking.eventId,
          usuarioId: usuarioId,
          calificacion: values.calificacion,
          comentario: values.comentario,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo guardar tu valoración.");
      }

      toast({
        title: t('surveys.thanks_toast_title'),
        description: t('surveys.thanks_toast_desc'),
      });
      onSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="calificacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('surveys.rating_label')}</FormLabel>
              <FormControl>
                <StarRating rating={field.value} onRatingChange={field.onChange} size={32} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comentario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('surveys.comment_label')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('surveys.comment_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al Guardar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : t('surveys.submit_button')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
