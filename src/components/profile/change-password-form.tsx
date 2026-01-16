
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
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  newPassword: z.string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .max(16, { message: "La contraseña no debe tener más de 16 caracteres." })
    .regex(/(?=.*[A-Z])/, { message: "La contraseña debe tener al menos una letra mayúscula." })
    .regex(/(?=(?:.*\d){2})/, { message: "La contraseña debe tener al menos dos números." })
    .regex(/(?=.*[!@#$%^&*()_-])/, { message: "La contraseña debe tener al menos un carácter especial." }),
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
  const { t } = useTranslation();

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
        title: t('profile.change_password.toast_error_session_title'),
        description: t('profile.change_password.toast_error_session_desc'),
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
          title: t('profile.change_password.toast_success_title'),
          description: t('profile.change_password.toast_success_desc'),
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
        let userFriendlyMessage = t('profile.change_password.toast_error_change_desc_generic');

        if (response.status === 401) {
            userFriendlyMessage = t('profile.change_password.toast_error_session_desc');
        } else if (errorMessage.includes("Error al actualizar la contraseña en Keycloak")) {
            userFriendlyMessage = t('profile.change_password.toast_error_change_desc_auth');
        }
        
        toast({
          variant: "destructive",
          title: t('profile.change_password.toast_error_change_title'),
          description: userFriendlyMessage,
        });
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: t('profile.change_password.toast_error_connection_title'),
        description: t('profile.change_password.toast_error_connection_desc'),
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
              <FormLabel>{t('forms.new_password')}</FormLabel>
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
              <FormLabel>{t('forms.confirm_new_password')}</FormLabel>
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
            {isLoading ? <Loader2 className="animate-spin" /> : t('forms.update_password')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
