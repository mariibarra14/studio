
"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { getAllCategories, type Category } from "@/lib/categories";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import type { User } from "@/context/app-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PreferencesFormProps = {
  user: User;
};

export function PreferencesForm({ user }: PreferencesFormProps) {
  const allCategories = getAllCategories();
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { refetchUser } = useApp();

  useEffect(() => {
    // Initialize state with user's current preferences
    if (user?.preferencias) {
      setSelectedPreferences(user.preferencias);
    }
  }, [user]);

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
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      setIsLoading(false);
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
        await refetchUser(); // Refetch user data to update context
      } else {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.message || "No se pudieron guardar las preferencias.";
        if (response.status === 401) {
          errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.";
        }
        throw new Error(errorMessage);
      }

    } catch (err: any) {
      setError(err.message || "Ocurrió un error de red.");
       toast({
          variant: "destructive",
          title: "Error al Guardar",
          description: err.message || "Ocurrió un error de red.",
        });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Selecciona las categorías que más te interesan.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allCategories.map((category) => (
            <div key={category._id} className="flex items-center space-x-3 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground">
              <Checkbox
                id={category._id}
                checked={selectedPreferences.includes(category.Nombre)}
                onCheckedChange={(checked) => handlePreferenceChange(category.Nombre, !!checked)}
              />
              <label
                htmlFor={category._id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {category.Nombre}
              </label>
            </div>
          ))}
        </div>
      </div>
      
       {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Guardar Preferencias"}
        </Button>
      </div>
    </div>
  );
}
