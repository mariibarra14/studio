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
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Venue } from "@/lib/types";
import { getAllCategories, type Category } from "@/lib/categories";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const categories = getAllCategories();
  
  // Usar useRef para prevenir doble envío
  const isSubmittingRef = useRef(false);

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

  async function handleCreateEvent(values: z.infer<typeof formSchema>) {
    // Prevenir doble envío
    if (isSubmittingRef.current) {
      console.log('Envío ya en progreso, ignorando...');
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    const token = localStorage.getItem('accessToken');
    const organizadorId = localStorage.getItem('userId');
    
    if (!token || !organizadorId) {
      setError("Tu sesión ha expirado.");
      setIsLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    try {
      const submissionData = {
        ...values,
        organizadorId,
        inicio: new Date(values.inicio).toISOString(),
        fin: new Date(values.fin).toISOString()
      };

      console.log('Enviando evento...', submissionData);

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
      console.log('Evento creado con ID:', result.id);
      
      toast({ 
        title: "✅ Evento creado", 
        description: `"${values.nombre}" se ha creado exitosamente.` 
      });
      
      // Llamar onSuccess inmediatamente después de crear el evento
      onSuccess();

    } catch (err: any) {
      console.error('Error creando evento:', err);
      setError(err.message || "Ocurrió un error desconocido.");
      toast({
        variant: "destructive",
        title: "❌ Error al crear evento",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
      // Usar timeout para asegurar que el componente se actualice antes de resetear
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 1000);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleCreateEvent)} className="space-y-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FormField 
              control={form.control} 
              name="nombre" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Nombre del Evento</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.Nombre}
                          </SelectItem>
                        ))}
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
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
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
          </div>
          
          <div className="space-y-6">
            <FormField 
              control={form.control} 
              name="escenarioId" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Escenario</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {venues.map(venue => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.nombre}
                        </SelectItem>
                      ))}
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
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        min={form.watch('inicio')} 
                      />
                    </FormControl>
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
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end gap-4 pt-8 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando Evento...
              </>
            ) : (
              "Crear Evento"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}