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

/** Display preferences set from Settings. Kept here so every formatMoney call follows them. */
export type NumberFormat = 'en-GB' | 'de-DE' | 'fr-FR';
export const NUMBER_FORMATS: { id: NumberFormat; label: string }[] = [
  { id: 'en-GB', label: '1,234.56' },
  { id: 'de-DE', label: '1.234,56' },
  { id: 'fr-FR', label: '1 234,56' },
];
const prefs: { locale: NumberFormat; hide: boolean; decimals: boolean } = { locale: 'en-GB', hide: false, decimals: true };
export function setMoneyPrefs(p: Partial<typeof prefs>) {
  Object.assign(prefs, p);
}

export function formatMoney(amount: number, code: CurrencyCode, opts: { decimals?: boolean; compact?: boolean; sign?: boolean } = {}): string {
  const { compact = false, sign = false } = opts;
  const decimals = (opts.decimals ?? true) && prefs.decimals;
  if (prefs.hide) return `${symbolFor(code)}••••`;
  const abs = Math.abs(amount);
  let body: string;
  if (compact && abs >= 1000) {
    body = new Intl.NumberFormat(prefs.locale, { notation: 'compact', maximumFractionDigits: abs >= 1e6 ? 2 : 1 }).format(abs);
  } else {
    body = new Intl.NumberFormat(prefs.locale, {
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    }).format(abs);
  }
  const prefix = amount < 0 ? '−' : sign ? '+' : '';
  return `${prefix}${symbolFor(code)}${body}`;
}

/** Formats a percentage with the chosen decimal separator, e.g. +2.35% or +2,35%. */
export function formatPct(pct: number, sign = true): string {
  const body = new Intl.NumberFormat(prefs.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(pct));
  return `${pct < 0 ? '−' : sign ? '+' : ''}${body}%`;
}
