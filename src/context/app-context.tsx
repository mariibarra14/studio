
"use client";

import { useToast } from "@/hooks/use-toast";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

// Simple JWT decoder
function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

export type User = {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  correo: string;
  telefono: string;
  direccion:string;
  fotoPerfil: string;
  rol: string;
  nombreRol: string;
};

type AppContextType = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  isLoadingUser: boolean;
  userRole: string | null;
  refetchUser: () => Promise<void>;
  prefetchUser: (token: string, userId: string) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const { toast } = useToast();
  
  const fetchUserAndRole = useCallback(async (
    token: string,
    userId: string
  ): Promise<{ user: User, role: string } | null> => {
    
    try {
      const decodedToken = decodeJwt(token);
      const roles = decodedToken?.realm_access?.roles || [];
      const role = roles.includes('administrador') ? 'administrador' :
                   roles.includes('organizador') ? 'organizador' :
                   roles.includes('soporte_tecnico') ? 'soporte_tecnico' : 'usuario_final';

      const userResponse = await fetch(`http://localhost:44335/api/Usuarios/getUsuarioById?id=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userResponse.ok) {
        throw new Error(`User fetch failed with status ${userResponse.status}`);
      }
      const userData = await userResponse.json();

      let finalUserData: User = { ...userData, nombreRol: userData.rol, rol: role };

      if (userData.rol) {
        const roleResponse = await fetch(`http://localhost:44335/api/Usuarios/getRolById?id=${userData.rol}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          finalUserData = { ...finalUserData, nombreRol: roleData.nombreRol };
        }
      }
      
      return { user: finalUserData, role };

    } catch (error) {
      console.error("Error fetching user and role:", error);
      toast({
          variant: "destructive",
          title: "Error de Carga de Perfil",
          description: "No se pudo cargar la información del usuario. Por favor, recargue la página.",
      });
      return null;
    }
  }, [toast]);

  const prefetchUser = async (token: string, userId: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userId', userId);
    
    setIsLoadingUser(true);
    const fetchedData = await fetchUserAndRole(token, userId);
    if (fetchedData) {
      localStorage.setItem('userRole', fetchedData.role);
      setUser(fetchedData.user);
      setUserRole(fetchedData.role);
    }
    setIsLoadingUser(false);
  };

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    
    if (token && userId) {
        setIsLoadingUser(true);
        setUserRole(role);
        const loaded = await fetchUserAndRole(token, userId);
        if (loaded) {
            setUser(loaded.user);
            setUserRole(loaded.role); // Ensure role is updated from fresh fetch
        }
        setIsLoadingUser(false);
    } else {
      setIsLoadingUser(false);
    }
  }, [fetchUserAndRole]);


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

    loadUser();
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [loadUser]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  const refetchUser = async () => {
    await loadUser();
  };

  return (
    <AppContext.Provider value={{ isSidebarOpen, toggleSidebar, user, isLoadingUser, userRole, refetchUser, prefetchUser }}>
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
