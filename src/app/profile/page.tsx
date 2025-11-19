
"use client";

import { ActivityHistory } from "@/components/profile/activity-history";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { PaymentMethods } from "@/components/profile/payment-methods";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, History } from 'lucide-react';
import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function ProfilePage() {
  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Gestión de Cuenta</h1>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:w-[400px]">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="mr-2 h-4 w-4" />
              Métodos de Pago
            </TabsTrigger>
            <TabsTrigger value="activity">
              <History className="mr-2 h-4 w-4" />
              Historial de Actividad
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <div className="mt-6 grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualice sus datos personales aquí.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileDetailsForm />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>Actualice la contraseña de su cuenta.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangePasswordForm />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="payment">
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Métodos de Pago</CardTitle>
                  <CardDescription>Administre sus métodos de pago guardados.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentMethods />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="activity">
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Actividad</CardTitle>
                  <CardDescription>Un registro de la actividad reciente de su cuenta.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityHistory />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </AuthenticatedLayout>
  );
}
