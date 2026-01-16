
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
  rates: ConversionRates
) {
  if (typeof amountInUSD !== 'number') {
    amountInUSD = 0;
  }
  
  const rate = rates[targetCurrency.code];
  const convertedAmount = rate ? amountInUSD * rate : amountInUSD;

  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: targetCurrency.code,
    minimumFractionDigits: 2,
  }).format(convertedAmount);
}
