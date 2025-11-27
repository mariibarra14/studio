
"use client";

import { useState, useEffect, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Building, RefreshCw, PlusCircle, Trash2, Edit } from "lucide-react";
import { VenueCard } from "@/components/venues/venue-card";
import { VenueDetailsModal } from "@/components/venues/venue-details-modal";
import { AddVenueModal } from "@/components/venues/add-venue-modal";
import type { Venue } from "@/lib/types";
import { useApp } from "@/context/app-context";
import { useToast } from "@/hooks/use-toast";
import { EditVenueModal } from "@/components/venues/edit-venue-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [isEditVenueOpen, setIsEditVenueOpen] = useState(false);
  const { userRole } = useApp();
  const { toast } = useToast();

  const fetchVenues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:44335/api/events/escenarios", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = "Ocurrió un error inesperado al cargar los escenarios.";
        if (response.status === 401) {
          errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.";
        } else if (response.status === 404) {
          setVenues([]);
          setIsLoading(false);
          return;
        } else if (response.status === 500) {
          errorMessage = "Error interno del servidor. Inténtalo más tarde.";
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setVenues(data.items || []);

    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          setError("No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Ha ocurrido un error inesperado.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
  };

  const handleCloseModal = () => {
    setSelectedVenue(null);
  };
  
  const handleAddSuccess = () => {
    setIsAddVenueOpen(false);
    fetchVenues();
  };

  const handleEditSuccess = () => {
    setIsEditVenueOpen(false);
    setSelectedVenue(null);
    fetchVenues();
  };
  
  const handleDeleteSuccess = () => {
    setSelectedVenue(null);
    fetchVenues();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4 bg-card">
          <Alert variant="destructive" className="max-w-md border-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al Cargar Escenarios</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchVenues} className="mt-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      );
    }

    if (venues.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
          <Building className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-2xl font-semibold text-muted-foreground mb-2">No hay escenarios disponibles</p>
          <p className="text-muted-foreground mb-6">No se encontraron escenarios registrados en este momento.</p>
           {userRole === 'administrador' && (
              <Button onClick={() => setIsAddVenueOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Primer Escenario
              </Button>
            )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} onVenueClick={handleVenueClick} />
        ))}
      </div>
    );
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold">Escenarios</h1>
            <div className="flex items-center gap-4">
              {!isLoading && !error && (
                <p className="text-muted-foreground text-sm">
                  {venues.length} escenario{venues.length !== 1 ? 's' : ''} encontrado{venues.length !== 1 ? 's' : ''}
                </p>
              )}
              {userRole === 'administrador' && (
                <Button onClick={() => setIsAddVenueOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Escenario
                </Button>
              )}
            </div>
        </div>
        {renderContent()}
      </main>
      
      {selectedVenue && (
        <VenueDetailsModal 
          venue={selectedVenue} 
          isOpen={!!selectedVenue} 
          onClose={handleCloseModal}
          onEdit={() => {
            handleCloseModal();
            setIsEditVenueOpen(true);
          }}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
      
      {userRole === 'administrador' && (
        <AddVenueModal
          isOpen={isAddVenueOpen}
          onClose={() => setIsAddVenueOpen(false)}
          onSuccess={handleAddSuccess}
        />
      )}
      
      {userRole === 'administrador' && selectedVenue && (
        <EditVenueModal
            isOpen={isEditVenueOpen}
            onClose={() => setIsEditVenueOpen(false)}
            onSuccess={handleEditSuccess}
            venue={selectedVenue}
        />
      )}

    </AuthenticatedLayout>
  );
}
