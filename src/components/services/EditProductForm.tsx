
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
import type { Product } from "@/lib/types";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  precio: z.coerce.number().min(0, "El precio debe ser 0 o mayor"),
  cantidad: z.coerce.number().int("La cantidad debe ser un número entero").min(0, "La cantidad no puede ser negativa"),
  descripcion: z.string().optional(),
  nuevaImagen: z.any().optional(),
});

type EditProductFormProps = {
  product: Product;
  onSuccess: () => void;
  onCancel: () => void;
};

export function EditProductForm({ product, onSuccess, onCancel }: EditProductFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.fotoProducto);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: product.nombre,
      precio: product.precio,
      cantidad: product.cantidad,
      descripcion: product.descripcion,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("nuevaImagen", file);
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
    formData.append('Nombre', values.nombre);
    formData.append('Precio', values.precio.toString());
    formData.append('Cantidad', values.cantidad.toString());
    formData.append('Descripcion', values.descripcion || "");
    // Send current photo URL as FotoProducto
    formData.append('FotoProducto', product.fotoProducto || "string");

    if (values.nuevaImagen instanceof File) {
      formData.append('nuevaImagen', values.nuevaImagen, values.nuevaImagen.name);
    }

    try {
      const response = await fetch(`http://localhost:44335/api/ServComps/Prods/modificarProducto?id=${product.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const responseText = await response.text();

      if (response.ok && responseText.includes("Producto actualizado exitosamente")) {
          toast({ title: "Éxito", description: "¡Producto actualizado correctamente!" });
          onSuccess();
      } else {
        if (response.status === 401) {
            throw new Error("Sesión expirada. Por favor, inicie sesión nuevamente.");
        }
        throw new Error(responseText || "No se pudo actualizar el producto. Revisa los datos e intenta de nuevo.");
      }
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error", description: err.message });
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
              {imagePreview && imagePreview !== 'string' ? (
                <Image src={imagePreview} alt="Vista previa" fill className="object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Upload className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-sm">Sin imagen</p>
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
             <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4"/>
              Cambiar Imagen
            </Button>
            <FormMessage>{form.formState.errors.nuevaImagen?.message as string}</FormMessage>
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
          <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}</Button>
        </div>
      </form>
    </Form>
  );
}
