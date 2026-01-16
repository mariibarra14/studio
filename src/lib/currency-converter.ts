export type ConversionRates = {
  [key: string]: number;
};

// Mock rates with USD as the base (USD: 1)
const mockRates: ConversionRates = {
  USD: 1,
  EUR: 0.92, // 1 USD = 0.92 EUR
  COP: 4100, // 1 USD = 4100 COP
};

/**
 * Fetches the latest currency conversion rates.
 * In a real application, this would call an external API.
 * @returns A promise that resolves to an object with currency codes as keys and their rates relative to USD as values.
 */
export const getConversionRates = async (): Promise<ConversionRates> => {
  // In a real app, you would fetch this from an API like:
  // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  // const data = await response.json();
  // return data.rates;
  
  // For now, we return mock data after a short delay to simulate a network request.
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockRates);
    }, 200); // 200ms delay
  });
};
