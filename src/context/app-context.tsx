
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
  prefetchUser: (token: string, userId: string, roleId: string) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Store prefetched data temporarily
let prefetchedUserData: User | null = null;

export function AppProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const { toast } = useToast();
  
  const fetchUserAndRole = useCallback(async (
    token: string,
    userId: string,
    roleId: string,
    isPrefetch: boolean = false
  ): Promise<User | null> => {
    if (!isPrefetch) setIsLoadingUser(true);
    
    try {
      const userResponse = await fetch(`http://localhost:44335/api/Usuarios/getUsuarioById?id=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userResponse.ok) {
        throw new Error(`User fetch failed with status ${userResponse.status}`);
      }
      const userData = await userResponse.json();

      let finalUserData: User = { ...userData, nombreRol: userData.rol };

      if (roleId) {
        const roleResponse = await fetch(`http://localhost:44335/api/Usuarios/getRolById?id=${roleId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          finalUserData = { ...userData, nombreRol: roleData.nombreRol };
        }
      }
      
      return finalUserData;

    } catch (error) {
      if (!isPrefetch) {
        toast({
          variant: "destructive",
          title: "Error de Carga de Perfil",
          description: "No se pudo cargar la información del usuario. Por favor, recargue la página.",
        });
      }
      return null;
    } finally {
      if (!isPrefetch) setIsLoadingUser(false);
    }
  }, [toast]);

  const prefetchUser = async (token: string, userId: string, roleId: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('roleId', roleId);
    
    const prefetched = await fetchUserAndRole(token, userId, roleId, true);
    if (prefetched) {
      prefetchedUserData = prefetched;
    }
  };

  const loadUser = useCallback(async () => {
    if (prefetchedUserData) {
      setUser(prefetchedUserData);
      setIsLoadingUser(false);
      prefetchedUserData = null; // Clear after use
      return;
    }

    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const roleId = localStorage.getItem('roleId');

    if (token && userId && roleId) {
      const loadedUser = await fetchUserAndRole(token, userId, roleId);
      if (loadedUser) {
        setUser(loadedUser);
      }
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
    <AppContext.Provider value={{ isSidebarOpen, toggleSidebar, user, isLoadingUser, refetchUser, prefetchUser }}>
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
