
"use client";

import "@/lib/i18n"; // Import i18next configuration
import { useToast } from "@/hooks/use-toast";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { i18n } from "i18next";
import { useTranslation } from "react-i18next";
import { getConversionRates, type ConversionRates } from "@/lib/currency-converter";

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
  preferencias: string[];
};

export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export type Language = {
  code: string;
  name: string;
};

export type Region = {
  countryCode: string;
  name: string;
  currency: Currency;
  language: Language;
};


type AppContextType = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  isLoadingUser: boolean;
  userRole: string | null;
  refetchUser: () => Promise<void>;
  prefetchUser: (token: string, userId: string) => Promise<void>;
  
  // Locale state
  isLoadingLocale: boolean;
  language: string;
  currency: Currency;
  detectedRegion: Region | null;
  supportedLanguages: Language[];
  supportedCurrencies: Currency[];
  setLocale: (language: string, currencyCode: string) => void;
  i18n: i18n;
  conversionRates: ConversionRates;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const supportedLanguages: Language[] = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
];

const supportedCurrencies: Currency[] = [
  { code: 'COP', name: 'Pesos Colombianos', symbol: '$' },
  { code: 'USD', name: 'Dólares Americanos', symbol: '$' },
  { code: 'EUR', name: 'Euros', symbol: '€' },
];

const regionMappings: { [key: string]: Omit<Region, 'name'> } = {
  'CO': { countryCode: 'CO', currency: supportedCurrencies[0], language: supportedLanguages[0] }, // Colombia
  'US': { countryCode: 'US', currency: supportedCurrencies[1], language: supportedLanguages[1] }, // United States
  'ES': { countryCode: 'ES', currency: supportedCurrencies[2], language: supportedLanguages[0] }, // Spain
  'VE': { countryCode: 'VE', currency: supportedCurrencies[1], language: supportedLanguages[0] }, // Venezuela
  // Default fallback
  'default': { countryCode: 'US', currency: supportedCurrencies[1], language: supportedLanguages[1] },
};


export function AppProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const { toast } = useToast();

  // Locale state
  const [isLoadingLocale, setIsLoadingLocale] = useState(true);
  const [language, setLanguage] = useState(supportedLanguages[1].code);
  const [currency, setCurrency] = useState(supportedCurrencies[1]);
  const [conversionRates, setConversionRates] = useState<ConversionRates>({});
  const [detectedRegion, setDetectedRegion] = useState<Region | null>(null);
  const { i18n } = useTranslation();


  const setLocale = (languageCode: string, currencyCode: string) => {
    const newLang = supportedLanguages.find(l => l.code === languageCode) || supportedLanguages[1];
    const newCurr = supportedCurrencies.find(c => c.code === currencyCode) || supportedCurrencies[1];
    
    setLanguage(newLang.code);
    setCurrency(newCurr);
    i18n.changeLanguage(newLang.code);
    localStorage.setItem('userLanguage', newLang.code);
    localStorage.setItem('userCurrency', newCurr.code);
  };
  
  useEffect(() => {
    const initializeLocale = async () => {
      setIsLoadingLocale(true);
      
      // Fetch conversion rates
      getConversionRates().then(setConversionRates);

      const savedLang = localStorage.getItem('userLanguage');
      const savedCurr = localStorage.getItem('userCurrency');

      if (savedLang && savedCurr) {
        setLocale(savedLang, savedCurr);
      } else {
        try {
          const response = await fetch("https://ipapi.co/json/");
          if (response.ok) {
            const data = await response.json();
            const countryCode = data.country_code;
            const regionConfig = regionMappings[countryCode] || regionMappings.default;
            
            setDetectedRegion({
              ...regionConfig,
              name: data.country_name,
            });
            setLocale(regionConfig.language.code, regionConfig.currency.code);
          } else {
            // Fallback to default if API fails
            setLocale(regionMappings.default.language.code, regionMappings.default.currency.code);
          }
        } catch (error) {
          console.warn("Could not fetch user region, using default settings.");
          setLocale(regionMappings.default.language.code, regionMappings.default.currency.code);
        }
      }
      setIsLoadingLocale(false);
    };

    initializeLocale();
  }, [i18n]);


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

      let finalUserData: User = { 
          ...userData, 
          nombreRol: userData.rol, 
          rol: role,
          preferencias: userData.preferencias || [],
        };

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
    <AppContext.Provider value={{ 
        isSidebarOpen, 
        toggleSidebar, 
        user, 
        isLoadingUser, 
        userRole, 
        refetchUser, 
        prefetchUser,
        isLoadingLocale,
        language,
        currency,
        detectedRegion,
        supportedLanguages,
        supportedCurrencies,
        setLocale,
        i18n,
        conversionRates,
     }}>
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
