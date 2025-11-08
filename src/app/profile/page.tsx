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
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:w-[400px]">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="mr-2 h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="activity">
              <History className="mr-2 h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <div className="mt-6 grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileDetailsForm />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password.</CardDescription>
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
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your saved payment methods.</CardDescription>
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
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>A log of your recent account activity.</CardDescription>
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
