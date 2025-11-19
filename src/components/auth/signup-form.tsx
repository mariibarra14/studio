
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
import { CalendarIcon, Loader2, Upload, Eye, EyeOff, User, Briefcase } from "lucide-react";
import { useState, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropperModal } from "./image-cropper-modal";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "El nombre es obligatorio." }),
  lastName: z.string().min(1, { message: "El apellido es obligatorio." }),
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  dob: z.date({ required_error: "La fecha de nacimiento es obligatoria." }),
  phoneNumber: z.string().min(10, { message: "Por favor, introduce un número de teléfono válido." }),
  address: z.string().min(1, { message: "La dirección es obligatoria." }),
  photo: z.any().optional(),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  confirmPassword: z.string(),
  role: z.enum(["usuario_final", "organizador"], { required_error: "Debes seleccionar un rol." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [imageToCrop, setImageToCrop] = useState<string | undefined>(undefined);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      role: "usuario_final",
      password: "",
      confirmPassword: ""
    },
  });

  const photoRef = form.register("photo");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Stage 1: Authentication
      const authResponse = await fetch('http://localhost:44335/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: values.firstName,
          apellido: values.lastName,
          correo: values.email,
          idRol: values.role,
          contrasena: values.password,
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        const errorMessage = errorData.message || authResponse.statusText;
        let userFriendlyMessage = "Ha ocurrido un error inesperado al intentar registrarse. Por favor, inténtelo de nuevo.";

        if (errorMessage.includes("Error al registrar usuario en Keycloak")) {
          userFriendlyMessage = "Este correo ya está registrado. Por favor, inicie sesión o use otro correo.";
        } else if (errorMessage.includes("Credenciales inválidas")) {
          userFriendlyMessage = "Las credenciales son inválidas. Verifique el formato de su correo y contraseña.";
        } else if (errorMessage.includes("Error de autenticación en Keycloak")) {
          userFriendlyMessage = "Error en la autenticación. Inténtelo de nuevo o revise sus datos.";
        } else if (errorMessage.includes("No se pudo obtener el ID del usuario")) {
          userFriendlyMessage = "Error interno: No se pudo completar el registro. Intente más tarde.";
        } else if (errorMessage.includes("Error interno en el servidor")) {
          userFriendlyMessage = "Error de conexión con el servidor. Intente registrarse más tarde.";
        } else if (errorMessage.includes("Error inesperado en la infraestructura de Keycloak")) {
          userFriendlyMessage = "Ocurrió un error inesperado. Por favor, inténtelo de nuevo.";
        }

        toast({
          variant: "destructive",
          title: "Error de Registro",
          description: userFriendlyMessage,
        });
        setIsLoading(false);
        return;
      }
      
      const authData = await authResponse.json();
      const userId = authData.idusuario;

      // Stage 2: Profile Creation
      const formData = new FormData();
      formData.append('Id', userId);
      formData.append('Nombre', values.firstName);
      formData.append('Apellido', values.lastName);
      formData.append('FechaNacimiento', format(values.dob, 'yyyy-MM-dd'));
      formData.append('Correo', values.email);
      formData.append('Telefono', values.phoneNumber);
      formData.append('Direccion', values.address);
      formData.append('FotoPerfil', 'null'); // Constant value as requested
      formData.append('Rol', authData.idrol);
      
      if (values.photo instanceof File) {
        formData.append('imagen', values.photo, values.photo.name);
      }

      const profileResponse = await fetch('http://localhost:44335/api/Usuarios/crearUsuario', {
        method: 'POST',
        body: formData,
      });

      if (profileResponse.ok) {
        toast({
          title: "¡Registro Completado!",
          description: "Te has registrado exitosamente. Por favor, inicia sesión.",
        });
        router.push("/login");
      } else {
        let userFriendlyMessage = "Ha ocurrido un error inesperado al completar el registro del perfil. Por favor, inténtelo de nuevo.";
        try {
            const errorData = await profileResponse.json();
            const errorMessage = errorData.message || (errorData.errors ? JSON.stringify(errorData.errors) : profileResponse.statusText);

            if (errorMessage.includes("El correo electrónico ya está registrado")) {
              userFriendlyMessage = "Este correo ya está registrado. A pesar del éxito inicial de autenticación, el perfil ya existía.";
            } else if (errorMessage.includes("The Id field is required")) {
               userFriendlyMessage = "Faltan datos obligatorios. Asegúrese de haber completado todos los campos marcados.";
            } else if (errorMessage.includes("El ID del rol especificado no existe")) {
              userFriendlyMessage = "Error de configuración: El rol seleccionado es inválido. Intente de nuevo.";
            } else if (errorMessage.includes("No se pudo crear el usuario")) {
              userFriendlyMessage = "Error al crear el perfil. Hubo un fallo en la creación del perfil de usuario.";
            } else if (profileResponse.status === 500 || errorMessage.includes("Error interno en el servidor")) {
              userFriendlyMessage = "Error interno del servidor. Por favor, intente el registro más tarde.";
            } else if (errorMessage.includes("No fue posible agregar el usuario al dominio")) {
                userFriendlyMessage = "Error de negocio: No se pudo completar la operación de registro.";
            } else if (errorMessage.includes("Fallo en UsuarioRepository")) {
                userFriendlyMessage = "Fallo en la base de datos. Intente más tarde.";
            }
        } catch(e) {
            // Error parsing JSON, use status text
            userFriendlyMessage = `Error: ${profileResponse.statusText || 'No se pudo completar el perfil.'}`;
        }
        
        toast({
          variant: "destructive",
          title: "Error al Crear Perfil",
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
  };

  return (
    <>
    <ImageCropperModal
      isOpen={isCropperOpen}
      onClose={() => setIsCropperOpen(false)}
      imageSrc={imageToCrop}
      onCropComplete={(croppedFile) => {
        form.setValue("photo", croppedFile);
        setPhotoPreview(URL.createObjectURL(croppedFile));
        setIsCropperOpen(false);
      }}
    />
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
           <FormField
            control={form.control}
            name="photo"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center justify-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoPreview || undefined} alt="Vista previa de foto de perfil" />
                  <AvatarFallback className="text-3xl">
                    {form.getValues("firstName")?.[0] || ""}
                    {form.getValues("lastName")?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={(e) => {
                    photoRef.ref(e);
                    fileInputRef.current = e;
                  }}
                  onChange={handleFileChange}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Foto
                </Button>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} value={field.value ?? ""} />
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
                    <Input placeholder="Doe" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección de Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="nombre@ejemplo.com" {...field} value={field.value ?? ""} autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
             <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: es })
                          ) : (
                            <span>DD/MM/YYYY</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Teléfono</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="04142869306" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Textarea placeholder="123 Calle Principal, Cualquier Ciudad" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-4 text-center">
                <FormLabel className="text-base font-semibold">Elige el rol que desearías tener!</FormLabel>
                <FormControl>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            type="button"
                            variant={field.value === 'usuario_final' ? 'default' : 'outline'}
                            onClick={() => field.onChange('usuario_final')}
                            className="h-auto py-4 text-base"
                        >
                          <User className="mr-2 h-5 w-5" />
                          Usuario Final
                        </Button>
                        <Button
                            type="button"
                            variant={field.value === 'organizador' ? 'default' : 'outline'}
                            onClick={() => field.onChange('organizador')}
                            className="h-auto py-4 text-base"
                        >
                          <Briefcase className="mr-2 h-5 w-5" />
                           Organizador
                        </Button>
                    </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} value={field.value ?? ""} autoComplete="new-password" />
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} value={field.value ?? ""} autoComplete="new-password" />
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
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Crear Cuenta"}
        </Button>
      </form>
    </Form>
    </>
  );
}
