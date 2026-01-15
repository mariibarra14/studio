
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type UploadServiceImageFormProps = {
  serviceId: string;
  onSuccess: () => void;
};

export function UploadServiceImageForm({ serviceId, onSuccess }: UploadServiceImageFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalizeWithoutImage = () => {
    toast({
      title: "Servicio Creado",
      description: "El nuevo servicio se ha guardado correctamente.",
    });
    onSuccess();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Por favor, selecciona una imagen.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Tu sesión ha expirado.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("imagen", selectedFile);

    try {
      const response = await fetch(
        `http://localhost:44335/api/ServComps/Servs/subirImagenServ?id=${serviceId}`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo subir la imagen.");
      }
      
      await response.text();
      toast({ title: "¡Éxito!", description: "El servicio y su imagen se han guardado correctamente." });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <div
          className="relative w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer overflow-hidden bg-muted/20"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <Image src={preview} alt="Vista previa" fill className="object-contain p-1" />
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8" />
              <p>Haz clic para seleccionar una imagen</p>
              <p className="text-xs">(Opcional)</p>
            </div>
          )}
        </div>
        <Input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={handleFinalizeWithoutImage} disabled={isLoading}>
          Finalizar sin Imagen
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading || !selectedFile}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Subir Imagen y Finalizar"}
        </Button>
      </div>
    </div>
  );
}
