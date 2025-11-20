
"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LogIn, User, CreditCard, ShoppingCart, LogOut, Pencil, History, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/app-context";

type Activity = {
  id: string;
  idUsuario: string;
  accion: string;
  timestamp: string;
};

const iconMap: { [key: string]: React.ReactNode } = {
  "Log in": <LogIn className="h-5 w-5 text-muted-foreground" />,
  "profile update": <Pencil className="h-5 w-5 text-muted-foreground" />,
  "payment method added": <CreditCard className="h-5 w-5 text-muted-foreground" />,
  "ticket purchase": <ShoppingCart className="h-5 w-5 text-muted-foreground" />,
  "Log out": <LogOut className="h-5 w-5 text-muted-foreground" />,
  "default": <History className="h-5 w-5 text-muted-foreground" />
};

const getIcon = (action: string) => {
    const lowerCaseAction = action.toLowerCase();
    if (lowerCaseAction.includes('log in')) return iconMap['Log in'];
    if (lowerCaseAction.includes('actualizó')) return iconMap['profile update'];
    // Add more specific mappings as needed
    return iconMap['default'];
};


export function ActivityHistory() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useApp();
  const { toast } = useToast();

  useEffect(() => {
    const fetchActivityHistory = async () => {
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');

      if (!userId || !token) {
        setError("Error de autorización: Su sesión expiró o no está autenticada. (Por favor, inicie sesión de nuevo.)");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:44335/api/Usuarios/activity?Id=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setActivities(data);
          if (data.length === 0) {
            setError("No hay historial de actividad disponible. (Aún no ha realizado acciones registradas.)")
          }
        } else {
            const errorText = await response.text();
            let friendlyMessage = "Error al cargar el historial. (Hubo un problema al intentar obtener su actividad.)";

            if (response.status === 401) {
              friendlyMessage = "Error de autorización: Su sesión expiró o no está autenticada. (Por favor, inicie sesión de nuevo.)";
            } else if (response.status === 400) {
              friendlyMessage = "Error de datos: Faltó el identificador del usuario. (No se pudo cargar el historial.)";
            } else if (errorText.includes("No se encontraron actividades")) {
                friendlyMessage = "No hay historial de actividad disponible. (Aún no ha realizado acciones registradas.)";
            }
            setError(friendlyMessage);
        }
      } catch (e) {
        setError("Error al cargar el historial. (Hubo un problema al intentar obtener su actividad.)");
        toast({
            variant: "destructive",
            title: "Error de Conexión",
            description: "No se pudo conectar con el servidor para obtener el historial."
        })
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityHistory();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
       <Alert variant={error.includes("autorización") ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.includes("autorización") ? "Error de Sesión" : "Sin Actividad"}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="relative max-h-96 overflow-y-auto border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>Actividad</TableHead>
            <TableHead className="text-right">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell className="font-medium flex items-center gap-3">
                {getIcon(activity.accion)}
                <span>{activity.accion}</span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {format(new Date(activity.timestamp), "dd/MM/yyyy h:mm a", { locale: es })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
