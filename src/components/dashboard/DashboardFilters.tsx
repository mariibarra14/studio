
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/lib/types";
import { Filter, X } from "lucide-react";

type DashboardFiltersProps = {
  filters: {
    categoryId: string;
    startDate: string;
    endDate: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<typeof filters>>;
  categories: Category[];
};

export function DashboardFilters({ filters, setFilters, categories }: DashboardFiltersProps) {
  const handleClear = () => {
    setFilters({ categoryId: "", startDate: "", endDate: "" });
  };
  
  const activeFiltersCount = [
    filters.categoryId,
    filters.startDate,
    filters.endDate
  ].filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar Dashboard
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filtros</h4>
            <p className="text-sm text-muted-foreground">
              Ajusta los filtros para el dashboard.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) => setFilters(f => ({ ...f, categoryId: value === 'all' ? '' : value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rango de Fechas (Creación de Evento)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  min={filters.startDate}
                />
              </div>
            </div>
          </div>
           <Button onClick={handleClear} variant="ghost" size="sm" className="w-full justify-center">
            <X className="mr-2 h-4 w-4" />
            Limpiar Filtros
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
