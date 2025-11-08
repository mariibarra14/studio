
"use client";

import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function ReportsPage() {
  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Reports</h1>
        <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Reports Content Goes Here</p>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
