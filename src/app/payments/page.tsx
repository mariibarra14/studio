"use client";

import { Suspense } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { PaymentProcessing } from "@/components/payments/payment-processing";
import { PaymentHistory } from "@/components/payments/payment-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from 'next/navigation';

function PaymentsPageContent() {
    const searchParams = useSearchParams();
    const reservaId = searchParams.get('reservaId');

    // Determina la pestaña por defecto. Si hay una reservaId, muestra la pestaña de pago.
    const defaultTab = reservaId ? "process-payment" : "history";

    return (
        <AuthenticatedLayout>
            <main className="flex-1 p-4 md:p-8">
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                        <TabsTrigger value="process-payment">Procesar Pago</TabsTrigger>
                        <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="process-payment">
                        <PaymentProcessing />
                    </TabsContent>
                    <TabsContent value="history">
                        <PaymentHistory />
                    </TabsContent>
                </Tabs>
            </main>
        </AuthenticatedLayout>
    );
}

export default function PaymentsPage() {
    return (
        <Suspense fallback={<AuthenticatedLayout><div>Cargando...</div></AuthenticatedLayout>}>
            <PaymentsPageContent />
        </Suspense>
    );
}