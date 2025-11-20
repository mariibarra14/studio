
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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
});

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:44335/reset-password/${values.email}`, {
        method: 'POST',
      });

      const responseText = await response.text();

      if (response.ok) {
        toast({
          title: "Correo de Restablecimiento Enviado",
          description: "Se ha enviado un correo con instrucciones a su dirección. Por favor, revise su bandeja de entrada.",
        });
        router.push("/login");
      } else {
        let userFriendlyMessage = "Fallo al enviar el correo: No se pudo completar la solicitud. Por favor, inténtelo de nuevo más tarde.";

        if (responseText.includes("User not Found")) {
          userFriendlyMessage = "Error: El correo electrónico ingresado no está registrado en el sistema.";
        } else if (response.status === 404) {
          userFriendlyMessage = "Error: El correo electrónico ingresado no fue proporcionado.";
        } else if (response.status === 401) {
          userFriendlyMessage = "Error de Servicio: Hubo un problema de autenticación al procesar la solicitud.";
        }
        
        toast({
          variant: "destructive",
          title: "Error al Restablecer Contraseña",
          description: userFriendlyMessage,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor. Por favor, inténtelo más tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección de Correo Electrónico</FormLabel>
              <FormControl>
                <Input placeholder="nombre@ejemplo.com" {...field} value={field.value ?? ""} autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Enviar Enlace de Restablecimiento"}
        </Button>
      </form>
    </Form>
  );
}
