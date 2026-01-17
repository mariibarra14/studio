"use client";

import { useApp } from "@/context/app-context";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizerRankingReport } from "@/components/reports/global/organizer-ranking";
import { CustomerLoyaltyReport } from "@/components/reports/global/customer-loyalty";
import { ComplementaryServicesReport } from "@/components/reports/global/complementary-services";

export default function GlobalReportsPage() {
  const { userRole, isLoadingUser } = useApp();

  if (isLoadingUser) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </AuthenticatedLayout>
    );
  }

  if (userRole !== 'administrador' && userRole !== 'soporte_tecnico') {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acceso Denegado</AlertTitle>
            <AlertDescription>No tienes permiso para ver esta página.</AlertDescription>
          </Alert>
        </main>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reportes Globales</h1>
            <p className="text-muted-foreground">Visión consolidada del rendimiento de la plataforma.</p>
          </div>
          {/* <Button><Download className="mr-2 h-4 w-4" />Descargar Reporte Global</Button> */}
        </div>
        
        <Tabs defaultValue="organizers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="organizers">Ranking de Organizadores</TabsTrigger>
            <TabsTrigger value="customers">Fidelización de Clientes</TabsTrigger>
            <TabsTrigger value="services">Rendimiento de Servicios</TabsTrigger>
          </TabsList>
          <TabsContent value="organizers">
            <OrganizerRankingReport />
          </TabsContent>
          <TabsContent value="customers">
            <CustomerLoyaltyReport />
          </TabsContent>
          <TabsContent value="services">
            <ComplementaryServicesReport />
          </TabsContent>
        </Tabs>

      </main>
    </AuthenticatedLayout>
  );
}
