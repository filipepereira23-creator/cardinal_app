/**
 * Live spot prices for precious metals from gold-api.com (free, no key, CORS: *).
 * Prices are US dollars per troy ounce. Cached in localStorage for 1 hour.
 */
import { convert, type CurrencyCode } from '../config/currencies';
import type { Holding } from '../domain/types';

export type Metal = 'XAU' | 'XAG' | 'XPT' | 'XPD';

export const METALS: { id: Metal; label: string }[] = [
  { id: 'XAU', label: 'Gold' },
  { id: 'XAG', label: 'Silver' },
  { id: 'XPT', label: 'Platinum' },
  { id: 'XPD', label: 'Palladium' },
];

export const PURITIES: { value: string; label: string }[] = [
  { value: '0.9999', label: '24ct · 999.9 fine' },
  { value: '0.999', label: '24ct · 999 fine' },
  { value: '0.9167', label: '22ct · 916 (sovereigns, Krugerrands)' },
  { value: '0.75', label: '18ct · 750' },
  { value: '0.585', label: '14ct · 585' },
  { value: '0.375', label: '9ct · 375' },
  { value: '0.958', label: 'Britannia silver · 958' },
  { value: '0.925', label: 'Sterling silver · 925' },
  { value: '0.95', label: 'Platinum · 950' },
];

export const WEIGHT_UNITS: { value: string; label: string }[] = [
  { value: 'g', label: 'grams' },
  { value: 'oz', label: 'troy ounces' },
  { value: 'kg', label: 'kilograms' },
];

const GRAMS_PER_TROY_OZ = 31.1034768;

export interface SpotPrices {
  /** USD per troy ounce. */
  usdPerOz: Partial<Record<Metal, number>>;
  /** As reported by the source. */
  updatedAt: string;
  fetchedAt: string;
  source: string;
  sourceUrl: string;
}

const KEY = 'cardinal.metals.v1';
const MAX_AGE_MS = 60 * 60 * 1000;

export function readCachedSpot(): SpotPrices | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.usdPerOz && c.usdPerOz.XAU) return c;
  } catch {
    /* ignore */
  }
  return null;
}

export function spotIsFresh(s: SpotPrices | null): boolean {
  return !!s && Date.now() - new Date(s.fetchedAt).getTime() < MAX_AGE_MS;
}

export async function loadSpot(): Promise<SpotPrices | null> {
  const results = await Promise.all(
    METALS.map(async (m) => {
      try {
        const res = await fetch(`https://api.gold-api.com/price/${m.id}`);
        if (!res.ok) return null;
        const j = await res.json();
        return typeof j.price === 'number' && j.price > 0 ? { id: m.id, price: j.price as number, updatedAt: String(j.updatedAt ?? '') } : null;
      } catch {
        return null;
      }
    }),
  );
  const ok = results.filter(Boolean) as { id: Metal; price: number; updatedAt: string }[];
  if (!ok.find((r) => r.id === 'XAU')) return null;
  const s: SpotPrices = {
    usdPerOz: Object.fromEntries(ok.map((r) => [r.id, r.price])),
    updatedAt: ok[0].updatedAt,
    fetchedAt: new Date().toISOString(),
    source: 'gold-api.com',
    sourceUrl: 'https://gold-api.com',
  };
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

/** Reads a metal holding's structured details. Also understands the old free-text form ("Gold", "100 g"). */
export function metalSpec(h: Pick<Holding, 'details'>): { metal: Metal; grams: number; purity: number } | null {
  const d = h.details ?? {};
  const metalRaw = (d.metal || '').trim();
  const metal = (METALS.find((m) => m.id === metalRaw || m.label.toLowerCase() === metalRaw.toLowerCase())?.id ?? null) as Metal | null;
  let weight = Number(String(d.weight ?? '').replace(/[^0-9.]/g, ''));
  let unit = (d.unit || String(d.weight ?? '').replace(/[0-9.\s]/g, '') || 'g').toLowerCase();
  if (!metal || !weight || !Number.isFinite(weight)) return null;
  if (unit.startsWith('k')) weight *= 1000;
  else if (unit.startsWith('oz') || unit.startsWith('troy')) weight *= GRAMS_PER_TROY_OZ;
  unit = 'g';
  const purity = Number(d.purity || (metal === 'XAU' ? '0.999' : metal === 'XAG' ? '0.999' : '0.95'));
  return { metal, grams: weight, purity: purity > 0 && purity <= 1 ? purity : 1 };
}

/** Melt value of a metal holding in `ccy`, or null when it can't be priced. */
export function metalValue(h: Pick<Holding, 'details'>, spot: SpotPrices | null, ccy: CurrencyCode): number | null {
  const spec = metalSpec(h);
  const usd = spec && spot?.usdPerOz[spec.metal];
  if (!spec || !usd) return null;
  const fineOz = (spec.grams * spec.purity) / GRAMS_PER_TROY_OZ;
  return Math.round(convert(fineOz * usd, 'USD', ccy) * 100) / 100;
}

/** Spot price per gram in `ccy` for display. */
export function spotPerGram(metal: Metal, spot: SpotPrices | null, ccy: CurrencyCode): number | null {
  const usd = spot?.usdPerOz[metal];
  return usd ? convert(usd / GRAMS_PER_TROY_OZ, 'USD', ccy) : null;
}
