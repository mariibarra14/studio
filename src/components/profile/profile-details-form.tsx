
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import type { User } from "@/context/app-context";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "El nombre es obligatorio." }),
  lastName: z.string().min(1, { message: "El apellido es obligatorio." }),
  phoneNumber: z.string().min(10, { message: "Por favor, introduzca un número de teléfono válido." }),
  address: z.string().min(1, { message: "La dirección es obligatoria." }),
  photo: z.any().optional(),
});

type ProfileDetailsFormProps = {
  user: User;
};

export function ProfileDetailsForm({ user }: ProfileDetailsFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.fotoPerfil || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.nombre,
        lastName: user.apellido,
        phoneNumber: user.telefono,
        address: user.direccion,
      });
      setPhotoPreview(user.fotoPerfil);
    }
  }, [user, form]);

  const photoRef = form.register("photo");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: "Perfil Actualizado",
      description: "Su información personal ha sido guardada.",
    });

    setIsLoading(false);
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <FormLabel>Dirección de Correo Electrónico</FormLabel>
                        <Input value={user.correo} readOnly disabled />
                    </div>
                    <div className="space-y-2">
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <Input value={format(new Date(user.fechaNacimiento), "dd/MM/yyyy")} readOnly disabled />
                    </div>
                </div>
                 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                            <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                            <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Número de Teléfono</FormLabel>
                    <FormControl>
                        <Input type="tel" placeholder="04142869306" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                        <Textarea placeholder="123 Main St, Anytown USA" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="flex justify-start">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
                </Button>
            </div>
        </div>
        <div className="md:col-span-1">
             <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                    <FormItem className="flex flex-col items-center text-center gap-4 p-4 border rounded-lg bg-background">
                        <FormLabel className="text-base font-semibold">Foto de Perfil</FormLabel>
                        <Avatar className="h-32 w-32">
                            <AvatarImage src={photoPreview || undefined} alt="Vista previa de la foto de perfil" />
                            <AvatarFallback className="text-4xl">{getInitials(user?.nombre, user?.apellido)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2 items-center">
                            <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            accept="image/*"
                            {...photoRef}
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                setPhotoPreview(URL.createObjectURL(file));
                                }
                                field.onChange(event);
                            }}
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Cambiar Foto
                            </Button>
                            <p className="text-xs text-muted-foreground">JPG, GIF o PNG. 1MB máximo.</p>
                            <FormMessage />
                        </div>
                    </FormItem>
                )}
                />
        </div>
      </form>
    </Form>
  );
}
