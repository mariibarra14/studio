
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
        const loginResponse = await fetch('http://localhost:44335/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                correo: values.email,
                contrasena: values.password,
            }),
        });

        if (loginResponse.ok) {
            const data = await loginResponse.json();
            
            // Store data securely
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('roleId', data.roleId);

            toast({
                title: "Inicio de Sesión Exitoso",
                description: "¡Bienvenido de nuevo!",
            });

            // Publish activity event
            try {
                const activityResponse = await fetch('http://localhost:44335/api/Usuarios/publishActivity', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${data.access_token}`
                    },
                    body: JSON.stringify({
                        idUsuario: data.userId,
                        accion: "Log in"
                    }),
                });

                if (!activityResponse.ok) {
                    if (activityResponse.status === 401) {
                         toast({
                            variant: "destructive",
                            title: "Error de sesión",
                            description: "La sesión no está autorizada. Vuelva a iniciar sesión.",
                        });
                        // Do not redirect if unauthorized
                        setIsLoading(false);
                        return;
                    } else {
                        throw new Error("Failed to publish activity");
                    }
                }
            } catch (activityError) {
                 toast({
                    variant: "destructive",
                    title: "Fallo al registrar actividad.",
                    description: "La aplicación continuará, pero hubo un fallo interno al registrar la actividad.",
                });
            }

            // Redirect after successful login and activity publish attempt
            router.push("/events");

        } else {
            const errorData = await loginResponse.json();
            const errorMessage = errorData.message || loginResponse.statusText;
            let userFriendlyMessage = "Ha ocurrido un error inesperado al iniciar sesión. Por favor, inténtelo de nuevo.";

            if (errorMessage.includes("Credenciales inválidas") || errorMessage.includes("Error de autenticación en Keycloak")) {
                userFriendlyMessage = "Correo o contraseña incorrectos.";
            } else if (errorMessage.includes("No se pudo obtener el ID del usuario")) {
                userFriendlyMessage = "Error de configuración. No se pudo obtener la identidad del usuario.";
            } else if (errorMessage.includes("Error interno en el servidor")) {
                userFriendlyMessage = "Error interno del servidor. Por favor, intente iniciar sesión más tarde.";
            } else if (errorMessage.includes("Error inesperado en la infraestructura de Keycloak")) {
                userFriendlyMessage = "Ocurrió un error inesperado. Por favor, inténtelo de nuevo.";
            }

            toast({
                variant: "destructive",
                title: "Error de Inicio de Sesión",
                description: userFriendlyMessage,
            });
            setIsLoading(false);
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error de Conexión",
            description: "No se pudo conectar con el servidor. Por favor, inténtelo más tarde.",
        });
        setIsLoading(false);
    }
    // No need to set isLoading to false here if redirection happens
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección de correo electrónico</FormLabel>
              <FormControl>
                <Input placeholder="nombre@ejemplo.com" {...field} value={field.value ?? ""} autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} value={field.value ?? ""} autoComplete="current-password" />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                  <span className="sr-only">{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Iniciar Sesión"}
        </Button>
      </form>
    </Form>
  );
}
