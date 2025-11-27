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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Upload, FileUp, Paperclip } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiEvent, Venue } from "@/lib/types";
import type { Category } from "@/lib/categories";
import Image from "next/image";
import { ImageCropperModal } from "../auth/image-cropper-modal";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fin: z.string().min(1, "La fecha de fin es requerida"),
  lugar: z.string().min(1, "El lugar es requerido"),
  aforoMaximo: z.coerce.number().min(1, "El aforo debe ser mayor a 0"),
  tipo: z.string().min(1, "El tipo de evento es requerido"),
  escenarioId: z.string().min(1, "El escenario es requerido"),
  categoriaId: z.string().min(1, "La categoría es requerida"),
}).refine(data => new Date(data.fin) > new Date(data.inicio), {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["fin"],
});

type EditEventFormProps = {
  event: ApiEvent;
  venues: Venue[];
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
};

const toDateTimeLocal = (dateString: string | null) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
    } catch(e) {
        return '';
    }
}

export function EditEventForm({ event, venues, categories, onSuccess, onCancel }: EditEventFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState({ general: false, image: false, folleto: false });
  const [error, setError] = useState<Record<string, string | null>>({ general: null, image: null, folleto: null });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedFolleto, setSelectedFolleto] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event.imagenUrl);
  const [folletoFileName, setFolletoFileName] = useState<string | null>(null);
  
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | undefined>(undefined);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: event.nombre,
      descripcion: event.descripcion || "",
      inicio: toDateTimeLocal(event.inicio),
      fin: toDateTimeLocal(event.fin),
      lugar: event.lugar,
      aforoMaximo: event.aforoMaximo,
      tipo: event.tipo,
      escenarioId: event.escenarioId,
      categoriaId: event.categoriaId,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(prev => ({ ...prev, image: 'Formato de imagen no válido. Use JPG, PNG o WEBP.'}));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(prev => ({ ...prev, image: 'La imagen es muy grande. Máximo 5MB.'}));
        return;
      }
      
      setError(prev => ({ ...prev, image: null}));
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCropComplete = (croppedFile: File) => {
    setSelectedImage(croppedFile);
    setImagePreview(URL.createObjectURL(croppedFile));
    setIsCropperOpen(false);
    setImageToCrop(undefined);
  };


  const handleFolletoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFolleto(file);
      setFolletoFileName(file.name);
    }
  };

  const handleSaveImage = async () => {
    if (!selectedImage) {
        setError(prev => ({...prev, image: 'Por favor, selecciona y recorta una imagen primero.'}));
        return;
    }
    setIsLoading(prev => ({ ...prev, image: true }));
    setError(prev => ({...prev, image: null}));

    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError(prev => ({...prev, image: "Tu sesión ha expirado."}));
        setIsLoading(prev => ({ ...prev, image: false }));
        return;
    }

    try {
        const imageFormData = new FormData();
        imageFormData.append('file', selectedImage);
        const imgResponse = await fetch(`http://localhost:44335/api/events/${event.id}/imagen`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: imageFormData
        });
        if (!imgResponse.ok) throw new Error('Error al subir la nueva imagen.');

        toast({ title: "Éxito", description: "La imagen del evento ha sido actualizada." });
        setSelectedImage(null);
        onSuccess();
    } catch (err: any) {
        setError(prev => ({...prev, image: err.message || "Ocurrió un error al subir la imagen."}));
    } finally {
        setIsLoading(prev => ({ ...prev, image: false }));
    }
  }

  const handleSaveFolleto = async () => {
    if (!selectedFolleto) {
        setError(prev => ({...prev, folleto: 'Por favor, selecciona un folleto primero.'}));
        return;
    }
    setIsLoading(prev => ({ ...prev, folleto: true }));
    setError(prev => ({...prev, folleto: null}));
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError(prev => ({...prev, folleto: "Tu sesión ha expirado."}));
        setIsLoading(prev => ({ ...prev, folleto: false }));
        return;
    }

    try {
        const folletoFormData = new FormData();
        folletoFormData.append('file', selectedFolleto);
        const folletoResponse = await fetch(`http://localhost:44335/api/events/${event.id}/folleto`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: folletoFormData
        });
        if (!folletoResponse.ok) throw new Error('Error al subir el nuevo folleto.');
        
        toast({ title: "Éxito", description: "El folleto del evento ha sido actualizado." });
        setSelectedFolleto(null);
        setFolletoFileName(null);
        onSuccess();
    } catch (err: any) {
        setError(prev => ({...prev, folleto: err.message || "Ocurrió un error al subir el folleto."}));
    } finally {
        setIsLoading(prev => ({ ...prev, folleto: false }));
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(prev => ({ ...prev, general: true }));
    setError(prev => ({...prev, general: null}));
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError(prev => ({...prev, general: "Tu sesión ha expirado."}));
        setIsLoading(prev => ({ ...prev, general: false }));
        return;
    }

    try {
        const submissionData = {
          id: event.id,
          estado: event.estado,
          organizadorId: event.organizadorId,
          nombre: values.nombre,
          descripcion: values.descripcion,
          lugar: values.lugar,
          aforoMaximo: values.aforoMaximo,
          tipo: values.tipo,
          escenarioId: values.escenarioId,
          categoriaId: values.categoriaId,
          inicio: new Date(values.inicio).toISOString(),
          fin: new Date(values.fin).toISOString()
        };

        const response = await fetch(`http://localhost:44335/api/events/${event.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || "No se pudo actualizar el evento.");
        }
        
        toast({ title: "Éxito", description: "La información del evento ha sido guardada." });
        onSuccess();

    } catch (err: any) {
        setError(prev => ({...prev, general: err.message || "Ocurrió un error desconocido."}));
    } finally {
        setIsLoading(prev => ({ ...prev, general: false }));
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-8">
                  <FormItem>
                      <FormLabel className="text-lg font-semibold">Imagen del Evento</FormLabel>
                      <div className="w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden">
                          {imagePreview ? (
                              <Image src={imagePreview} alt="Vista previa" width={500} height={300} className="object-cover w-full h-full" />
                          ) : (
                              <span className="text-muted-foreground">Sin Imagen</span>
                          )}
                      </div>
                      <FormControl>
                          <Input type="file" accept="image/*" onChange={handleImageChange} />
                      </FormControl>
                      <p className="text-sm text-blue-600">Se abrirá un editor para que puedas recortar la imagen.</p>
                      {error.image && <Alert variant="destructive" className="text-xs p-2 mt-2"><AlertDescription>{error.image}</AlertDescription></Alert>}
                      <Button type="button" onClick={handleSaveImage} disabled={!selectedImage || isLoading.image} className="w-full" variant="outline">
                          {isLoading.image ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {isLoading.image ? 'Guardando...' : 'Guardar Imagen'}
                      </Button>
                  </FormItem>
                  <FormItem>
                      <FormLabel className="text-lg font-semibold">Folleto del Evento (PDF)</FormLabel>
                       <div className="p-3 bg-muted/50 rounded-lg text-sm">
                          {event.folletoUrl && !folletoFileName ? (
                              <p className="text-green-600 flex items-center gap-2">
                                  <Paperclip className="h-4 w-4"/> Folleto cargado actualmente.
                              </p>
                          ) : (
                              <p className="text-muted-foreground">{folletoFileName || "No hay folleto cargado."}</p>
                          )}
                      </div>
                      <FormControl>
                          <Input type="file" accept=".pdf" onChange={handleFolletoChange} />
                      </FormControl>
                       {error.folleto && <Alert variant="destructive" className="text-xs p-2 mt-2"><AlertDescription>{error.folleto}</AlertDescription></Alert>}
                      <Button type="button" onClick={handleSaveFolleto} disabled={!selectedFolleto || isLoading.folleto} className="w-full" variant="outline">
                          {isLoading.folleto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                          {isLoading.folleto ? 'Guardando...' : 'Guardar Folleto'}
                      </Button>
                  </FormItem>
              </div>
              
              <div className="lg:col-span-2 space-y-6">
                  <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Nombre del Evento</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  
                  <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl><Textarea {...field} rows={5} /></FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="categoriaId"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Categoría</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  {categories.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.Nombre}</SelectItem>)}
                              </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="tipo"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Tipo de Evento</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="Presencial">Presencial</SelectItem>
                                  <SelectItem value="Virtual">Virtual</SelectItem>
                              </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                  </div>
                  
                  <FormField
                      control={form.control}
                      name="escenarioId"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Escenario</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger><SelectValue placeholder="Selecciona un escenario" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                              {venues.map(venue => <SelectItem key={venue.id} value={venue.id}>{venue.nombre}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                  />

                  <FormField
                      control={form.control}
                      name="lugar"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Lugar (Dirección)</FormLabel>
                          <FormControl><Input {...field} placeholder="Dirección detallada del evento" /></FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="inicio"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Fecha y Hora de Inicio</FormLabel>
                              <FormControl><Input type="datetime-local" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="fin"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Fecha y Hora de Fin</FormLabel>
                              <FormControl><Input type="datetime-local" {...field} min={form.watch('inicio')} /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                  </div>

                  <FormField
                      control={form.control}
                      name="aforoMaximo"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Aforo Máximo</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>
          </div>
          
          {error.general && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error al Guardar</AlertTitle>
                  <AlertDescription>{error.general}</AlertDescription>
              </Alert>
          )}

          <div className="flex justify-end gap-4 pt-8 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={Object.values(isLoading).some(v => v)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading.general}>
              {isLoading.general && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading.general ? "Guardando..." : "Guardar Información"}
            </Button>
          </div>
        </form>
      </Form>
      {imageToCrop && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setImageToCrop(undefined);
          }}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
