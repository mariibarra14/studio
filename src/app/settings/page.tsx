
"use client";

import { useState } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, Palette, Map } from "lucide-react";

export default function SettingsPage() {
  const [language, setLanguage] = useState("es");
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Ajustes de la Aplicación</h1>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Globe className="h-6 w-6" />
                  <span>Idioma y Región</span>
                </CardTitle>
                <CardDescription>
                  Personalice el idioma y la región para su experiencia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="language-select" className="text-base">
                    Idioma
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language-select" className="w-[180px]">
                      <SelectValue placeholder="Seleccionar idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="region-select" className="text-base">
                    Cambiar Región
                  </Label>
                  <Select disabled>
                    <SelectTrigger id="region-select" className="w-[180px]">
                      <SelectValue placeholder="Colombia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="co">Colombia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Palette className="h-6 w-6" />
                  <span>Apariencia</span>
                </CardTitle>
                <CardDescription>
                  Personalice la apariencia de la aplicación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-switch" className="text-base">
                    Modo Oscuro
                  </Label>
                  <Switch
                    id="theme-switch"
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
