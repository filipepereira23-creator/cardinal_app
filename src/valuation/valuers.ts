/**
 * ─── VALUATIONS FOR PHYSICAL ASSETS AND COINS ──────────────────────────────
 *
 * Only free sources that are legal to use and callable straight from the browser, with no secret key
 * in this public bundle. Researched Nov 2026 (v1.4):
 *   • gold / silver / platinum / palladium → LIVE. gold-api.com spot (free, no key, CORS). ./metals.ts
 *   • crypto coins → LIVE. Coinbase public exchange rates (free, no key, CORS) × number of coins. ./crypto.ts
 *   • property → ESTIMATES + LIVE CONTEXT. London £/m² × floor area (./areaPrice.ts), the HM Land Registry
 *     house price index (./houseIndex.ts) and recent sold prices on the same street from HM Land
 *     Registry Price Paid Data (SPARQL, free, CORS; ./streetSales.ts). Zoopla's API is closed: link only.
 *   • watch → ESTIMATE. Last value × the brand's 1-year market trend from WatchCharts' public indexes,
 *     refreshed per release (./watchEstimate.ts). Chrono24 has no API; the WatchCharts API is paid;
 *     eBay's free API needs a private key and forbids price modelling.
 *   • car → ESTIMATE. UK depreciation curve by age and mileage (./carEstimate.ts). Auto Trader / CAP HPI
 *     are paid. DVLA Vehicle Enquiry and DVSA MOT History are free but need a private key: server to-do.
 *   • boat, art, jewellery, chalet, castle → manual.
 */
import type { CurrencyCode } from '../config/currencies';
import type { Holding } from '../domain/types';
import { metalValue, type SpotPrices } from './metals';

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

/** Live: the gold valuer reads the spot price cache the store keeps fresh. */
export function goldQuote(h: Holding, spot: SpotPrices | null): Quote | null {
  const v = metalValue(h, spot, h.currency);
  if (v === null || !spot) return null;
  return { value: v, currency: h.currency, source: 'gold-api.com spot price', asOf: spot.fetchedAt, url: spot.sourceUrl };
}

/** What each asset type can do, for the UI. */
export type PricingMode = 'live' | 'index' | 'estimate' | 'link' | 'manual';
export function pricingMode(typeId: string): PricingMode {
  if (typeId === 'gold') return 'live';
  if (typeId === 'property') return 'index';
  if (typeId === 'watch' || typeId === 'car') return 'estimate';
  return 'manual';
}

const q = (parts: (string | undefined)[]) => parts.map((p) => (p ?? '').trim()).filter(Boolean).join(' ');
const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-');

/** "Check price on …" links built from the asset's own details. */
export function priceCheckLink(h: Pick<Holding, 'type' | 'details' | 'name'>): { label: string; url: string } | null {
  const d = h.details ?? {};
  if (h.type === 'watch') {
    const query = q([d.brand, d.model, d.reference]) || h.name;
    return { label: 'Check price on Chrono24', url: `https://www.chrono24.co.uk/search/index.htm?dosearch=true&query=${encodeURIComponent(query)}` };
  }
  if (h.type === 'car') {
    const p = new URLSearchParams();
    if (d.make) p.set('make', d.make.trim());
    const model = (d.model || '').trim().split(/\s+/)[0];
    if (model) p.set('model', model);
    const year = (d.year || '').match(/\d{4}/)?.[0];
    if (year) {
      p.set('year-from', year);
      p.set('year-to', year);
    }
    if (!d.make) p.set('keywords', h.name);
    return { label: 'Check price on Auto Trader', url: `https://www.autotrader.co.uk/car-search?${p.toString()}` };
  }
  if (h.type === 'property') {
    const pc = (d.postcode || '').trim();
    const path = pc ? `${slug(pc.replace(/\s+/g, ' '))}/` : '';
    return { label: 'Check price on Zoopla', url: `https://www.zoopla.co.uk/house-prices/${path}` };
  }
  return null;
}

/** Auto Trader's free consumer valuation page (needs the registration typed in on their site). */
export const AUTOTRADER_VALUATION_URL = 'https://www.autotrader.co.uk/cars/valuation';
/** moValue: a free UK valuation by registration plate, no account needed (website only, no API). */
export const MOVALUE_URL = 'https://movalue.co.uk/';

/** Days after which a manually valued asset gets a gentle "worth a check" reminder. */
export const STALE_AFTER_DAYS = 90;
