/**
 * ─── LIVE VALUATIONS FOR PHYSICAL ASSETS (future) ──────────────────────────
 *
 * v1: every asset's value is typed in by the user.
 *
 * Later each asset type can have a valuer that looks up a current market price
 * and records it as a new valuation (source = 'priced'):
 *   • watch    → Chrono24 (search by brand + model + reference + year, take median asking price)
 *   • car      → e.g. Auto Trader valuations / CAP HPI (make, model, year, mileage)
 *   • property → e.g. Zoopla / HM Land Registry price paid + index (postcode)
 *   • gold     → spot price × weight (e.g. LBMA price feed)
 *   • boat, art, jewellery, chalet, castle → specialist sources or stay manual
 *
 * Implement `AssetValuer` and add it to VALUERS under the holding type id.
 * Price lookups need a server (scraping/API keys), so they ship with the backend.
 */
import type { CurrencyCode } from '../config/currencies';
import type { Holding } from '../domain/types';

export interface Quote {
  value: number;
  currency: CurrencyCode;
  source: string;
  asOf: string;
  url?: string;
}

export interface AssetValuer {
  typeId: string;
  sourceName: string;
  /** Returns a market value for the asset, or null if it can't be priced. */
  quote(asset: Holding): Promise<Quote | null>;
}

export const VALUERS: Record<string, AssetValuer> = {
  // watch: new Chrono24Valuer(),
};

/** Shown in the UI so users know a live price is on its way for this type. */
export const PLANNED_SOURCES: Record<string, string> = {
  watch: 'Chrono24',
  car: 'Auto Trader',
  property: 'Zoopla',
  gold: 'live spot price',
};

export function valuerFor(typeId: string): AssetValuer | undefined {
  return VALUERS[typeId];
}
