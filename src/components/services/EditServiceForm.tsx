
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, PlusCircle, Trash2, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import type { ComplementaryService } from "@/lib/types";

const dayMap: { [key: string]: string } = {
  'Lunes': 'Monday', 'Martes': 'Tuesday', 'Miércoles': 'Wednesday',
  'Jueves': 'Thursday', 'Viernes': 'Friday', 'Sábado': 'Saturday', 'Domingo': 'Sunday',
};
const reverseDayMap: { [key: string]: string } = Object.fromEntries(Object.entries(dayMap).map(([k, v]) => [v, k]));
const dayOptions = Object.keys(dayMap);

const timeRangeSchema = z.object({
  inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM requerido"),
  fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM requerido"),
});

const scheduleSchema = z.object({
  dia: z.string().min(1, "Seleccione un día"),
  rangos: z.array(timeRangeSchema).min(1, "Debe haber al menos un rango horario"),
});

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.string().min(1, "El tipo es requerido"),
  descripcion: z.string().optional(),
  horario: z.array(scheduleSchema).min(1, "Debe definir al menos un día de horario"),
});

type EditServiceFormProps = {
  service: ComplementaryService;
  onSuccess: () => void;
  onCancel: () => void;
};

export function EditServiceForm({ service, onSuccess, onCancel }: EditServiceFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState({ info: false, image: false });
  const [error, setError] = useState({ info: null as string | null, image: null as string | null });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(service.fotoServicio);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: service.nombre,
      tipo: service.tipo,
      descripcion: service.descripcion,
      horario: service.horario.map(h => ({
        ...h,
        dia: reverseDayMap[h.dia] || h.dia,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "horario",
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveImage = async () => {
    if (!selectedFile) {
      setError(prev => ({...prev, image: "Por favor, selecciona una imagen para subir."}));
      return;
    }
    
    setIsLoading(prev => ({...prev, image: true}));
    setError(prev => ({...prev, image: null}));

    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError(prev => ({...prev, image: "Tu sesión ha expirado."}));
        setIsLoading(prev => ({...prev, image: false}));
        return;
    }

    const formData = new FormData();
    formData.append("imagen", selectedFile);
    
    try {
        const response = await fetch(`http://localhost:44335/api/ServComps/Servs/subirImagenServ?id=${service.id}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) {
            throw new Error("No se pudo subir la imagen.");
        }
        
        toast({ title: "Imagen Actualizada", description: "La imagen del servicio ha sido actualizada."});
        onSuccess(); // To refetch and close modal
    } catch (err: any) {
        setError(prev => ({...prev, image: err.message}));
    } finally {
        setIsLoading(prev => ({...prev, image: false}));
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(prev => ({...prev, info: true}));
    setError(prev => ({...prev, info: null}));
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError(prev => ({...prev, info: "Tu sesión ha expirado."}));
      setIsLoading(prev => ({...prev, info: false}));
      return;
    }

    const submissionData = {
      nombre: values.nombre,
      tipo: values.tipo,
      descripcion: values.descripcion,
      horario: values.horario.map(h => ({
        dia: dayMap[h.dia] || h.dia,
        rangos: h.rangos,
      })),
    };

    try {
      const response = await fetch(`http://localhost:44335/api/ServComps/Servs/modificarServicio?idServicio=${service.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || "No se pudo actualizar el servicio.");
      }
      
      const result = await response.json();
      if(result.success) {
        toast({ title: "Servicio Actualizado", description: "Los datos del servicio se han guardado." });
        onSuccess();
      } else {
        throw new Error(result.mensaje || "Error al actualizar.");
      }
      
    } catch (err: any) {
      setError(prev => ({...prev, info: err.message}));
    } finally {
      setIsLoading(prev => ({...prev, info: false}));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Image Section */}
            <div className="md:col-span-1 space-y-4">
                <FormLabel>Imagen del Servicio</FormLabel>
                <div
                  className="relative w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground overflow-hidden bg-muted/20">
                  {imagePreview && imagePreview !== 'string' ? (
                    <Image src={imagePreview} alt="Vista previa" fill className="object-contain p-1" />
                  ) : (
                    <span className="text-sm">Sin imagen</span>
                  )}
                </div>
                <Input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
                {error.image && <AlertDescription className="text-destructive text-sm">{error.image}</AlertDescription>}
                <Button type="button" onClick={handleSaveImage} disabled={isLoading.image || !selectedFile} className="w-full" variant="outline">
                    {isLoading.image ? <Loader2 className="animate-spin" /> : <Upload className="mr-2"/>}
                    Guardar Imagen
                </Button>
            </div>
            
            {/* Info Section */}
            <div className="md:col-span-2 space-y-6">
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem><FormLabel>Nombre del Servicio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
        
                <FormField control={form.control} name="tipo" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de Servicio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Merchandising">Merchandising</SelectItem>
                            <SelectItem value="Catering">Catering</SelectItem>
                            <SelectItem value="Transporte">Transporte</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
        
                <FormField control={form.control} name="descripcion" render={({ field }) => (
                  <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>

        <div>
          <FormLabel>Horario</FormLabel>
          <div className="space-y-4 mt-2 max-h-60 overflow-y-auto p-1">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-3 bg-muted/50">
                <div className="flex justify-between items-center">
                   <FormField control={form.control} name={`horario.${index}.dia`} render={({ field }) => (
                        <FormItem className="flex-1"><FormLabel className="sr-only">Día</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un día"/></SelectTrigger></FormControl>
                            <SelectContent>{dayOptions.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                   <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <TimeRanges control={form.control} nestIndex={index} />
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ dia: "Lunes", rangos: [{ inicio: "09:00", fin: "17:00" }] })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Día
          </Button>
          <FormMessage>{form.formState.errors.horario?.message}</FormMessage>
        </div>

        {error.info && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error.info}</AlertDescription></Alert>}

        <div className="flex justify-end gap-4 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading.info}>Cancelar</Button>
          <Button type="submit" disabled={isLoading.info}>{isLoading.info ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}</Button>
        </div>
      </form>
    </Form>
  );
}

function TimeRanges({ nestIndex, control }: { nestIndex: number, control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `horario.${nestIndex}.rangos`,
  });

  return (
    <div className="space-y-2 pl-4 border-l-2">
      {fields.map((item, k) => (
        <div key={item.id} className="flex items-center gap-2">
          <FormField control={control} name={`horario.${nestIndex}.rangos.${k}.inicio`} render={({ field }) => (
            <FormItem className="flex-1"><FormLabel className="text-xs">Inicio</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name={`horario.${nestIndex}.rangos.${k}.fin`} render={({ field }) => (
            <FormItem className="flex-1"><FormLabel className="text-xs">Fin</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          {fields.length > 1 && <Button type="button" variant="ghost" size="icon" className="self-end" onClick={() => remove(k)}><Trash2 className="h-4 w-4"/></Button>}
        </div>
      ))}
      <Button type="button" variant="link" size="sm" onClick={() => append({ inicio: "00:00", fin: "00:00" })}>
        Agregar Rango
      </Button>
    </div>
  );
}
