
"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { useTranslation } from "react-i18next";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Globe, MapPin, Save } from "lucide-react";

export default function SettingsPage() {
  const {
    language,
    currency,
    setLocale,
    detectedRegion,
    isLoadingLocale,
    supportedCurrencies,
    supportedLanguages,
  } = useApp();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(currency.code);

  useEffect(() => {
    // Sync local state if global context changes (e.g. on initial load or after saving)
    setSelectedLanguage(language);
    setSelectedCurrencyCode(currency.code);
  }, [language, currency.code]);

  const handleSave = () => {
    setLocale(selectedLanguage, selectedCurrencyCode);
    toast({
      title: "Ajustes Guardados",
      description: "Tu idioma y moneda han sido actualizados.",
    });
  };

  const hasChanges = selectedLanguage !== language || selectedCurrencyCode !== currency.code;

  if (isLoadingLocale) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-10 w-1/2 mb-8" />
            <div className="grid gap-8">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{t('settings.title')}</h1>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Globe className="h-6 w-6" />
                  <span>{t('settings.region.title')}</span>
                </CardTitle>
                <CardDescription>
                  {t('settings.region.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="language-select" className="text-base">
                    {t('settings.region.language')}
                  </Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                  >
                    <SelectTrigger id="language-select" className="w-[180px]">
                      <SelectValue placeholder={t('settings.region.select_language')} />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="currency-select" className="text-base">
                    {t('settings.region.currency')}
                  </Label>
                  <Select
                    value={selectedCurrencyCode}
                    onValueChange={setSelectedCurrencyCode}
                  >
                    <SelectTrigger id="currency-select" className="w-[180px]">
                      <SelectValue placeholder={t('settings.region.select_currency')} />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedCurrencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={handleSave} disabled={!hasChanges}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.save_button')}
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <MapPin className="h-5 w-5" />
                  <span>{t('settings.detection.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {detectedRegion ? (
                    <>
                      {t('settings.detection.detected_in')} <span className="font-semibold text-foreground">{detectedRegion.name}</span>. {t('settings.detection.auto_config')}
                    </>
                  ) : (
                    t('settings.detection.not_detected')
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
