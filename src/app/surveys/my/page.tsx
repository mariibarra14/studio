"use client";

import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useTranslation } from "react-i18next";

export default function MySurveysPage() {
  const { t } = useTranslation();
  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">{t('my_surveys.title')}</h1>
        <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">{t('my_surveys.placeholder')}</p>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
