/**
 * Currency settings.
 *
 * Cardinal stores every balance in the currency it was entered in and converts
 * at display time using ONE fixed rate per currency.
 *
 * To update the rates, change the numbers below (value of 1 unit in GBP) and
 * bump RATES_AS_OF. Later this file can be replaced by a live FX feed: keep the
 * `convert()` signature and nothing else in the app needs to change.
 */
export type CurrencyCode = 'GBP' | 'EUR' | 'USD';

export const CURRENCIES: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: 'GBP', symbol: '£', name: 'British pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US dollar' },
];

/** How many pounds one unit of each currency is worth. */
export const RATES_IN_GBP: Record<CurrencyCode, number> = {
  GBP: 1,
  EUR: 0.87,
  USD: 0.76,
};

export const RATES_AS_OF = '15 Nov 2026 (fixed)';

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  return (amount * RATES_IN_GBP[from]) / RATES_IN_GBP[to];
}

export function symbolFor(code: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? '';
}

export function formatMoney(amount: number, code: CurrencyCode, opts: { decimals?: boolean; compact?: boolean; sign?: boolean } = {}): string {
  const { decimals = true, compact = false, sign = false } = opts;
  const abs = Math.abs(amount);
  let body: string;
  if (compact && abs >= 1000) {
    body = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: abs >= 1e6 ? 2 : 1 }).format(abs);
  } else {
    body = new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    }).format(abs);
  }
  const prefix = amount < 0 ? '−' : sign ? '+' : '';
  return `${prefix}${symbolFor(code)}${body}`;
}
