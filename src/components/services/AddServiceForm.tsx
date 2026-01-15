
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
import { Loader2, AlertCircle, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const dayMap: { [key: string]: string } = {
  'Lunes': 'Monday',
  'Martes': 'Tuesday',
  'Miércoles': 'Wednesday',
  'Jueves': 'Thursday',
  'Viernes': 'Friday',
  'Sábado': 'Saturday',
  'Domingo': 'Sunday',
};
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

type AddServiceFormProps = {
  onSuccess: (serviceId: string) => void;
  onCancel: () => void;
};

export function AddServiceForm({ onSuccess, onCancel }: AddServiceFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      tipo: "Merchandising",
      descripcion: "",
      horario: [{ dia: "Lunes", rangos: [{ inicio: "09:00", fin: "18:00" }] }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "horario",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Tu sesión ha expirado.");
      setIsLoading(false);
      return;
    }

    const submissionData = {
      ...values,
      horario: values.horario.map(h => ({
        ...h,
        dia: dayMap[h.dia] || h.dia,
      })),
      fotoServicio: "string", // Hardcoded as per requirement
    };

    try {
      const response = await fetch('http://localhost:44335/api/ServComps/Servs/crearServicio', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error("No se pudo crear el servicio. Revisa los datos e intenta de nuevo.");
      }
      
      const result = await response.json();
      toast({ title: "Paso 1 Completado", description: "Datos del servicio guardados. Ahora sube la imagen." });
      onSuccess(result.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="nombre" render={({ field }) => (
          <FormItem><FormLabel>Nombre del Servicio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <FormField control={form.control} name="descripcion" render={({ field }) => (
          <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <div>
          <FormLabel>Horario</FormLabel>
          <div className="space-y-4 mt-2">
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
            <Button type="button" variant="outline" size="sm" onClick={() => append({ dia: "Lunes", rangos: [{ inicio: "09:00", fin: "17:00" }] })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Día
            </Button>
            <FormMessage>{form.formState.errors.horario?.message}</FormMessage>
          </div>
        </div>

        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "Guardar y Continuar"}</Button>
        </div>
      </form>
    </Form>
  );
}

function TimeRanges({ nestIndex, control }: { nestIndex: number, control: any }) {
  const { fields } = useFieldArray({
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
        </div>
      ))}
    </div>
  );
}
