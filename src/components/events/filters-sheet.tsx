
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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
    
  const handleClearAndClose = () => {
    clearFilters();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl">{t('filters.title')}</SheetTitle>
          <SheetDescription>
            {t('filters.description')}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-6 px-1 space-y-8">
          <div className="space-y-4">
            <Label htmlFor="search" className="text-base">{t('filters.search_by_name')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="search"
                type="search"
                placeholder={t('filters.event_name_placeholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="category" className="text-base">{t('filters.category')}</Label>
            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder={t('filters.all_categories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all_categories')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {t(`categories.${cat.nombre}` as const, { defaultValue: cat.nombre })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
             <Label className="text-base">{t('filters.date_range')}</Label>
             <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-normal text-muted-foreground">{t('filters.from')}</Label>
                    <Input
                        id="start-date"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm font-normal text-muted-foreground">{t('filters.to')}</Label>
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
                {t('filters.clear')}
            </Button>
            <SheetClose asChild>
                <Button>{t('filters.apply')}</Button>
            </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
