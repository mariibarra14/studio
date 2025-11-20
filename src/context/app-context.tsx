
"use client";

import { useToast } from "@/hooks/use-toast";
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const { toast } = useToast();

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

    const fetchUserAndRole = async () => {
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
            // Handle user fetch error
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

          // Fetch Role Name
          if (roleId) {
            const roleResponse = await fetch(`http://localhost:44335/api/Usuarios/getRolById?id=${roleId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              // Combine user and role data
              setUser({ ...userData, nombreRol: roleData.nombreRol });
            } else {
              // Handle role fetch error but still set user data
              toast({ variant: "destructive", title: "Error de Rol", description: "No se pudo cargar el nombre del rol, se usará el ID." });
              setUser({ ...userData, nombreRol: userData.rol }); // Fallback to roleId
            }
          } else {
             setUser({ ...userData, nombreRol: userData.rol }); // Fallback if no roleId in storage
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
    };

    fetchUserAndRole();
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [toast]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <AppContext.Provider value={{ isSidebarOpen, toggleSidebar, user, isLoadingUser }}>
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
