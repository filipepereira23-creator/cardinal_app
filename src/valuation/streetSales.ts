/**
 * Recent sold prices near a property, live from HM Land Registry Price Paid Data.
 * Free, no key, and the SPARQL endpoint answers browser requests (CORS). England and Wales only.
 *   1. Sales on the same street within the same postcode district (street taken from the address).
 *   2. Otherwise, sales at the same full postcode.
 * Shown as context next to the user's own value; a street mixes flat sizes, so it is not a valuation.
 * Licence: Open Government Licence v3.0. Address data may be displayed to provide property price information.
 */
import { outwardCode } from './areaPrice';

export interface Sale {
  price: number;
  date: string;
  address: string;
  /** House number or building name (PAON). */
  paon: string;
  type: string;
  postcode: string;
}

export interface SalesResult {
  scope: 'street' | 'postcode';
  label: string;
  sales: Sale[];
  /** Sales in the user's own building (same house number on the same street). */
  building: Sale[];
  median: number | null;
  since: string;
  fetchedAt: string;
}

export const PPD_ATTRIBUTION = 'Contains HM Land Registry data © Crown copyright and database right 2026. This data is licensed under the Open Government Licence v3.0.';
export const PPD_URL = 'https://landregistry.data.gov.uk/app/ppd';
const ENDPOINT = 'https://landregistry.data.gov.uk/landregistry/query';
const CACHE_KEY = 'cardinal.ppd.v1';
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

const TYPES: Record<string, string> = { 'flat-maisonette': 'Flat', terraced: 'Terraced', 'semi-detached': 'Semi-detached', detached: 'Detached', otherPropertyType: 'Other' };

/** "Flat 3, 7 Bramham Gardens, London" → { number: '7', street: 'BRAMHAM GARDENS' }. */
export function parseStreet(address: string | undefined): { number: string | null; street: string | null } {
  if (!address) return { number: null, street: null };
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    if (/^(flat|apartment|apt|unit|studio)\b/i.test(p)) continue;
    const m = p.match(/^(\d+[a-z]?(?:\s*-\s*\d+)?)\s+(.+)$/i);
    const street = (m ? m[2] : p).replace(/[^a-z' -]/gi, '').trim();
    if (street.split(/\s+/).length >= 2 || /\b(road|street|gardens|lane|avenue|square|place|terrace|way|close|crescent|drive|court|grove|hill|mews|row|walk|park)\b/i.test(street)) {
      return { number: m ? m[1].replace(/\s+/g, '') : null, street: street.toUpperCase() };
    }
  }
  return { number: null, street: null };
}

function normPostcode(pc: string): string {
  const s = pc.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length > 3 ? `${s.slice(0, -3)} ${s.slice(-3)}` : s;
}

const lit = (s: string) => `"${s.replace(/["\\]/g, '')}"`;

function query(where: string, since: string): string {
  return `PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
SELECT ?amount ?date ?paon ?saon ?street ?ptype ?pc WHERE {
  ${where}
  ?tx lrppi:propertyAddress ?addr ; lrppi:pricePaid ?amount ; lrppi:transactionDate ?date ; lrppi:propertyType ?ptype .
  OPTIONAL {?addr lrcommon:paon ?paon} OPTIONAL {?addr lrcommon:saon ?saon} OPTIONAL {?addr lrcommon:street ?street} OPTIONAL {?addr lrcommon:postcode ?pc}
  FILTER(?date >= "${since}"^^<http://www.w3.org/2001/XMLSchema#date>)
} ORDER BY DESC(?date) LIMIT 80`;
}

async function run(q: string): Promise<Sale[]> {
  const res = await fetch(`${ENDPOINT}?output=json&query=${encodeURIComponent(q)}`, { headers: { Accept: 'application/sparql-results+json' } });
  if (!res.ok) throw new Error(`Land Registry ${res.status}`);
  const j = await res.json();
  const v = (b: any, k: string) => (b[k]?.value ?? '') as string;
  return (j.results?.bindings ?? []).map((b: any) => {
    const paon = v(b, 'paon');
    const saon = v(b, 'saon');
    const street = v(b, 'street');
    const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      price: Number(v(b, 'amount')),
      date: v(b, 'date').slice(0, 10),
      paon,
      address: [saon && title(saon), [paon, street && title(street)].filter(Boolean).join(' ')].filter(Boolean).join(', '),
      type: TYPES[v(b, 'ptype').split('/').pop() || ''] ?? 'Other',
      postcode: v(b, 'pc'),
    } as Sale;
  }).filter((s: Sale) => s.price > 0);
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export async function recentSales(details: Record<string, string> | undefined): Promise<SalesResult | null> {
  const pcRaw = details?.postcode?.trim();
  if (!pcRaw) return null;
  const pc = normPostcode(pcRaw);
  const { number, street } = parseStreet(details?.address);
  const key = `${pc}|${street ?? ''}|${number ?? ''}`;
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const c = cache[key];
    if (c && Date.now() - new Date(c.fetchedAt).getTime() < MAX_AGE_MS) return c as SalesResult;
  } catch {
    /* ignore */
  }
  const d = new Date();
  const since = new Date(d.getFullYear() - 5, d.getMonth(), 1).toISOString().slice(0, 10);
  let scope: SalesResult['scope'] = 'street';
  let sales: Sale[] = [];
  if (street) {
    const district = outwardCode(pc);
    sales = await run(query(`?addr lrcommon:street ${lit(street)} ; lrcommon:postcode ?pcf . FILTER(STRSTARTS(?pcf, ${lit(district + ' ')}))`, since));
  }
  if (!sales.length) {
    scope = 'postcode';
    sales = await run(query(`?addr lrcommon:postcode ${lit(pc)} .`, since));
  }
  // "Other" entries are often commercial or part-of-building transfers (e.g. £20k), so leave them out of the median.
  const residential = sales.filter((s) => s.type !== 'Other');
  const threeYrs = new Date(d.getFullYear() - 3, d.getMonth(), 1).toISOString().slice(0, 10);
  const building = number && scope === 'street' ? sales.filter((s) => s.paon.replace(/\s+/g, '').toUpperCase() === number.toUpperCase()) : [];
  const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const result: SalesResult = {
    scope,
    label: scope === 'street' && street ? title(street) : pc,
    sales,
    building,
    median: median(residential.filter((s) => s.date >= threeYrs).map((s) => s.price)),
    since,
    fetchedAt: new Date().toISOString(),
  };
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[key] = result;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage full: skip cache */
  }
  return result;
}
