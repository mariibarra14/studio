
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Currency } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: Currency, language: string) {
  if (typeof amount !== 'number') {
    amount = 0;
  }
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
  }).format(amount);
}
