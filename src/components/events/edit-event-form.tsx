
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
  imagen: z.any().optional(),
  folleto: z.any().optional(),
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event.imagenUrl);
  const [folletoFileName, setFolletoFileName] = useState<string | null>(null);

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
      form.setValue('imagen', file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFolletoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('folleto', file);
      setFolletoFileName(file.name);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        setIsSaving(false);
        return;
    }

    try {
        // 1. Upload image if changed
        if (values.imagen instanceof File) {
            const imageFormData = new FormData();
            imageFormData.append('file', values.imagen);
            const imgResponse = await fetch(`http://localhost:44335/api/events/${event.id}/imagen`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: imageFormData
            });
            if (!imgResponse.ok) throw new Error('Error al subir la nueva imagen.');
        }

        // 2. Upload brochure if changed
        if (values.folleto instanceof File) {
            const folletoFormData = new FormData();
            folletoFormData.append('file', values.folleto);
            const folletoResponse = await fetch(`http://localhost:44335/api/events/${event.id}/folleto`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: folletoFormData
            });
            if (!folletoResponse.ok) throw new Error('Error al subir el nuevo folleto.');
        }

        // 3. Update event info
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
        
        onSuccess();

    } catch (err: any) {
        setError(err.message || "Ocurrió un error desconocido.");
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al actualizar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna Izquierda: Imagen y Folleto */}
            <div className="lg:col-span-1 space-y-6">
                <FormField
                    control={form.control}
                    name="imagen"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-lg font-semibold">Imagen del Evento</FormLabel>
                            <div className="w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Vista previa" width={400} height={225} className="object-cover w-full h-full" />
                                ) : (
                                    <span className="text-muted-foreground">Sin Imagen</span>
                                )}
                            </div>
                            <FormControl>
                                <Input type="file" accept="image/*" onChange={handleImageChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="folleto"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-lg font-semibold">Folleto del Evento (PDF)</FormLabel>
                             <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                {event.folletoUrl ? (
                                    <p className="text-green-600 flex items-center gap-2">
                                        <Paperclip className="h-4 w-4"/> Folleto cargado actualmente.
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">No hay folleto cargado.</p>
                                )}
                                {folletoFileName && (
                                     <p className="text-blue-600 mt-2">Nuevo: {folletoFileName}</p>
                                )}
                            </div>
                            <FormControl>
                                <Input type="file" accept=".pdf" onChange={handleFolletoChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Columna Derecha: Formulario de datos */}
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

        <div className="flex justify-end gap-4 pt-8 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
