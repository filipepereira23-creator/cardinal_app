/**
 * Watch value ESTIMATE: the user's last value moved by the brand's recent secondary-market trend.
 *
 * No free live watch price feed exists: Chrono24 has no public API, the WatchCharts API is paid
 * (from $199 a month), and eBay's free API returns asking prices only, needs a private key on a
 * server, and its licence forbids using its data to model prices.
 *
 * The trend figures are the 1-year changes of WatchCharts' public market indexes (top 30 models per
 * brand, USD), read by hand from watchcharts.com/watches/indexes on 17 Nov 2026. They are refreshed
 * with each Cardinal release, not live. Brands without an index get no estimate.
 */
import type { Holding } from '../domain/types';
import { sortValuations } from '../domain/calc';
import { parseISO, todayISO } from '../domain/dates';

export const WATCH_INDEX_AS_OF = '17 Nov 2026';
export const WATCH_INDEX_URL = 'https://watchcharts.com/watches/indexes';

/** 1-year % change by brand (lower-case name → %). */
export const WATCH_BRAND_TREND: Record<string, { label: string; pct: number }> = {
  rolex: { label: 'Rolex', pct: 4.7 },
  'patek philippe': { label: 'Patek Philippe', pct: 14.5 },
  patek: { label: 'Patek Philippe', pct: 14.5 },
  'audemars piguet': { label: 'Audemars Piguet', pct: 8.5 },
  ap: { label: 'Audemars Piguet', pct: 8.5 },
  omega: { label: 'Omega', pct: 4.5 },
  cartier: { label: 'Cartier', pct: 7.9 },
  breitling: { label: 'Breitling', pct: 3.7 },
  tudor: { label: 'Tudor', pct: 13.9 },
};

export function brandTrend(brand: string | undefined) {
  const b = (brand || '').trim().toLowerCase();
  return b ? WATCH_BRAND_TREND[b] ?? null : null;
}

export interface WatchEstimate {
  value: number;
  brand: string;
  trendPct: number;
  /** Years of trend applied (at most 1: the index only tells us about the last 12 months). */
  appliedYears: number;
  base: { value: number; date: string };
  olderThanYear: boolean;
}

export function watchEstimate(h: Pick<Holding, 'details' | 'valuations'>): WatchEstimate | null {
  const t = brandTrend(h.details?.brand);
  const vals = sortValuations(h.valuations);
  const last = vals[vals.length - 1];
  if (!t || !last || last.value <= 0) return null;
  const yrs = (parseISO(todayISO()).getTime() - parseISO(last.date).getTime()) / (365.25 * 86_400_000);
  const applied = Math.max(0, Math.min(1, yrs));
  const value = Math.round((last.value * (1 + (t.pct / 100) * applied)) / 10) * 10;
  return { value, brand: t.label, trendPct: t.pct, appliedYears: applied, base: last, olderThanYear: yrs > 1 };
}

/** WatchCharts' free price lookup (Basic plan is free) for the model the user entered. */
export function watchChartsLink(h: Pick<Holding, 'details' | 'name'>): string {
  const d = h.details ?? {};
  const q = [d.brand, d.model, d.reference].map((x) => (x ?? '').trim()).filter(Boolean).join(' ') || h.name;
  return `https://watchcharts.com/watches/search?q=${encodeURIComponent(q)}`;
}
