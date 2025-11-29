
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
import { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import type { User } from "@/context/app-context";
import { useApp } from "@/context/app-context";
import { ImageCropperModal } from "../auth/image-cropper-modal";

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
  const { refetchUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.fotoPerfil || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [imageToCrop, setImageToCrop] = useState<string | undefined>(undefined);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
      photo: null,
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

    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "Su sesión ha expirado. Por favor, inicie sesión de nuevo.",
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('Nombre', values.firstName);
    formData.append('Apellido', values.lastName);
    formData.append('Telefono', values.phoneNumber);
    formData.append('Direccion', values.address);
    formData.append('FotoPerfil', user.fotoPerfil || '');

    if (values.photo instanceof File) {
      formData.append('nuevaImagen', values.photo, values.photo.name);
    }

    try {
      const response = await fetch(`http://localhost:44335/api/Usuarios/modificarUsuario?id=${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Perfil Actualizado",
          description: "¡Su información ha sido actualizada con éxito!",
        });
        await refetchUser();

      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || response.statusText;
        let userFriendlyMessage = "Error al actualizar el perfil. Ocurrió un error inesperado en el servidor.";

        if (response.status === 400) {
            userFriendlyMessage = "Error de datos: Verifique que todos los campos obligatorios estén completos.";
        } else if (errorMessage.includes("El usuario especificado no existe")) {
            userFriendlyMessage = "Error de usuario: El usuario no pudo ser encontrado en el sistema.";
        } else if (response.status === 401) {
            userFriendlyMessage = "Error de autorización: Su sesión expiró. Inicie sesión de nuevo.";
        }
        
        toast({
          variant: "destructive",
          title: "Error al Actualizar",
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow re-selection of the same file
    event.target.value = '';
  };
  
  const handleCropComplete = (croppedFile: File) => {
    form.setValue("photo", croppedFile);
    setPhotoPreview(URL.createObjectURL(croppedFile));
    setIsCropperOpen(false);
  };
  
  const combinedRef = useCallback((element: HTMLInputElement) => {
    photoRef.ref(element);
    fileInputRef.current = element;
  }, [photoRef]);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <>
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspectRatio="square"
      />
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
                          <FormLabel>Rol de Usuario</FormLabel>
                          <Input value={user.nombreRol || user.rol} readOnly disabled />
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
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                      <div className="space-y-2">
                          <FormLabel>Fecha de Nacimiento</FormLabel>
                          <Input value={format(new Date(user.fechaNacimiento), "dd/MM/yyyy")} readOnly disabled />
                      </div>
                  </div>
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
                                ref={combinedRef}
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Cambiar Foto
                              </Button>
                              <p className="text-xs text-muted-foreground">JPG, PNG o GIF. 1MB máx.</p>
                              <FormMessage />
                          </div>
                      </FormItem>
                  )}
                  />
          </div>
        </form>
      </Form>
    </>
  );
}
