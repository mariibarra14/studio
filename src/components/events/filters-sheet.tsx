
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { Category } from "@/lib/categories";

type FiltersSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  categories: Category[];
  clearFilters: () => void;
};

export function FiltersSheet({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  dateRange,
  setDateRange,
  categories,
  clearFilters,
}: FiltersSheetProps) {
    
  const handleClearAndClose = () => {
    clearFilters();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl">Filtrar Eventos</SheetTitle>
          <SheetDescription>
            Ajusta los filtros para encontrar exactamente lo que buscas.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-6 px-1 space-y-8">
          <div className="space-y-4">
            <Label htmlFor="search" className="text-base">Buscar por Nombre</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="search"
                type="search"
                placeholder="Nombre del evento..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="category" className="text-base">Categoría</Label>
            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.Nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
             <Label className="text-base">Rango de Fechas</Label>
             <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-normal text-muted-foreground">Desde</Label>
                    <Input
                        id="start-date"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm font-normal text-muted-foreground">Hasta</Label>
                    <Input
                        id="end-date"
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                        min={dateRange.start}
                    />
                </div>
             </div>
          </div>

        </div>
        <SheetFooter className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleClearAndClose}>
                <X className="mr-2 h-4 w-4"/>
                Limpiar Filtros
            </Button>
            <SheetClose asChild>
                <Button>Aplicar Filtros</Button>
            </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
