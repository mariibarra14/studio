
"use client";

import { ActivityHistory } from "@/components/profile/activity-history";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { PaymentMethods } from "@/components/profile/payment-methods";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { PreferencesForm } from "@/components/profile/preferences-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, History, Heart } from 'lucide-react';
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useApp } from "@/context/app-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { user, isLoadingUser, userRole } = useApp();
  const { t } = useTranslation();

  const showPaymentMethods = userRole === 'usuario_final' || userRole === 'administrador';

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">{t('profile.title')}</h1>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              {t('profile.tabs.profile')}
            </TabsTrigger>
            {showPaymentMethods && (
              <TabsTrigger value="payment">
                <CreditCard className="mr-2 h-4 w-4" />
                {t('profile.tabs.payment')}
              </TabsTrigger>
            )}
            <TabsTrigger value="activity">
              <History className="mr-2 h-4 w-4" />
              {t('profile.tabs.activity')}
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Heart className="mr-2 h-4 w-4" />
              {t('profile.tabs.preferences')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <div className="mt-6 grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.personal_info.title')}</CardTitle>
                  <CardDescription>{t('profile.personal_info.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUser ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <div className="flex justify-end">
                        <Skeleton className="h-10 w-24" />
                      </div>
                    </div>
                  ) : user ? (
                    <ProfileDetailsForm user={user} />
                  ) : (
                    <p>No se pudo cargar la información del usuario.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.change_password.title')}</CardTitle>
                  <CardDescription>{t('profile.change_password.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangePasswordForm />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {showPaymentMethods && (
            <TabsContent value="payment">
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('profile.payment_methods.title')}</CardTitle>
                    <CardDescription>{t('profile.payment_methods.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PaymentMethods />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
          <TabsContent value="activity">
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.activity_history.title')}</CardTitle>
                  <CardDescription>{t('profile.activity_history.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityHistory />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="preferences">
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.content_preferences.title')}</CardTitle>
                  <CardDescription>
                    {t('profile.content_preferences.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUser ? (
                     <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <div className="flex justify-end">
                        <Skeleton className="h-10 w-24" />
                      </div>
                    </div>
                  ) : user ? (
                    <PreferencesForm user={user} />
                  ) : (
                    <p>No se pudo cargar la información del usuario.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </AuthenticatedLayout>
  );
}
