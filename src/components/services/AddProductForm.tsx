
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  precio: z.coerce.number().min(0, "El precio debe ser 0 o mayor"),
  cantidad: z.coerce.number().int("La cantidad debe ser un número entero").min(0, "La cantidad no puede ser negativa"),
  descripcion: z.string().optional(),
  imagen: z.any().refine(file => file instanceof File, "La imagen es requerida."),
});

type AddProductFormProps = {
  serviceId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function AddProductForm({ serviceId, onSuccess, onCancel }: AddProductFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      precio: 0,
      cantidad: 0,
      descripcion: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("imagen", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Tu sesión ha expirado.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('IdServicio', serviceId);
    formData.append('Nombre', values.nombre);
    formData.append('Precio', values.precio.toString());
    formData.append('Cantidad', values.cantidad.toString());
    formData.append('Descripcion', values.descripcion || "");
    formData.append('FotoProducto', 'string'); // Hardcoded value
    formData.append('imagen', values.imagen);

    try {
      const response = await fetch('http://localhost:44335/api/ServComps/Prods/crearProducto', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Sesión expirada. Por favor, ingrese de nuevo.");
        }
        throw new Error("No se pudo crear el producto. Revisa los datos e intenta de nuevo.");
      }
      
      await response.json();
      toast({ title: "Éxito", description: "Producto agregado correctamente." });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-2">
            <FormLabel>Imagen del Producto</FormLabel>
            <div
              className="relative w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer overflow-hidden bg-muted/20"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Vista previa" fill className="object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Upload className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-sm">Haga clic para seleccionar</p>
                </div>
              )}
            </div>
            <FormControl>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </FormControl>
            <FormMessage>{form.formState.errors.imagen?.message as string}</FormMessage>
          </div>

          <div className="md:col-span-2 space-y-4">
            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem><FormLabel>Nombre del Producto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="precio" render={({ field }) => (
                <FormItem><FormLabel>Precio ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cantidad" render={({ field }) => (
                <FormItem><FormLabel>Cantidad (Stock)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="descripcion" render={({ field }) => (
              <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "Agregar Producto"}</Button>
        </div>
      </form>
    </Form>
  );
}
