
"use client";

import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-context";
import { PlusCircle } from "lucide-react";

export default function MyEventsPage() {
  const { userRole } = useApp();

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Mis Eventos</h1>
          {(userRole === 'organizador' || userRole === 'administrador') && (
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Evento
              </Button>
            )}
        </div>
        <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Esta sección está en construcción</p>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
