
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Currency } from "./types";
import type { ConversionRates } from "./currency-converter";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amountInUSD: number, 
  targetCurrency: Currency, 
  language: string,
  rates?: ConversionRates
) {
  if (typeof amountInUSD !== 'number') {
    amountInUSD = 0;
  }
  
  // Use a default rate of 1 if rates are not provided
  const rate = rates ? (rates[targetCurrency.code] || 1) : 1;
  const convertedAmount = amountInUSD * rate;

  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: targetCurrency.code,
    minimumFractionDigits: 2,
  }).format(convertedAmount);
}
