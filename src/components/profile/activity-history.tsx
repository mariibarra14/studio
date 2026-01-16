
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
import { es, enUS } from 'date-fns/locale';
import { LogIn, User, CreditCard, ShoppingCart, LogOut, Pencil, History, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/app-context";
import { useTranslation } from "react-i18next";

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
  const { user, language } = useApp();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchActivityHistory = async () => {
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');

      if (!userId || !token) {
        setError("auth");
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
            setError("no_history")
          }
        } else {
            const errorText = await response.text();
            
            if (response.status === 401) {
              setError("auth");
            } else if (response.status === 400 || errorText.includes("No se encontraron actividades")) {
              setError("no_history");
            } else {
              setError("load");
            }
        }
      } catch (e) {
        setError("load");
        toast({
            variant: "destructive",
            title: t('profile.activity_history.error_connection_title'),
            description: t('profile.activity_history.error_connection_desc')
        })
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityHistory();
  }, [toast, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && activities.length === 0) {
    const isAuthError = error === 'auth';
    const errorTitleKey = isAuthError ? 'profile.activity_history.error_auth_title' : 'profile.activity_history.error_no_history_title';
    const errorDescKey = isAuthError ? 'profile.activity_history.error_auth_desc' : 'profile.activity_history.error_no_history_desc';
    return (
       <Alert variant={isAuthError ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t(errorTitleKey)}</AlertTitle>
          <AlertDescription>{t(errorDescKey)}</AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="relative max-h-96 overflow-y-auto border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>{t('profile.activity_history.table_header_action')}</TableHead>
            <TableHead className="text-right">{t('profile.activity_history.table_header_date')}</TableHead>
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
                {format(new Date(activity.timestamp), "dd/MM/yyyy h:mm a", { locale: language === 'es' ? es : enUS })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
