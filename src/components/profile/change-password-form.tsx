
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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  newPassword: z.string().min(8, { message: "La nueva contraseña debe tener al menos 8 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas nuevas no coinciden.",
  path: ["confirmPassword"],
});

export function ChangePasswordForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      toast({
        variant: "destructive",
        title: "Error de sesión",
        description: "Su sesión expiró. Vuelva a iniciar sesión e inténtelo de nuevo.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:44335/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contrasena: values.newPassword
        }),
      });

      if (response.ok) {
        toast({
          title: "Contraseña Actualizada",
          description: "Su contraseña ha sido cambiada exitosamente. Por seguridad, su sesión ha sido cerrada. Por favor, inicie sesión de nuevo.",
        });
        form.reset();

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        localStorage.removeItem('roleId');
        router.push('/login');

      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Error inesperado.";
        let userFriendlyMessage = "Error inesperado: No se pudo actualizar la contraseña. Por favor, inténtelo de nuevo más tarde.";

        if (response.status === 401) {
            userFriendlyMessage = "Error de sesión: Su sesión expiró. Vuelva a iniciar sesión e inténtelo de nuevo.";
        } else if (errorMessage.includes("Error al actualizar la contraseña en Keycloak")) {
            userFriendlyMessage = "Error al cambiar contraseña: Hubo un problema con el servicio de autenticación.";
        }
        
        toast({
          variant: "destructive",
          title: "Error al Cambiar Contraseña",
          description: userFriendlyMessage,
        });
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor. Por favor, intente más tarde.",
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
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva Contraseña</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showNewPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                  <span className="sr-only">{showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nueva Contraseña</FormLabel>
               <div className="relative">
                <FormControl>
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                </FormControl>
                 <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                  <span className="sr-only">{showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Actualizar Contraseña"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
