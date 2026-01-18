// Currency conversion utilities
// Default exchange rate: 1 USD = 15.5 GHS (can be updated via API later)
const USD_TO_GHS_RATE = 15.5;

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatGHS(amount: number): string {
  return `GH₵${amount.toFixed(2)}`;
}

export function convertUSDToGHS(usdAmount: number): number {
  return usdAmount * USD_TO_GHS_RATE;
}

export function convertGHSToUSD(ghsAmount: number): number {
  return ghsAmount / USD_TO_GHS_RATE;
}

// Format price with both currencies for display
export function formatPriceWithConversion(usdAmount: number): {
  usd: string;
  ghs: string;
  ghsAmount: number;
} {
  const ghsAmount = convertUSDToGHS(usdAmount);
  return {
    usd: formatUSD(usdAmount),
    ghs: formatGHS(ghsAmount),
    ghsAmount,
  };
}
