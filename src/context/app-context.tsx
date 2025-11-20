
"use client";

import { useToast } from "@/hooks/use-toast";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

export type User = {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  correo: string;
  telefono: string;
  direccion: string;
  fotoPerfil: string;
  rol: string;
  nombreRol: string;
};

type AppContextType = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  isLoadingUser: boolean;
  refetchUser: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const { toast } = useToast();
  
  const fetchUserAndRole = useCallback(async () => {
    setIsLoadingUser(true);
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const roleId = localStorage.getItem('roleId');

    if (token && userId) {
      try {
        const userResponse = await fetch(`http://localhost:44335/api/Usuarios/getUsuarioById?id=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          let friendlyMessage = "Error al cargar el perfil.";
          if (userResponse.status === 401) friendlyMessage = "Error de autorización: Su sesión expiró. Por favor, inicie sesión de nuevo.";
          else if (userResponse.status === 400) friendlyMessage = "Error de datos: Faltó el identificador del usuario. Vuelva a iniciar sesión si el problema persiste.";
          else if (errorText.includes("El usuario especificado no existe")) friendlyMessage = "Usuario no encontrado. El perfil no existe en la base de datos.";
          
          toast({ variant: "destructive", title: "Error de Perfil", description: friendlyMessage });
          setUser(null);
          setIsLoadingUser(false);
          return;
        }

        const userData = await userResponse.json();

        if (roleId) {
          const roleResponse = await fetch(`http://localhost:44335/api/Usuarios/getRolById?id=${roleId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            setUser({ ...userData, nombreRol: roleData.nombreRol });
          } else {
            toast({ variant: "destructive", title: "Error de Rol", description: "No se pudo cargar el nombre del rol, se usará el ID." });
            setUser({ ...userData, nombreRol: userData.rol });
          }
        } else {
           setUser({ ...userData, nombreRol: userData.rol });
        }

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error de Conexión",
          description: "No se pudo conectar con el servidor para cargar el perfil.",
        });
        setUser(null);
      }
    }
    setIsLoadingUser(false);
  }, [toast]);


  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    fetchUserAndRole();
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [fetchUserAndRole]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  const refetchUser = async () => {
    await fetchUserAndRole();
  };

  return (
    <AppContext.Provider value={{ isSidebarOpen, toggleSidebar, user, isLoadingUser, refetchUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
