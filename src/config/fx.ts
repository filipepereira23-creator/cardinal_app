/**
 * ─── LIVE EXCHANGE RATES ───────────────────────────────────────────────────
 *
 * Free, keyless, CORS-friendly sources, tried in order:
 *   1. Frankfurter (European Central Bank reference rates, updated each working day ~16:00 CET)
 *      api.frankfurter.app now redirects to api.frankfurter.dev/v1, so we call that directly
 *      and keep the .app address as a second try.
 *   2. open.er-api.com (ExchangeRate-API free tier, updated daily)
 * The result is cached in localStorage with a timestamp and reused for 6 hours.
 * Offline with nothing cached: the fixed FALLBACK rates in currencies.ts.
 */
import { CURRENCY_CODES, FALLBACK_AS_OF, FALLBACK_RATES_IN_GBP, setRates, type CurrencyCode } from './currencies';

export interface FxInfo {
  /** Value of 1 unit in GBP. */
  rates: Record<CurrencyCode, number>;
  /** The date the source says the rates are for (YYYY-MM-DD). */
  asOf: string;
  source: string;
  sourceUrl: string;
  /** When Cardinal fetched them (ISO), or null for the built-in fallback. */
  fetchedAt: string | null;
  live: boolean;
}

const KEY = 'cardinal.fx.v1';
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

export const FALLBACK_FX: FxInfo = {
  rates: { ...FALLBACK_RATES_IN_GBP },
  asOf: FALLBACK_AS_OF,
  source: 'Built-in fixed rates (offline)',
  sourceUrl: '',
  fetchedAt: null,
  live: false,
};

/** "per GBP" rates (1 GBP = x units) → "in GBP" rates (1 unit = y GBP). */
function invert(perGbp: Record<string, number>): Partial<Record<CurrencyCode, number>> {
  const out: Partial<Record<CurrencyCode, number>> = { GBP: 1 };
  for (const c of CURRENCY_CODES) {
    const x = perGbp[c];
    if (typeof x === 'number' && x > 0) out[c] = 1 / x;
  }
  return out;
}

function complete(r: Partial<Record<CurrencyCode, number>>): r is Record<CurrencyCode, number> {
  return CURRENCY_CODES.every((c) => typeof r[c] === 'number' && (r[c] as number) > 0);
}

async function getJSON(url: string, ms = 8000): Promise<any> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

type Source = { name: string; url: string; info: string; parse: (j: any) => { rates: Partial<Record<CurrencyCode, number>>; asOf: string } };

const symbols = CURRENCY_CODES.filter((c) => c !== 'GBP').join(',');
const SOURCES: Source[] = [
  {
    name: 'European Central Bank via Frankfurter',
    url: `https://api.frankfurter.dev/v1/latest?base=GBP&symbols=${symbols}`,
    info: 'https://frankfurter.dev',
    parse: (j) => ({ rates: invert(j.rates), asOf: j.date }),
  },
  {
    name: 'European Central Bank via Frankfurter',
    url: `https://api.frankfurter.app/latest?from=GBP&to=${symbols}`,
    info: 'https://frankfurter.dev',
    parse: (j) => ({ rates: invert(j.rates), asOf: j.date }),
  },
  {
    name: 'ExchangeRate-API (open.er-api.com)',
    url: 'https://open.er-api.com/v6/latest/GBP',
    info: 'https://www.exchangerate-api.com',
    parse: (j) => {
      if (j.result !== 'success') throw new Error('er-api failed');
      return { rates: invert(j.rates), asOf: new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10) };
    },
  },
];

export function readCachedFx(): FxInfo | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.rates && complete(c.rates)) return { ...c, live: true };
  } catch {
    /* ignore */
  }
  return null;
}

/** Applies cached rates at once (so the first render already uses them), else the fallback. */
export function initialFx(): FxInfo {
  const fx = readCachedFx() ?? FALLBACK_FX;
  setRates(fx.rates);
  return fx;
}

export function fxIsFresh(fx: FxInfo): boolean {
  return !!fx.fetchedAt && Date.now() - new Date(fx.fetchedAt).getTime() < MAX_AGE_MS;
}

/** Fetches live rates (first source that answers with all 10 currencies wins), caches and applies them. */
export async function loadLiveFx(): Promise<FxInfo | null> {
  for (const s of SOURCES) {
    try {
      const { rates, asOf } = s.parse(await getJSON(s.url));
      if (!complete(rates)) continue;
      const fx: FxInfo = { rates, asOf, source: s.name, sourceUrl: s.info, fetchedAt: new Date().toISOString(), live: true };
      localStorage.setItem(KEY, JSON.stringify(fx));
      setRates(rates);
      return fx;
    } catch {
      /* try the next source */
    }
  }
  return null;
}
