"use client";

import { useState, useEffect, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useApp } from "@/context/app-context";
import { Loader2, AlertCircle, PlusCircle, Building } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCard } from "@/components/services/ServiceCard";
import { AddServiceModal } from "@/components/services/AddServiceModal";
import type { ComplementaryService } from "@/lib/types";
import { ServiceDetailsModal } from "@/components/services/ServiceDetailsModal";
import { EditServiceModal } from "@/components/services/EditServiceModal";
import { ProductListModal } from "@/components/services/ProductListModal";

export default function ComplementaryServicesPage() {
  const { userRole, isLoadingUser } = useApp();
  const [services, setServices] = useState<ComplementaryService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [viewingService, setViewingService] = useState<ComplementaryService | null>(null);
  const [editingService, setEditingService] = useState<ComplementaryService | null>(null);
  const [viewingProductsForService, setViewingProductsForService] = useState<ComplementaryService | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoadingServices(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      setIsLoadingServices(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:44335/api/ServComps/Servs/getTodosServicios", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los servicios.");
      }
      const data = await response.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    if (isLoadingUser) return;
    
    if (userRole === 'administrador') {
      fetchServices();
    } else {
      setIsLoadingServices(false);
    }
  }, [userRole, isLoadingUser, fetchServices]);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchServices();
  };

  const handleViewDetails = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if(service) {
        setViewingService(service);
    }
  };

  const handleOpenEditModal = () => {
    if (viewingService) {
        setEditingService(viewingService);
        setViewingService(null);
    }
  };
  
  const handleEditSuccess = () => {
    setEditingService(null);
    fetchServices();
  };

  const handleDeleteSuccess = () => {
    setViewingService(null);
    fetchServices();
  };

  const handleViewProducts = () => {
    if (viewingService) {
      setViewingProductsForService(viewingService);
      setViewingService(null);
    }
  };

  const renderAdminContent = () => {
    if (isLoadingServices) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-80 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <ServiceCard key={service.id} service={service} onSelect={handleViewDetails} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Building className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No hay servicios creados</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Comienza por agregar tu primer servicio complementario.
            </p>
          </div>
        )}
        <AddServiceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddSuccess}
        />
        {viewingService && (
            <ServiceDetailsModal
                serviceId={viewingService.id}
                isOpen={!!viewingService}
                onClose={() => setViewingService(null)}
                onDeleteSuccess={handleDeleteSuccess}
                onEdit={handleOpenEditModal}
                onViewProducts={handleViewProducts}
            />
        )}
        {editingService && (
            <EditServiceModal
                service={editingService}
                isOpen={!!editingService}
                onClose={() => setEditingService(null)}
                onSuccess={handleEditSuccess}
            />
        )}
        {viewingProductsForService && (
          <ProductListModal
            service={viewingProductsForService}
            isOpen={!!viewingProductsForService}
            onClose={() => setViewingProductsForService(null)}
          />
        )}
      </>
    );
  };

  const renderUserContent = () => (
    <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
      <p className="text-muted-foreground">
        El contenido de los servicios complementarios va aquí
      </p>
    </div>
  );
  
  if (isLoadingUser) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 p-4 md:p-8">
           <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
           </div>
        </main>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Servicios Complementarios</h1>
          {userRole === 'administrador' && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Servicio
            </Button>
          )}
        </div>
        {userRole === 'administrador' ? renderAdminContent() : renderUserContent()}
      </main>
    </AuthenticatedLayout>
  );
}
