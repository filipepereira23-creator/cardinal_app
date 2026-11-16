/**
 * Currency settings.
 *
 * Cardinal stores every balance in the currency it was entered in and converts
 * at display time. Rates are "value of 1 unit in GBP".
 *
 * On load, src/config/fx.ts fetches live ECB reference rates (Frankfurter, with
 * open.er-api.com as a fallback), caches them in localStorage and calls
 * `setRates()`. If the device is offline and nothing is cached, the fixed
 * FALLBACK rates below are used. `convert()` keeps the same signature either way.
 */
export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'JPY' | 'CNY' | 'CHF' | 'AUD' | 'CAD' | 'HKD' | 'SGD';

/** USD, GBP, EUR first (in that order), then the rest of the world's most traded currencies. */
export const CURRENCIES: { code: CurrencyCode; symbol: string; name: string; decimals: number }[] = [
  { code: 'USD', symbol: '$', name: 'US dollar', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British pound', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese yen', decimals: 0 },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese yuan', decimals: 2 },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss franc', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian dollar', decimals: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian dollar', decimals: 2 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong dollar', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore dollar', decimals: 2 },
];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);

export function isCurrency(c: unknown): c is CurrencyCode {
  return typeof c === 'string' && (CURRENCY_CODES as string[]).includes(c);
}

/** Offline fallback: how many pounds one unit is worth (ECB reference rates, 16 Nov 2026). */
export const FALLBACK_RATES_IN_GBP: Record<CurrencyCode, number> = {
  USD: 0.7577,
  GBP: 1,
  EUR: 0.8345,
  JPY: 0.004747,
  CNY: 0.1137,
  CHF: 0.9028,
  AUD: 0.5119,
  CAD: 0.5304,
  HKD: 0.09656,
  SGD: 0.5879,
};
export const FALLBACK_AS_OF = '2026-11-16';

/** The rates in use right now. Mutated in place by setRates() so every convert() call follows. */
export const RATES_IN_GBP: Record<CurrencyCode, number> = { ...FALLBACK_RATES_IN_GBP };

export function setRates(r: Partial<Record<CurrencyCode, number>>) {
  for (const c of CURRENCY_CODES) {
    const v = r[c];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) RATES_IN_GBP[c] = v;
  }
  RATES_IN_GBP.GBP = 1;
}

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  const f = RATES_IN_GBP[from] ?? 1;
  const t = RATES_IN_GBP[to] ?? 1;
  return (amount * f) / t;
}

export function symbolFor(code: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? `${code} `;
}

function decimalsFor(code: CurrencyCode): number {
  return CURRENCIES.find((c) => c.code === code)?.decimals ?? 2;
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
  const dp = (opts.decimals ?? true) && prefs.decimals ? decimalsFor(code) : 0;
  if (prefs.hide) return `${symbolFor(code)}••••`;
  const abs = Math.abs(amount);
  let body: string;
  if (compact && abs >= 1000) {
    body = new Intl.NumberFormat(prefs.locale, { notation: 'compact', maximumFractionDigits: abs >= 1e6 ? 2 : 1 }).format(abs);
  } else {
    body = new Intl.NumberFormat(prefs.locale, { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(abs);
  }
  const prefix = amount < 0 ? '−' : sign ? '+' : '';
  return `${prefix}${symbolFor(code)}${body}`;
}

/** Formats a percentage with the chosen decimal separator, e.g. +2.35% or +2,35%. */
export function formatPct(pct: number, sign = true): string {
  const body = new Intl.NumberFormat(prefs.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(pct));
  return `${pct < 0 ? '−' : sign ? '+' : ''}${body}%`;
}
