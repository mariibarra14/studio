"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import type { User } from "@/context/app-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type ApiCategory = {
  id: string;
  nombre: string;
  descripcion: string;
};

type PreferencesFormProps = {
  user: User;
};

export function PreferencesForm({ user }: PreferencesFormProps) {
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { refetchUser } = useApp();

  useEffect(() => {
    if (user?.preferencias) {
      setSelectedPreferences(user.preferencias);
    }
  }, [user]);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      setLoadingError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoadingError("Sesión caducada: Por favor, inicia sesión nuevamente para gestionar tus preferencias.");
        setIsLoadingCategories(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:44335/api/events/Categorias', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sesión caducada: Por favor, inicia sesión nuevamente para gestionar tus preferencias.");
          }
          throw new Error("Oops: No pudimos cargar las categorías en este momento. Intenta refrescar la página.");
        }
        const data: ApiCategory[] = await response.json();
        setApiCategories(data);
      } catch (err: any) {
        setLoadingError(err.message);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);

  const handlePreferenceChange = (categoryName: string, isChecked: boolean) => {
    setSelectedPreferences(prev => {
      if (isChecked) {
        return [...prev, categoryName];
      } else {
        return prev.filter(pref => pref !== categoryName);
      }
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      setSubmitError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/Usuarios/modificarPreferencias?idUsuario=${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferencias: selectedPreferences,
        }),
      });

      if (response.ok) {
         toast({
          title: "Preferencias Guardadas",
          description: "Tus preferencias de contenido han sido actualizadas.",
        });
        await refetchUser();
      } else {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.message || "No se pudieron guardar las preferencias.";
        if (response.status === 401) {
          errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.";
        }
        throw new Error(errorMessage);
      }

    } catch (err: any) {
      setSubmitError(err.message || "Ocurrió un error de red.");
       toast({
          variant: "destructive",
          title: "Error al Guardar",
          description: err.message || "Ocurrió un error de red.",
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoadingCategories) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      );
    }

    if (loadingError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Categorías</AlertTitle>
          <AlertDescription>{loadingError}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {apiCategories.map((category) => (
          <label 
            key={category.id} 
            htmlFor={category.id}
            className="flex items-start space-x-3 rounded-md border p-4 transition-colors cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:bg-accent"
          >
            <Checkbox
              id={category.id}
              checked={selectedPreferences.includes(category.nombre)}
              onCheckedChange={(checked) => handlePreferenceChange(category.nombre, !!checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <span className="font-medium">
                {category.nombre}
              </span>
              <p className="text-sm text-muted-foreground">
                {category.descripcion}
              </p>
            </div>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Selecciona las categorías que más te interesan.
        </p>
        {renderContent()}
      </div>
      
       {submitError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al Guardar</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Preferencias"}
        </Button>
      </div>
    </div>
  );
}
