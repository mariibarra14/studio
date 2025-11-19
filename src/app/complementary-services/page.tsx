
"use client";

import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function ComplementaryServicesPage() {
  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Servicios Complementarios</h1>
        <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">
              El contenido de los servicios complementarios va aquí
            </p>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
