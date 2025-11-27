
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
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Venue } from "@/lib/types";
import { getAllCategories, type Category } from "@/lib/categories";
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

type AddEventFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function AddEventForm({ onSuccess, onCancel }: AddEventFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState({ general: false, image: false, folleto: false });
  const [error, setError] = useState<Record<string, string | null>>({ general: null, image: null, folleto: null });
  const [venues, setVenues] = useState<Venue[]>([]);
  const categories = getAllCategories();
  
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedFolleto, setSelectedFolleto] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [folletoFileName, setFolletoFileName] = useState<string | null>(null);
  
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | undefined>(undefined);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      inicio: "",
      fin: "",
      lugar: "",
      aforoMaximo: 0,
      tipo: "Presencial",
      escenarioId: "",
      categoriaId: "",
    },
  });
  
  useEffect(() => {
    const fetchVenues = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const response = await fetch('http://localhost:44335/api/events/escenarios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setVenues(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch venues", error);
      }
    };
    fetchVenues();
  }, []);

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
      setImageToCrop(URL.createObjectURL(file));
      setIsCropperOpen(true);
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

  async function handleCreateEvent(values: z.infer<typeof formSchema>) {
    setIsLoading(prev => ({ ...prev, general: true }));
    setError(prev => ({...prev, general: null}));
    
    const token = localStorage.getItem('accessToken');
    const organizadorId = localStorage.getItem('userId');
    if (!token || !organizadorId) {
        setError(prev => ({...prev, general: "Tu sesión ha expirado."}));
        setIsLoading(prev => ({ ...prev, general: false }));
        return;
    }

    try {
        const submissionData = {
          ...values,
          organizadorId,
          inicio: new Date(values.inicio).toISOString(),
          fin: new Date(values.fin).toISOString()
        };

        const response = await fetch(`http://localhost:44335/api/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || "No se pudo crear el evento.");
        }
        
        const result = await response.json();
        setCreatedEventId(result.id);
        toast({ title: "Paso 1/3 Completado", description: "Información del evento guardada. Ahora puedes subir una imagen y un folleto." });

    } catch (err: any) {
        setError(prev => ({...prev, general: err.message || "Ocurrió un error desconocido."}));
    } finally {
        setIsLoading(prev => ({ ...prev, general: false }));
    }
  }

  const handleUploadFile = async (type: 'image' | 'folleto') => {
    const file = type === 'image' ? selectedImage : selectedFolleto;
    if (!file || !createdEventId) {
      setError(prev => ({ ...prev, [type]: `Por favor, selecciona un ${type === 'image' ? 'imagen' : 'folleto'}.` }));
      return;
    }
    
    setIsLoading(prev => ({ ...prev, [type]: true }));
    setError(prev => ({ ...prev, [type]: null }));

    const token = localStorage.getItem('accessToken');
    const endpoint = `http://localhost:44335/api/events/${createdEventId}/${type === 'image' ? 'imagen' : 'folleto'}`;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) throw new Error(`Error al subir ${type === 'image' ? 'la imagen' : 'el folleto'}.`);

      toast({ title: `Paso ${type === 'image' ? '2/3' : '3/3'} Completado`, description: `El archivo se ha subido correctamente.` });
      if (type === 'image') setSelectedImage(null);
      if (type === 'folleto') setSelectedFolleto(null);
    } catch (err: any) {
      setError(prev => ({ ...prev, [type]: err.message }));
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreateEvent)} className="space-y-8 py-4">
          
          {!createdEventId ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem><FormLabel>Nombre del Evento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="descripcion" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="categoriaId" render={({ field }) => ( <FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl><SelectContent>{categories.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.Nombre}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="tipo" render={({ field }) => ( <FormItem><FormLabel>Tipo de Evento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Presencial">Presencial</SelectItem><SelectItem value="Virtual">Virtual</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                    </div>
                </div>
                <div className="space-y-6">
                    <FormField control={form.control} name="escenarioId" render={({ field }) => ( <FormItem><FormLabel>Escenario</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl><SelectContent>{venues.map(venue => <SelectItem key={venue.id} value={venue.id}>{venue.nombre}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="lugar" render={({ field }) => ( <FormItem><FormLabel>Lugar (Dirección)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="inicio" render={({ field }) => ( <FormItem><FormLabel>Fecha y Hora de Inicio</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="fin" render={({ field }) => ( <FormItem><FormLabel>Fecha y Hora de Fin</FormLabel><FormControl><Input type="datetime-local" {...field} min={form.watch('inicio')} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="aforoMaximo" render={({ field }) => ( <FormItem><FormLabel>Aforo Máximo</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
              </div>
              {error.general && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error.general}</AlertDescription></Alert>}
              <div className="flex justify-end gap-4 pt-8 border-t">
                  <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                  <Button type="submit" disabled={isLoading.general}>{isLoading.general ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar y Continuar"}</Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* UPLOAD IMAGE */}
                  <div className="space-y-4">
                      <FormLabel className="text-lg font-semibold">Paso 2 (Opcional): Imagen del Evento</FormLabel>
                      <div className="w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden">
                          {imagePreview ? <Image src={imagePreview} alt="Vista previa" width={500} height={300} className="object-cover w-full h-full" /> : <span className="text-muted-foreground">Sin Imagen</span>}
                      </div>
                      <FormControl>
                          <Input type="file" accept="image/*" onChange={handleImageChange} />
                      </FormControl>
                      <p className="text-sm text-blue-600">Se abrirá un editor para que puedas recortar la imagen.</p>
                      {error.image && <Alert variant="destructive" className="text-xs p-2 mt-2"><AlertDescription>{error.image}</AlertDescription></Alert>}
                      <Button type="button" onClick={() => handleUploadFile('image')} disabled={!selectedImage || isLoading.image} className="w-full" variant="outline">
                          {isLoading.image ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          Subir Imagen
                      </Button>
                  </div>
                  {/* UPLOAD FOLLETO */}
                  <div className="space-y-4">
                      <FormLabel className="text-lg font-semibold">Paso 3 (Opcional): Folleto del Evento</FormLabel>
                       <div className="p-3 bg-muted/50 rounded-lg text-sm h-48 flex flex-col justify-center items-center">
                          <Paperclip className="h-10 w-10 text-muted-foreground mb-2"/>
                          <p className="text-muted-foreground">{folletoFileName || "No hay folleto seleccionado."}</p>
                      </div>
                      <FormControl>
                          <Input type="file" accept=".pdf" onChange={handleFolletoChange} />
                      </FormControl>
                       {error.folleto && <Alert variant="destructive" className="text-xs p-2 mt-2"><AlertDescription>{error.folleto}</AlertDescription></Alert>}
                      <Button type="button" onClick={() => handleUploadFile('folleto')} disabled={!selectedFolleto || isLoading.folleto} className="w-full" variant="outline">
                          {isLoading.folleto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                          Subir Folleto
                      </Button>
                  </div>
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t">
                  <Button onClick={onSuccess}>Finalizar</Button>
              </div>
            </>
          )}
        </form>
      </Form>
      {imageToCrop && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => { setIsCropperOpen(false); setImageToCrop(undefined); }}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
